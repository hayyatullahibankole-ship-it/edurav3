import { supabase } from "@/integrations/supabase/client";
import { renderTutorMarkdown } from "@/lib/aiTutor";

export const renderCampusMarkdown = renderTutorMarkdown;

const FN_URL = "https://zqapbmllkywsuywpfava.supabase.co/functions/v1/campus-ai";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXBibWxsa3l3c3V5d3BmYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTA5NDgsImV4cCI6MjA3NDI4Njk0OH0.uZmBzHcTI3oBiigUv_QCVkYF5Nh5_dK21qQtdpzjkUI";

export type CampusAITask =
  | "explain"
  | "questions"
  | "summarise"
  | "predict"
  | "topics"
  | "outline"
  | "chapter"
  | "abstract"
  | "feedback"
  | "references";

export type CampusAIQuota = {
  isPremium: boolean;
  limit: number;
  used: number;
  remaining: number;
};

const authHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${token || ANON_KEY}`,
  };
};

/** Current daily allowance for the signed-in student. */
export const fetchCampusAIQuota = async (): Promise<CampusAIQuota | null> => {
  try {
    const res = await fetch(FN_URL, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ task: "status" }),
    });
    if (!res.ok) return null;
    return (await res.json()) as CampusAIQuota;
  } catch {
    return null;
  }
};

export class CampusAIError extends Error {
  limitReached: boolean;
  requiresUpgrade: boolean;
  constructor(message: string, limitReached = false, requiresUpgrade = false) {
    super(message);
    this.limitReached = limitReached;
    this.requiresUpgrade = requiresUpgrade;
  }
}

/**
 * Run a Campus AI task. Streams the answer through onDelta and resolves with
 * the full text plus the updated quota.
 */
export const runCampusAI = async (
  task: CampusAITask,
  input: Record<string, unknown>,
  onDelta: (full: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; quota: CampusAIQuota | null }> => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ task, input }),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = "Campus AI is unavailable right now. Please try again.";
    let limitReached = false;
    let requiresUpgrade = false;
    try {
      const parsed = await res.json();
      if (parsed?.error) message = String(parsed.error);
      limitReached = Boolean(parsed?.limitReached);
      requiresUpgrade = Boolean(parsed?.requiresUpgrade);
    } catch {
      /* keep default */
    }
    throw new CampusAIError(message, limitReached, requiresUpgrade);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let quota: CampusAIQuota | null = null;

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
        if (evt.meta) quota = evt.meta as CampusAIQuota;
        if (evt.delta) {
          full += evt.delta;
          onDelta(full);
        }
      } catch {
        /* partial chunk */
      }
    }
  }

  return { text: full, quota };
};

export type ParsedQuestion = {
  question: string;
  options: string[];
  answer: string | null;
  explanation: string | null;
};

/** Parse the generated practice questions into saveable rows. */
export const parseQuestions = (text: string): ParsedQuestion[] => {
  const out: ParsedQuestion[] = [];
  const blocks = text.split(/\n(?=\s*\*{0,2}\d+[\.\)])/g);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const first = lines[0].replace(/^\*{0,2}\s*\d+[\.\)]\s*\*{0,2}/, "").replace(/\*\*/g, "").trim();
    if (!first) continue;

    const options: string[] = [];
    let answer: string | null = null;
    let explanation: string | null = null;
    const extra: string[] = [];

    for (const line of lines.slice(1)) {
      const clean = line.replace(/\*\*/g, "").trim();
      if (/^[A-D][\.\)]\s+/.test(clean)) options.push(clean);
      else if (/^answer\s*:/i.test(clean)) answer = clean.replace(/^answer\s*:\s*/i, "");
      else if (/^(why|explanation)\s*:/i.test(clean)) explanation = clean.replace(/^(why|explanation)\s*:\s*/i, "");
      else extra.push(clean);
    }

    out.push({
      question: [first, ...(options.length ? [] : extra)].join("\n").trim(),
      options,
      answer,
      explanation,
    });
  }

  return out.filter((q) => q.question.length > 3);
};
