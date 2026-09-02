import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { headlineText } from "@/lib/editorialText";
import { CampusPost, postPath } from "./shared";

/**
 * Live headline ticker. Duplicates the strip so the scroll loops seamlessly,
 * pauses on hover/focus and freezes entirely under prefers-reduced-motion.
 */
export function BreakingTicker({ posts }: { posts: CampusPost[] }) {
  if (posts.length === 0) return null;
  const items = [...posts, ...posts];

  return (
    <div className="border-b border-akboy-forest/20 bg-akboy-forest text-akboy-paper">
      <div className="mx-auto flex max-w-[1320px] items-stretch">
        <span className="flex shrink-0 items-center gap-2 bg-akboy-lime px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-akboy-forest sm:px-6">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          Breaking
        </span>
        <div className="group relative flex-1 overflow-hidden">
          <div className="akboy-marquee flex min-w-max items-center gap-10 py-2.5 pl-6 group-hover:[animation-play-state:paused]">
            {items.map((post, index) => (
              <Link
                key={`${post.id}-${index}`}
                to={postPath(post)}
                className="flex items-center gap-3 whitespace-nowrap text-xs font-medium text-akboy-paper/85 transition-colors hover:text-akboy-lime"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-akboy-lime" aria-hidden />
                {headlineText(post.title)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
