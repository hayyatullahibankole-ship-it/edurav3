import { supabase } from "@/integrations/supabase/client";

export const QUESTION_MEDIA_BUCKET = "question-media";

export interface QuestionMediaItem {
  url: string;
  caption?: string;
}

/** Accepts jsonb from the DB in several historical shapes and returns a clean list. */
export const normalizeQuestionMedia = (raw: any): QuestionMediaItem[] => {
  if (!raw) return [];
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        return [{ url: trimmed }];
      }
    } else {
      return [{ url: trimmed }];
    }
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item: any): QuestionMediaItem | null => {
      if (!item) return null;
      if (typeof item === "string") {
        return item.trim() ? { url: item.trim() } : null;
      }
      const url = item.url ?? item.src ?? item.image ?? item.path;
      if (!url || typeof url !== "string" || !url.trim()) return null;
      return { url: url.trim(), caption: item.caption ? String(item.caption) : undefined };
    })
    .filter(Boolean) as QuestionMediaItem[];
};

/** Option media is stored as an array aligned to the option order. */
export const normalizeOptionMedia = (raw: any): (QuestionMediaItem | null)[] => {
  if (!raw) return [];
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const parsed = normalizeQuestionMedia(item);
    return parsed.length ? parsed[0] : null;
  });
};

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

const isAbsolute = (url: string) => /^(https?:|data:|blob:)/i.test(url);

/** Storage paths are stored relative to the bucket; absolute URLs pass through. */
export const resolveQuestionMediaUrl = async (url: string): Promise<string> => {
  if (!url) return "";
  if (isAbsolute(url)) return url;

  const path = url.replace(/^\/+/, "").replace(new RegExp(`^${QUESTION_MEDIA_BUCKET}/`), "");
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(QUESTION_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) return "";
  signedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
};

export const uploadQuestionMedia = async (file: File): Promise<string> => {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `diagrams/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage
    .from(QUESTION_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
};

export const deleteQuestionMedia = async (url: string) => {
  if (!url || isAbsolute(url)) return;
  const path = url.replace(/^\/+/, "").replace(new RegExp(`^${QUESTION_MEDIA_BUCKET}/`), "");
  await supabase.storage.from(QUESTION_MEDIA_BUCKET).remove([path]);
};
