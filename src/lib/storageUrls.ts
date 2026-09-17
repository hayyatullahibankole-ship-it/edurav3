import { supabase } from "@/integrations/supabase/client";

/**
 * Accepts either a raw storage path or a legacy full public URL and returns the
 * object path inside the given bucket.
 */
export function toStoragePath(bucket: string, value: string): string {
  if (!value) return value;
  const marker = `/${bucket}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return value.replace(/^\/+/, "");
  return value.slice(idx + marker.length).split("?")[0];
}

/**
 * Creates a short-lived signed URL for a file in a private bucket.
 * Returns null when the file cannot be signed.
 */
export async function getSignedFileUrl(
  bucket: string,
  value: string | null | undefined,
  expiresInSeconds = 60 * 10,
): Promise<string | null> {
  if (!value) return null;
  const path = toStoragePath(bucket, value);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error(`Could not sign ${bucket}/${path}:`, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}
