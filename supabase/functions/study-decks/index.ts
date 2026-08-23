import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM = `You turn a student's own study material into a clean, readable study section plus a practice quiz.
Rules:
- Keep the author's meaning. Do not invent facts that are not in the supplied text.
- Rewrite the text into tidy markdown: one short section title, then readable paragraphs, headings and bullet lists.
- Use LaTeX ($...$ inline) for mathematics.
- Write multiple-choice questions that can be answered from the section alone. Exactly one correct option.
- Reply with JSON only, no prose, no code fences.`;

const shape = `{
  "title": "short section title",
  "summary": "one or two sentence summary",
  "content": "the section rewritten as markdown",
  "questions": [
    { "question": "...", "options": ["a","b","c","d"], "correct_index": 0, "explanation": "why" }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Please sign in." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Please sign in." }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "create") {
      const title = String(body?.title ?? "").trim().slice(0, 160);
      if (!title) return json({ error: "A deck title is required." }, 400);
      const passMark = Math.min(100, Math.max(40, Number(body?.passMark) || 70));

      const { count } = await admin
        .from("study_decks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= 25) {
        return json({ error: "You've reached the limit of 25 decks. Delete an old one first." }, 429);
      }

      const { data, error } = await admin
        .from("study_decks")
        .insert({
          user_id: user.id,
          title,
          description: String(body?.description ?? "").slice(0, 400) || null,
          source_path: body?.sourcePath ? String(body.sourcePath) : null,
          page_count: Number(body?.pageCount) || 0,
          pass_mark: passMark,
          status: "processing",
        })
        .select()
        .single();
      if (error) throw error;
      return json({ deck: data });
    }

    if (action === "section") {
      const deckId = String(body?.deckId ?? "");
      const orderIndex = Number(body?.orderIndex ?? 0);
      const text = String(body?.text ?? "").slice(0, 12000);
      if (!deckId || text.trim().length < 200) {
        return json({ error: "Not enough readable text in this part of the document." }, 400);
      }

      const { data: deck } = await admin
        .from("study_decks")
        .select("id, user_id")
        .eq("id", deckId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!deck) return json({ error: "Deck not found." }, 404);

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return json({ error: "AI is not configured." }, 500);

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": LOVABLE_API_KEY,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content:
                `Build section ${orderIndex + 1} from this material. Produce 5 to 8 practice questions.\n` +
                `Reply with exactly this JSON shape:\n${shape}\n\nMATERIAL:\n${text}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiRes.ok) {
        const detail = await aiRes.text().catch(() => "");
        console.error("study-decks gateway error", aiRes.status, detail);
        if (aiRes.status === 429) return json({ error: "The AI is busy. Try again in a moment." }, 429);
        if (aiRes.status === 402) return json({ error: "AI credits are exhausted. Please contact support." }, 402);
        return json({ error: "Could not build this section right now." }, 500);
      }

      const payload = await aiRes.json();
      const raw = payload?.choices?.[0]?.message?.content ?? "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(String(raw).replace(/^```json/i, "").replace(/```$/, "").trim());
      } catch (_) {
        return json({ error: "The AI returned an unreadable section. Try again." }, 502);
      }

      const sectionTitle = String(parsed.title ?? `Section ${orderIndex + 1}`).slice(0, 160);
      const { data: section, error: sErr } = await admin
        .from("deck_sections")
        .insert({
          deck_id: deckId,
          order_index: orderIndex,
          title: sectionTitle,
          content: String(parsed.content ?? text).slice(0, 20000),
          summary: parsed.summary ? String(parsed.summary).slice(0, 500) : null,
        })
        .select()
        .single();
      if (sErr) throw sErr;

      const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 10) : [];
      const rows = questions
        .filter((q: any) => q?.question && Array.isArray(q?.options) && q.options.length >= 2)
        .map((q: any, i: number) => ({
          section_id: section.id,
          order_index: i,
          question: String(q.question).slice(0, 1000),
          options: q.options.slice(0, 6).map((o: any) => String(o).slice(0, 400)),
          correct_index: Math.max(0, Math.min(q.options.length - 1, Number(q.correct_index) || 0)),
          explanation: q.explanation ? String(q.explanation).slice(0, 800) : null,
        }));

      if (rows.length) {
        const { error: qErr } = await admin.from("deck_questions").insert(rows);
        if (qErr) throw qErr;
      }

      await admin
        .from("study_decks")
        .update({ section_count: orderIndex + 1 })
        .eq("id", deckId);

      return json({ section, questionCount: rows.length });
    }

    if (action === "finish") {
      const deckId = String(body?.deckId ?? "");
      const failed = Boolean(body?.failed);
      const { error } = await admin
        .from("study_decks")
        .update({
          status: failed ? "failed" : "ready",
          error_message: failed ? String(body?.error ?? "Processing failed").slice(0, 400) : null,
        })
        .eq("id", deckId)
        .eq("user_id", user.id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    console.error("study-decks error", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
