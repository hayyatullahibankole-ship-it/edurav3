import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite worker url import
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type DeckStatus = "pending" | "processing" | "ready" | "failed";

export type StudyDeck = {
  id: string;
  title: string;
  description: string | null;
  page_count: number;
  section_count: number;
  pass_mark: number;
  status: string;
  error_message: string | null;
  created_at: string;
};

export type DeckSection = {
  id: string;
  deck_id: string;
  order_index: number;
  title: string;
  content: string;
  summary: string | null;
};

export type DeckQuestion = {
  id: string;
  section_id: string;
  order_index: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
};

export type DeckAttempt = {
  id: string;
  section_id: string;
  percentage: number;
  passed: boolean;
  created_at: string;
};

const MAX_CHUNKS = 10;
const CHUNK_CHARS = 7000;

/** Read all text out of a PDF file in the browser. */
export const extractPdfText = async (
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ text: string; pageCount: number }> => {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as any[])
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) text += `${pageText}\n\n`;
    onProgress?.(i, doc.numPages);
  }
  return { text: text.trim(), pageCount: doc.numPages };
};

/** Split raw text into section-sized chunks on paragraph boundaries. */
export const chunkText = (text: string): string[] => {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if ((current + paragraph).length > CHUNK_CHARS && current.length > 800) {
      chunks.push(current.trim());
      current = "";
    }
    current += `${paragraph}\n\n`;
  }
  if (current.trim().length > 200) chunks.push(current.trim());
  if (!chunks.length && text.trim().length > 200) chunks.push(text.trim());
  return chunks.slice(0, MAX_CHUNKS);
};

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("study-decks", { body });
  if (error) {
    const message = (data as any)?.error || error.message || "Request failed";
    throw new Error(message);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
};

export const createDeck = async (input: {
  title: string;
  description?: string;
  pageCount: number;
  passMark: number;
  sourcePath?: string;
}) => (await invoke({ action: "create", ...input })).deck as StudyDeck;

export const buildSection = async (deckId: string, orderIndex: number, text: string) =>
  invoke({ action: "section", deckId, orderIndex, text });

export const finishDeck = async (deckId: string, failed = false, error?: string) =>
  invoke({ action: "finish", deckId, failed, error });

export const uploadDeckFile = async (userId: string, deckId: string, file: File) => {
  const path = `${userId}/${deckId}.pdf`;
  const { error } = await supabase.storage.from("study-decks").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
};

/** Which sections are unlocked: section n unlocks when n-1 has a passing attempt. */
export const computeUnlocked = (
  sections: DeckSection[],
  attempts: DeckAttempt[],
): { unlockedUpTo: number; bestBySection: Record<string, number> } => {
  const best: Record<string, number> = {};
  for (const a of attempts) {
    best[a.section_id] = Math.max(best[a.section_id] ?? 0, a.percentage);
  }
  let unlockedUpTo = 0;
  for (let i = 0; i < sections.length; i++) {
    const passed = attempts.some((a) => a.section_id === sections[i].id && a.passed);
    if (passed) unlockedUpTo = i + 1;
    else break;
  }
  return { unlockedUpTo, bestBySection: best };
};
