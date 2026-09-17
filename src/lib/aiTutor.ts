import katex from "katex";
import "katex/dist/katex.min.css";

export interface TutorMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

export interface TutorThread {
  id: string;
  title: string;
  updated_at: string;
}

/** Render markdown (bold/italic) + LaTeX math to HTML. */
export const renderTutorMarkdown = (text: string): string => {
  let processed = text;

  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_m, math) => {
    try {
      return `<div class="my-4 overflow-x-auto text-center">${katex.renderToString(String(math).trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
        trust: true,
      })}</div>`;
    } catch {
      return `<div class="text-destructive text-sm">Math error</div>`;
    }
  });

  processed = processed.replace(/\$([^$\n]+?)\$/g, (_m, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch {
      return `<span class="text-destructive text-sm">Math error</span>`;
    }
  });

  processed = processed.replace(/^###\s+(.+)$/gm, '<h3 class="font-semibold text-base mt-4 mb-1">$1</h3>');
  processed = processed.replace(/```([\s\S]*?)```/g, '<pre class="my-3 rounded-xl bg-muted p-3 text-xs overflow-x-auto"><code>$1</code></pre>');
  processed = processed.replace(/`([^`\n]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-[0.85em]">$1</code>');
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  processed = processed.replace(/(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g, '<em class="italic">$1</em>');
  processed = processed.replace(/\n/g, "<br/>");

  return processed;
};

export const TUTOR_STARTERS = [
  { label: "Explain a topic", prompt: "Explain photosynthesis in a simple way I can remember for WAEC." },
  { label: "Solve a question", prompt: "Solve: 2x^2 + 4x - 6 = 0 and show every step." },
  { label: "Snap a question", prompt: "I'm going to upload a picture of a past question — help me solve it." },
  { label: "Study plan", prompt: "Build me a 4-week JAMB study plan for Maths, English, Physics and Chemistry." },
];

const FN_URL = "https://zqapbmllkywsuywpfava.supabase.co/functions/v1/ai-assistant";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxYXBibWxsa3l3c3V5d3BmYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTA5NDgsImV4cCI6MjA3NDI4Njk0OH0.uZmBzHcTI3oBiigUv_QCVkYF5Nh5_dK21qQtdpzjkUI";

/**
 * Stream a tutor reply from the ai-assistant edge function.
 * Calls onDelta with each token and resolves with the full text.
 */
export async function streamTutorReply(
  messages: TutorMessage[],
  accessToken: string | null,
  onDelta: (full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const payload = messages.map((m) => ({
    role: m.role,
    content: m.content,
    ...(m.images && m.images.length > 0 ? { images: m.images } : {}),
  }));

  const callFn = (token: string | null) =>
    fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${token || ANON_KEY}`,
      },
      body: JSON.stringify({ messages: payload }),
      signal,
    });

  const response = await callFn(accessToken);

  if (!response.ok) {
    let friendly = "The tutor is unavailable right now. Please try again.";
    if (response.status === 401) friendly = "Please sign in again to use the AI tutor.";
    else if (response.status === 429) friendly = "Too many requests — wait a moment and try again.";
    else if (response.status === 402) friendly = "AI service is temporarily unavailable. Please contact support.";
    else {
      try {
        const parsed = JSON.parse(await response.text());
        if (parsed?.error) friendly = String(parsed.error);
      } catch {
        /* keep default */
      }
    }
    throw new Error(friendly);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream available.");

  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          full += content;
          onDelta(full);
        }
      } catch {
        /* partial chunk — ignore */
      }
    }
  }

  return full;
}
