import { Link } from "react-router-dom";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { headlineText } from "@/lib/editorialText";
import { PostImage } from "@/components/akboy/PostImage";
import { CampusPost, namedSchool, postPath, standfirst, timeAgo } from "./shared";

export function CategoryChip({ label, tone = "light" }: { label: string; tone?: "light" | "solid" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
        tone === "solid"
          ? "bg-akboy-lime text-akboy-forest"
          : "border border-akboy-forest/15 bg-akboy-mist text-akboy-forest"
      }`}
    >
      {label}
    </span>
  );
}

export function MetaLine({ post, invert = false }: { post: CampusPost; invert?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${invert ? "text-akboy-paper/70" : "text-akboy-muted"}`}>
      {namedSchool(post.school) && (
        <>
          <span className="font-semibold">{post.school}</span>
          <span aria-hidden className="opacity-40">•</span>
        </>
      )}
      <span>{timeAgo(post.created_at)}</span>
    </div>
  );
}

interface StoryCardProps {
  post: CampusPost;
  onShare?: (event: React.MouseEvent, post: CampusPost) => void;
  compact?: boolean;
}

export function StoryCard({ post, onShare, compact = false }: StoryCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-akboy-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-akboy-forest/30 hover:shadow-[0_18px_40px_-24px_hsl(var(--akboy-forest)/0.45)]">
      <Link to={postPath(post)} className="block">
        <div className="relative">
          <PostImage
            src={post.featured_image_url}
            alt={headlineText(post.title)}
            school={post.school}
            title={headlineText(post.title)}
            tags={post.tags}
            institution_type={post.institution_type}
            aspect={compact ? "aspect-[16/10]" : "aspect-[16/9]"}
          />
          <span className="absolute left-3 top-3">
            <CategoryChip label={post.category || "News"} tone="solid" />
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to={postPath(post)} className="block">
          <h3 className="font-editorial text-[1.15rem] font-semibold leading-snug text-akboy-forest transition-colors group-hover:text-akboy-moss">
            {headlineText(post.title)}
          </h3>
          {!compact && (
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-akboy-muted">{standfirst(post, 140)}</p>
          )}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <MetaLine post={post} />
          <div className="flex items-center gap-1">
            {onShare && (
              <button
                type="button"
                onClick={(event) => onShare(event, post)}
                aria-label="Share on WhatsApp"
                className="grid h-8 w-8 place-items-center rounded-full text-akboy-muted transition-colors hover:bg-akboy-mist hover:text-akboy-forest"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            <Link
              to={postPath(post)}
              aria-label="Read story"
              className="grid h-8 w-8 place-items-center rounded-full bg-akboy-mist text-akboy-forest transition-colors group-hover:bg-akboy-forest group-hover:text-akboy-paper"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
