import { cn } from "@/lib/utils";
import jambLogo from "@/assets/exam-jamb.png";
import waecLogo from "@/assets/exam-waec.png";
import necoLogo from "@/assets/exam-neco.png";
import postUtmeLogo from "@/assets/exam-post-utme.jpg";
import nabtebLogoAsset from "@/assets/exam-nabteb.png.asset.json";

export type ExamKey = "jamb" | "waec" | "neco" | "post-utme" | "gce" | string;

type Mark = { label: string; tint: string; text: string; logo?: string };

const MARKS: Record<string, Mark> = {
  jamb: { label: "JAMB", tint: "bg-mint", text: "text-mint-foreground", logo: jambLogo },
  utme: { label: "JAMB", tint: "bg-mint", text: "text-mint-foreground", logo: jambLogo },
  waec: { label: "WAEC", tint: "bg-sky", text: "text-sky-foreground", logo: waecLogo },
  neco: { label: "NECO", tint: "bg-butter", text: "text-butter-foreground", logo: necoLogo },
  nabteb: { label: "NABTEB", tint: "bg-mint", text: "text-mint-foreground", logo: nabtebLogoAsset.url },
  "post-utme": { label: "PUTME", tint: "bg-lilac", text: "text-lilac-foreground", logo: postUtmeLogo },
  post_utme: { label: "PUTME", tint: "bg-lilac", text: "text-lilac-foreground", logo: postUtmeLogo },
  "post utme": { label: "PUTME", tint: "bg-lilac", text: "text-lilac-foreground", logo: postUtmeLogo },
  gce: { label: "GCE", tint: "bg-peach", text: "text-peach-foreground" },
};

const fallback: Mark = { label: "EXAM", tint: "bg-muted", text: "text-foreground" };

/**
 * Exam brand mark. Official JAMB/WAEC/NECO/Post-UTME logos are used where we
 * have them, with a typographic wordmark as the fallback.
 */
export const ExamBadge = ({
  exam,
  size = "md",
  className,
}: {
  exam: ExamKey;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const key = String(exam).toLowerCase().trim();
  const mark = MARKS[key] ?? {
    ...fallback,
    label: String(exam).toUpperCase().slice(0, 5),
  };
  const sizes = {
    sm: "h-9 w-9 rounded-xl text-[9px]",
    md: "h-12 w-12 rounded-2xl text-[11px]",
    lg: "h-16 w-16 rounded-[1.25rem] text-[13px]",
  }[size];

  if (mark.logo) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden bg-white p-1 shadow-sm ring-1 ring-black/5",
          sizes,
          className
        )}
      >
        <img
          src={mark.logo}
          alt={`${mark.label} logo`}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-extrabold tracking-tight",
        sizes,
        mark.tint,
        mark.text,
        className
      )}
    >
      {mark.label}
    </span>
  );
};

export default ExamBadge;
