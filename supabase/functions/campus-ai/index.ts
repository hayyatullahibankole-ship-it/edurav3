import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-campus-token",
};

const FREE_DAILY_LIMIT = 0; // Campus AI is a premium feature
const PREMIUM_DAILY_LIMIT = 200;

type Task =
  | "explain"
  | "questions"
  | "summarise"
  | "predict"
  | "topics"
  | "outline"
  | "chapter"
  | "abstract"
  | "feedback"
  | "references"
  | "logbook"
  | "weekly_report"
  | "cv_summary"
  | "cv_bullets"
  | "roadmap"
  | "interview";

const TASKS: Task[] = [
  "explain", "questions", "summarise", "predict",
  "topics", "outline", "chapter", "abstract", "feedback", "references",
];

const BASE_SYSTEM = `You are the Edura Campus academic assistant for Nigerian higher-institution students
(universities, polytechnics, colleges of education). You are grounded in the student's own courses,
materials and final-year project. Rules:
- Be accurate, structured and exam-focused. Use clear markdown headings, short paragraphs and lists.
- Use LaTeX ($...$ inline, $$...$$ display) for any mathematics.
- Use Nigerian academic conventions (semesters, units, CGPA, chapters one to five, project defence).
- If a request is unrelated to the student's academics, politely redirect to their coursework.
- Never fabricate a specific past-question paper or claim content came from a real exam; label generated
  questions as practice questions.
- For project writing, coach the student: give structure, guidance and skeletons they expand themselves.
  Do not present a finished chapter as their own work; remind them their supervisor's requirements come first.`;

