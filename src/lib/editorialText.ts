const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&#038;": "&", "&quot;": '"', "&#8217;": "’", "&#039;": "'",
  "&apos;": "'", "&nbsp;": " ", "&lt;": "<", "&gt;": ">", "&#8211;": "–", "&#8212;": "—",
};

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "of", "on",
  "or", "the", "to", "with", "via", "into", "per",
]);

/** Keep these acronyms upper-cased when title-casing. */
const ACRONYMS = new Set([
  "JAMB", "WAEC", "NECO", "NABTEB", "NYSC", "UTME", "POST-UTME", "DE", "ND", "HND",
  "PGD", "NUC", "IJMB", "JUPEB", "CBT", "GST", "OAU", "UI", "UNILAG", "UNIZIK",
  "BUK", "LASU", "YSU", "FUTA", "ABU", "UNN", "FUOYE", "FUTMINNA", "ODFEL", "PT",
]);

export function decodeEntities(text: string): string {
  return text.replace(/&[#a-zA-Z0-9]+;/g, (m) => ENTITIES[m] ?? m);
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word, idx, arr) => {
      const bare = word.replace(/[^a-z0-9-]/gi, "");
      if (!bare) return word;
      const upper = bare.toUpperCase();
      if (ACRONYMS.has(upper) || /\d/.test(bare)) return word.replace(bare, upper);
      if (idx !== 0 && idx !== arr.length - 1 && SMALL_WORDS.has(bare)) return word;
      return word.replace(/\p{L}/u, (c) => c.toUpperCase());
    })
    .join(" ");
}

/**
 * Editorial headline formatting: decodes HTML entities and converts
 * shouting ALL-CAPS titles into readable title case.
 */
export function headlineText(raw?: string | null): string {
  if (!raw) return "";
  const clean = decodeEntities(raw).replace(/\s+/g, " ").trim();
  const letters = clean.replace(/[^a-zA-Z]/g, "");
  if (!letters) return clean;
  const upperRatio = (clean.match(/[A-Z]/g)?.length || 0) / letters.length;
  return upperRatio > 0.7 ? toTitleCase(clean) : clean;
}

/** Entity-safe body text for standfirsts and previews. */
export function bodyText(raw?: string | null): string {
  return raw ? decodeEntities(raw.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim() : "";
}
