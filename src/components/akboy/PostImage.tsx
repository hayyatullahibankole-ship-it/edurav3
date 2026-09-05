import { useState } from "react";
import { resolveInstitutionLogo, type LogoSubject } from "@/lib/institutionLogos";

interface PostImageProps extends LogoSubject {
  src?: string | null;
  alt: string;
  /** tailwind aspect utility, e.g. "aspect-[4/5]" */
  aspect?: string;
  className?: string;
  /** zoom the photo on hover of the parent `group` */
  zoom?: boolean;
  /** relative size of the monogram tile type */
  tone?: "forest" | "butter" | "bone";
}

/**
 * Editorial image slot. Uses the post's featured image when present, otherwise
 * renders a designed typographic tile built from the institution monogram —
 * never a grey placeholder and never the Edura logo.
 */
export function PostImage({
  src,
  alt,
  aspect = "aspect-[4/5]",
  className = "",
  zoom = true,
  tone = "forest",
  ...subject
}: PostImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveInstitutionLogo(subject, 256);
  const usePhoto = Boolean(src) && !failed;

  const toneCls =
    tone === "butter"
      ? "bg-akboy-butter text-akboy-forest"
      : tone === "bone"
      ? "bg-akboy-bone text-akboy-forest"
      : "bg-akboy-forest text-akboy-butter";

  return (
    <div className={`relative overflow-hidden ${aspect} ${className}`}>
      {usePhoto ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${
            zoom ? "transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]" : ""
          }`}
        />
      ) : (
        <div className={`flex h-full w-full flex-col items-center justify-center gap-3 px-5 py-6 sm:gap-4 ${toneCls}`}>
          {resolved.src && (
            <span className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/95 p-2 shadow-sm">
              <img
                src={resolved.src}
                alt={`${resolved.label} logo`}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </span>
          )}
          <span className="font-display text-[clamp(2rem,6vw,4rem)] font-bold leading-none tracking-tight">
            {resolved.short}
          </span>
          <span className="line-clamp-2 max-w-[86%] text-center text-[9px] font-semibold uppercase leading-relaxed tracking-[0.22em] opacity-80 sm:text-[10px] sm:tracking-[0.28em]">
            {resolved.label}
          </span>
        </div>
      )}

    </div>
  );
}
