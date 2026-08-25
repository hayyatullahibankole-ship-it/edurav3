import { cn } from "@/lib/utils";

export type ExamKey = "jamb" | "waec" | "neco" | "post-utme" | "gce" | string;

const MARKS: Record<string, { label: string; tint: string; text: string }> = {
  jamb: { label: "JAMB", tint: "bg-mint", text: "text-mint-foreground" },
  waec: { label: "WAEC", tint: "bg-sky", text: "text-sky-foreground" },
  neco: { label: "NECO", tint: "bg-butter", text: "text-butter-foreground" },
  "post-utme": { label: "PUTME", tint: "bg-lilac", text: "text-lilac-foreground" },
  gce: { label: "GCE", tint: "bg-peach", text: "text-peach-foreground" },
};

const fallback = { label: "EXAM", tint: "bg-muted", text: "text-foreground" };

/**
 * Typographic exam brand mark. Students recognise the wordmark instantly, which
 * a generic icon never achieves.
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
  const mark = MARKS[String(exam).toLowerCase()] ?? {
    ...fallback,
    label: String(exam).toUpperCase().slice(0, 5),
  };
  const sizes = {
    sm: "h-9 w-9 rounded-xl text-[9px]",
    md: "h-12 w-12 rounded-2xl text-[11px]",
    lg: "h-16 w-16 rounded-[1.25rem] text-[13px]",
  }[size];

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
