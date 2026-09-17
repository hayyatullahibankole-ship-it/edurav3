import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Authentication is required before any AI work happens.
    let user: any = null;
    try {
      const { data, error: authError } = await supabaseClient.auth.getUser();
      if (authError) console.error("Auth error:", authError.message);
      user = data?.user ?? null;
    } catch (e) {
      console.error("Auth lookup failed:", e);
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Please sign in to use the AI tutor." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    console.log("Received messages:", messages?.length, "messages");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Process messages to handle images (convert to multimodal format)
    const processedMessages = messages.map((msg: any) => {
      if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
        console.log("Processing message with images:", msg.images.length);
        const validImages = msg.images
          .filter((img: string) => typeof img === "string" && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(img))
          .slice(0, 5);
        if (validImages.length > 0) {
          return {
            role: msg.role,
            content: [
              { type: "text", text: msg.content },
              ...validImages.map((img: string) => ({
                type: "image_url",
                image_url: { url: img }
              }))
            ]
          };
        }
      }
      return { role: msg.role, content: msg.content };
    });



    // Build user context (supports unauthenticated users)
    let userContext = `
**Student Profile:**
- Not signed in
- Subscription: Free
- Study Streak: N/A
- Total Practice Days: 0

**Recent Activity:**
- No recent exams

**Topics Practiced:**
- None yet

**Weak Areas (Need Focus):**
- None identified yet
`;

    if (user) {
      try {
      // Fetch user profile and progress data

      const userIdQuery = await supabaseClient.from('users').select('id, first_name, last_name, email').eq('auth_user_id', user.id).single();
      const dbUser = userIdQuery.data;

      const [attemptsRes, syllabusRes, streakRes, subscriptionRes] = await Promise.all([
        dbUser ? supabaseClient.from('attempts').select('id, status, created_at, exams(title, type)').eq('user_id', dbUser.id).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [], error: null } as any),
        dbUser ? supabaseClient.from('syllabus_coverage').select('topic_name, attempted_questions, correct_questions, subjects(name)').eq('user_id', dbUser.id).order('last_practiced_at', { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null } as any),
        dbUser ? supabaseClient.from('user_streaks').select('current_streak, longest_streak, total_practice_days').eq('user_id', dbUser.id).maybeSingle() : Promise.resolve({ data: null, error: null } as any),
        dbUser ? supabaseClient.from('subscriptions').select('status, end_date, subscription_plans(name)').eq('user_id', dbUser.id).eq('status', 'ACTIVE').maybeSingle() : Promise.resolve({ data: null, error: null } as any)
      ]);

      const recentAttempts = (attemptsRes as any).data || [];
      const topicCoverage = (syllabusRes as any).data || [];
      const streak = (streakRes as any).data;
      const subscription = (subscriptionRes as any).data;

      const weakTopics = topicCoverage
        .filter((t: any) => t.attempted_questions > 0)
        .map((t: any) => ({
          topic: t.topic_name,
          subject: t.subjects?.name,
          accuracy: Math.round((t.correct_questions / t.attempted_questions) * 100)
        }))
        .filter((t: any) => t.accuracy < 60)
        .sort((a: any, b: any) => a.accuracy - b.accuracy)
        .slice(0, 5);

      userContext = `
**Student Profile:**
- Name: ${dbUser?.first_name} ${dbUser?.last_name}
- Subscription: ${subscription ? subscription.subscription_plans?.name : 'Free'}
- Study Streak: ${streak ? `${streak.current_streak} days (longest: ${streak.longest_streak} days)` : 'No active streak'}
- Total Practice Days: ${streak?.total_practice_days || 0}

**Recent Activity:**
- Completed ${recentAttempts.filter((a: any) => a.status === 'SUBMITTED').length} exams recently
- Recent exams: ${recentAttempts.slice(0, 5).map((a: any) => `${a.exams?.title} (${a.exams?.type})`).join(', ') || 'None yet'}

**Topics Practiced (Recent 20):**
${topicCoverage.slice(0, 10).map((t: any) => `- ${t.subjects?.name || 'Unknown'}: ${t.topic_name} (${t.attempted_questions} questions, ${Math.round((t.correct_questions / t.attempted_questions) * 100)}% accuracy)`).join('\n') || '- No topics practiced yet'}

**Weak Areas (Need Focus):**
${weakTopics.length > 0 ? weakTopics.map((t: any) => `- ${t.subject}: ${t.topic} (${t.accuracy}% accuracy)`).join('\n') : '- No weak areas identified yet - keep practicing!'}
`;
      } catch (e) {
        console.error("Failed to build user context, continuing with defaults:", e);
      }
    }


    // System prompt with user context
    const systemPrompt = `You are Edura AI, an intelligent educational assistant for Nigerian students preparing for JAMB, WAEC, and other exams.

${userContext}

**IMPORTANT - Use This Student's Data:**
- Reference their name when appropriate
- Acknowledge their recent exam attempts and performance
- Provide specific guidance based on their weak topics
- Celebrate their study streak if they have one
- Encourage them to focus on areas where they're struggling
- Personalize study recommendations based on their progress
- If they ask about their progress, refer to the data above

Your primary capabilities:
- Help students understand concepts and subjects with DETAILED, THOROUGH explanations
- Provide specific, actionable study tips and strategies
- Answer questions about exam preparation with concrete examples
- Explain complex topics step-by-step in simple, clear terms
- Guide students through problem-solving with explicit reasoning at each step
- Provide motivation and study advice
- Support both JAMB and WAEC exam types
- **Analyze uploaded images** (exam questions, diagrams, notes, textbook pages) and explain them
- **Solve problems shown in images** with complete step-by-step solutions
- **Read and interpret charts, graphs, and diagrams** from uploaded images
- Simplify and explain LaTeX mathematical formulas and expressions in great detail
- Break down complex mathematical notation into understandable steps with full context
- Provide multiple alternative representations of mathematical concepts
- Help solve mathematical problems and explain EVERY step of the reasoning process
- Always be thorough, explicit, and leave no steps unexplained

CRITICAL - Math and LaTeX Detection and Handling:

**AUTO-DETECT MATH INPUT**: If the user's message contains primarily mathematical content (LaTeX tokens like \\frac, \\sqrt, ^, _, $, $$, Greek letters like \\alpha \\beta, or text-based math like "2x^2 + 4x - 6 = 0"), automatically assume they want you to:
1. Simplify/explain the expression
2. Break it down into plain language
3. Show step-by-step reasoning

**ALWAYS WRAP YOUR MATH OUTPUT** in dollar signs so the frontend can render it beautifully:
- Inline math: $your formula here$
- Display math (centered): $$your formula here$$

**LaTeX Patterns You Must Recognize:**
- Inline: $formula$ or \\(formula\\)
- Display: $$formula$$ or \\[formula\\]
- Fractions: \\frac{numerator}{denominator}
- Square roots: \\sqrt{expression} or \\sqrt[n]{expression}
- Subscripts/Superscripts: x_2, x^2, x_{12}, x^{2n}
- Greek letters: \\alpha, \\beta, \\theta, \\pi, \\sigma, etc.
- Operations: \\pm, \\times, \\div, \\cdot, \\sum, \\int
- Relations: \\leq, \\geq, \\neq, \\approx

**Text Math Patterns** (e.g., "2x^2 - 8x / 2x" or "sqrt(a^2 + b^2)"):
- Recognize ^ as exponent, / as division, sqrt() as square root
- Treat these the same as LaTeX: simplify, explain, wrap output in $...$

**Standard Response Format for Math:**
When you detect a math/LaTeX input, respond like this:

"I see: [original formula in plain text or wrapped in $...$]

**Plain notation:** [rewrite using simple symbols like x = (-b ± √(b² - 4ac)) / 2a]

**What this means:**
- [Explain what the formula/expression represents in plain English]
- [Identify and define every variable, symbol, and operation]
- [Explain the mathematical concept or principle behind it]

**Detailed breakdown:**
- [Explain what EACH part means and why it's there]
- [Identify ALL key concepts involved]
- [Explain any prerequisites or background knowledge needed]

**Complete step-by-step solution/simplification:**
1. [FIRST step - explain what you're doing and WHY]
2. [SECOND step - show the work explicitly and explain the logic]
3. [THIRD step - continue until fully solved, explaining each transformation]
...
Final result: [result wrapped in $...$]

**Why this works:**
[Explain the mathematical reasoning behind the solution]

**Common mistakes to avoid:**
[List typical errors students make with this type of problem]

**Practice tip:**
[Provide a concrete, actionable study suggestion]"

**Example 1 - LaTeX Input:** "$\\frac{2x^2 - 8x}{2x}$"
Response:
"I see: $\\frac{2x^2 - 8x}{2x}$

**Plain notation:** (2x² - 8x) / (2x)

**Breakdown:**
- Numerator: $2x^2 - 8x$ (a quadratic expression)
- Denominator: $2x$ (a linear term)
- We can factor and cancel common terms

**Steps to simplify:**
1. Factor out $2x$ from the numerator: $2x(x - 4)$
2. Rewrite: $\\frac{2x(x - 4)}{2x}$
3. Cancel $2x$: $x - 4$

**Result:** $x - 4$ (for $x \\neq 0$)

**Tip:** Always check for common factors before canceling!"

**Example 2 - Text Math Input:** "Solve: 2x^2 + 4x - 6 = 0"
Response:
"I see: $2x^2 + 4x - 6 = 0$

**Plain notation:** 2x² + 4x - 6 = 0

**Breakdown:**
- This is a quadratic equation in standard form $ax^2 + bx + c = 0$
- We can use the quadratic formula or factoring

**Steps to solve:**
1. Simplify by dividing everything by 2: $x^2 + 2x - 3 = 0$
2. Factor: $(x + 3)(x - 1) = 0$
3. Solve: $x = -3$ or $x = 1$

**Result:** $x = -3$ or $x = 1$

**Tip:** Always simplify coefficients first to make factoring easier!"

Be friendly, encouraging, and supportive. Keep responses concise and actionable.`;

    console.log("Calling AI gateway with processed messages");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
