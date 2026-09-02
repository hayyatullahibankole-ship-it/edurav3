import { bodyText } from "@/lib/editorialText";

export interface CampusPost {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  category?: string;
  tags?: unknown;
  created_at?: string;
  school?: string | null;
  institution_type?: string | null;
  year?: number | null;
}

export const postPath = (p: CampusPost) => `/blog/${p.slug || p.id}`;

export const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

export const timeAgo = (d?: string) => {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(d);
};

export const standfirst = (p: CampusPost, len = 170) => {
  const raw = bodyText(p.excerpt || p.content || "");
  return raw.length > len ? `${raw.slice(0, len)}…` : raw;
};

export const namedSchool = (s?: string | null) =>
  s && !["Other", "Other University"].includes(s) ? s : null;