const buildPrompt = (task: Task, ctx: Record<string, any>, input: Record<string, any>) => {
  const course = ctx.course
    ? `Course: ${ctx.course.code ?? ""} — ${ctx.course.title ?? ""} (${ctx.course.units ?? "?"} units, ${ctx.course.semester ?? "semester n/a"}${ctx.course.lecturer ? `, lecturer: ${ctx.course.lecturer}` : ""}).`
    : "";
  const student = `Student profile: ${ctx.department ? `Department of ${ctx.department}. ` : ""}${ctx.level ? `${ctx.level} level. ` : ""}${ctx.institution ? `Institution: ${ctx.institution}.` : ""}`;
  const project = ctx.project
    ? `Project: "${ctx.project.title}"${ctx.project.topic ? `, topic: ${ctx.project.topic}` : ""}${ctx.project.department ? `, department: ${ctx.project.department}` : ""}${ctx.project.stage ? `, current stage: ${ctx.project.stage}` : ""}.`
    : "";
  const material = ctx.material
    ? `Material on file: "${ctx.material.title}"${ctx.material.description ? ` — ${ctx.material.description}` : ""} (${ctx.material.kind ?? "document"}).`
    : "";

  const head = [student, course, project, material].filter(Boolean).join("\n");

  switch (task) {
    case "explain":
      return `${head}\n\nExplain the topic "${input.topic}" for this course.
Structure your answer as:
## Definition
## Key ideas (broken down simply)
## Worked example or illustration
## Exam-style summary (what a lecturer expects in an answer)
## Common mistakes to avoid`;

    case "questions":
      return `${head}\n\nGenerate ${input.count ?? 10} ${input.difficulty ?? "medium"}-difficulty ${input.questionType ?? "objective"} practice questions${input.topic ? ` on "${input.topic}"` : " covering the whole course outline"}.
For objective questions give exactly four options labelled A–D, then the correct answer and a one-sentence explanation.
For theory questions give the question, then a model answer outline with the key marking points.
Number every question. Use this exact layout per question:

**1.** question text
A. ...
B. ...
C. ...
D. ...
**Answer:** B
**Why:** one sentence`;

    case "summarise":
      return `${head}\n\nThe student uploaded this material for the course. Based on its title, type and the course outline, produce:
## Summary
## Key points to memorise
## Likely exam questions from this material (with brief answers)
If you cannot read the file contents, say so once and work from the title, course and level.
Extra notes from the student: ${input.notes || "none"}`;

    case "predict":
      return `${head}\n\nBased on this course, the level and typical Nigerian institution exam patterns, produce a
"most likely to come out" list of 10 topics/questions for the coming exam, each with:
- why it is likely
- what to revise for it
End with a one-week revision plan.`;

    case "topics":
      return `${head}\n\nSuggest 10 researchable final-year project topics for a student in ${input.department || ctx.department || "this department"} interested in "${input.interest || "their department's core area"}".
For each: the topic title, one line on why it matters, the data or method needed, and a feasibility note (easy / moderate / demanding) for a Nigerian undergraduate.`;

    case "outline":
      return `${head}\n\nProduce the full chapter outline for this project using the standard Nigerian undergraduate structure
(Chapter One Introduction … Chapter Five Summary, Conclusion and Recommendations), with tailored sub-headings
(1.1, 1.2 …) for this exact topic. Add a one-line note under each sub-heading on what it should contain.`;

    case "chapter":
      return `${head}\n\nCoach the student on writing ${input.chapter || "Chapter One"} of this project.
Give: what this chapter must achieve, the sub-sections in order, what goes in each, a draft skeleton with
opening sentences the student expands themselves, and a checklist their supervisor will look for.`;

    case "abstract":
      return `${head}\n\nWrite a project ${input.kind === "proposal" ? "proposal" : "abstract"} draft.
Objectives: ${input.objectives || "not supplied"}
Methodology: ${input.methodology || "not supplied"}
Keep an abstract to 200–250 words with background, aim, method, expected result and keywords.
For a proposal, use: Introduction, Statement of the Problem, Objectives, Significance, Scope, Methodology, References style.`;

    case "feedback":
      return `${head}\n\nThe supervisor gave this feedback:\n"""${input.feedback}"""\n
Turn it into a clear, numbered action list the student can work through, ordered by priority, each with what
"done" looks like. Flag anything that needs clarification from the supervisor.`;

    case "references":
      return `${head}\n\nFormat these sources in ${input.style || "APA"} style, alphabetically, and flag any missing details:\n"""${input.sources}"""`;

    default:
      return head;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI is not configured." }, 500);

    const authHeader = req.headers.get("Authorization") || "";
    const token = (authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.headers.get("x-campus-token") || "").trim();
    if (!token) return json({ error: "Please sign in to use Campus AI." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      console.error("campus-ai auth failed:", userErr?.message);
      return json({ error: "Please sign in to use Campus AI." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const task = body?.task as Task;
    const input = (body?.input ?? {}) as Record<string, any>;

    // Usage / entitlement snapshot (also used by the UI's remaining counter)
    const today = new Date().toISOString().slice(0, 10);
    let isPremium = false;
    try {
      const { data } = await admin.rpc("has_scope_access", { _auth_user_id: user.id, _scope: "campus" });
      isPremium = Boolean(data);
    } catch (_) {
      isPremium = false;
    }
    const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    const { data: usageRow } = await admin
      .from("campus_ai_usage")
      .select("id, count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();
    const used = usageRow?.count ?? 0;

    if (body?.task === "status" || !task) {
      return json({ isPremium, limit, used, remaining: Math.max(0, limit - used) });
    }
    if (!TASKS.includes(task)) return json({ error: "Unknown request." }, 400);

    if (!isPremium) {
      return json(
        {
          error: "Campus AI is an Edura Premium feature. Subscribe to unlock the Course Companion and Project Assistant.",
          requiresUpgrade: true,
          limitReached: true,
          isPremium,
          limit,
          used,
        },
        403,
      );
    }

    if (used >= limit) {
      return json(
        {
          error: isPremium
            ? "You've reached today's Campus AI limit. It resets tomorrow."
            : "You've used your free Campus AI actions for today. Upgrade to Edura Premium for unlimited access.",
          limitReached: true,
          isPremium,
          limit,
          used,
        },
        429,
      );
    }

    // Ground the prompt in the student's own rows
    const ctx: Record<string, any> = {};
    const { data: profile } = await admin
      .from("users")
      .select("department, study_level, institution_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (profile) {
      ctx.department = (profile as any).department;
      ctx.level = (profile as any).study_level;
      ctx.institution = (profile as any).institution_name;
    }

    if (input.courseId) {
      const { data } = await admin
        .from("campus_courses")
        .select("*")
        .eq("id", input.courseId)
        .eq("user_id", user.id)
        .maybeSingle();
      ctx.course = data ?? null;
    }
    if (input.materialId) {
      const { data } = await admin
        .from("campus_materials")
        .select("*")
        .eq("id", input.materialId)
        .eq("user_id", user.id)
        .maybeSingle();
      ctx.material = data ?? null;
    }
    if (["topics", "outline", "chapter", "abstract", "feedback", "references"].includes(task)) {
      const { data } = await admin
        .from("campus_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      ctx.project = data?.[0] ?? null;
    }

    const prompt = buildPrompt(task, ctx, input);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions: BASE_SYSTEM,
        input: prompt,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
      }),
    });

    if (!aiRes.ok || !aiRes.body) {
      const text = await aiRes.text().catch(() => "");
      console.error("campus-ai gateway error", aiRes.status, text);
      if (aiRes.status === 429) return json({ error: "The AI is busy right now. Try again in a moment." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits are exhausted. Please contact support." }, 402);
      return json({ error: "Campus AI is unavailable right now. Please try again." }, 500);
    }

    // Count this action
    if (usageRow?.id) {
      await admin.from("campus_ai_usage").update({ count: used + 1 }).eq("id", usageRow.id);
    } else {
      await admin.from("campus_ai_usage").insert({ user_id: user.id, day: today, count: 1 });
    }

    // Re-emit the Responses SSE as simple {delta} events the client can read
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = aiRes.body!.getReader();
        let buffer = "";
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ meta: { isPremium, limit, used: used + 1, remaining: Math.max(0, limit - used - 1) } })}\n\n`,
            ),
          );
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (!raw || raw === "[DONE]") continue;
              try {
                const evt = JSON.parse(raw);
                if (evt.type === "response.output_text.delta" && evt.delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: evt.delta })}\n\n`));
                }
              } catch (_) {
                /* partial chunk */
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("campus-ai stream error", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("campus-ai error", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
