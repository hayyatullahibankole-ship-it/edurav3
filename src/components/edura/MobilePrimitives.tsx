import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileSection = ({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("space-y-3", className)}>
    <div className="flex min-h-6 items-center justify-between gap-3 px-0.5">
      <h2 className="font-display text-[15px] font-bold text-foreground">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export const PrimaryActionCard = ({
  eyebrow,
  title,
  description,
  to,
  actionLabel,
  progress,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  actionLabel: string;
  progress?: number;
  icon?: LucideIcon;
}) => (
  <section className="overflow-hidden rounded-[1.5rem] bg-ink p-5 text-ink-foreground shadow-card sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-xl font-bold leading-tight sm:text-2xl">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-ink-foreground/70 sm:text-sm">{description}</p>
      </div>
      {Icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
    {typeof progress === "number" && (
      <div className="mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-foreground/10">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
        <span className="text-xs font-bold tabular">{Math.round(progress)}%</span>
      </div>
    )}
    <Link
      to={to}
      className="press mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
    >
      {actionLabel}
      <ArrowRight className="h-4 w-4" />
    </Link>
  </section>
);

const TONES = {
  primary: { card: "bg-mint", icon: "bg-mint-foreground/10 text-mint-foreground", text: "text-mint-foreground" },
  mint: { card: "bg-mint", icon: "bg-mint-foreground/10 text-mint-foreground", text: "text-mint-foreground" },
  info: { card: "bg-sky", icon: "bg-sky-foreground/10 text-sky-foreground", text: "text-sky-foreground" },
  sky: { card: "bg-sky", icon: "bg-sky-foreground/10 text-sky-foreground", text: "text-sky-foreground" },
  warning: { card: "bg-butter", icon: "bg-butter-foreground/10 text-butter-foreground", text: "text-butter-foreground" },
  butter: { card: "bg-butter", icon: "bg-butter-foreground/10 text-butter-foreground", text: "text-butter-foreground" },
  lilac: { card: "bg-lilac", icon: "bg-lilac-foreground/10 text-lilac-foreground", text: "text-lilac-foreground" },
  peach: { card: "bg-peach", icon: "bg-peach-foreground/10 text-peach-foreground", text: "text-peach-foreground" },
  neutral: { card: "bg-lilac", icon: "bg-lilac-foreground/10 text-lilac-foreground", text: "text-lilac-foreground" },
} as const;

export type ToolTone = keyof typeof TONES;

export const MobileToolCard = ({
  to,
  icon: Icon,
  title,
  description,
  stat,
  tone = "primary",
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** optional mini stat shown on the right of the title row */
  stat?: string;
  tone?: ToolTone;
}) => {
  const t = TONES[tone] ?? TONES.primary;

  return (
    <Link
      to={to}
      className={cn(
        "press flex min-h-36 flex-col rounded-[1.5rem] p-4 transition-shadow",
        t.card,
        t.text
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", t.icon)}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
        {stat && (
          <span className="rounded-full bg-background/60 px-2 py-1 text-[10px] font-extrabold tabular">
            {stat}
          </span>
        )}
      </div>
      <p className="mt-auto pt-3 font-display text-[15px] font-extrabold leading-tight">{title}</p>
      <p className="mt-1 text-[11px] font-medium leading-snug opacity-75">{description}</p>
    </Link>
  );
};

/** Sun–Sat activity strip: instant, visual proof of a streak. */
export const WeekStrip = ({
  activeDays = [],
  className,
}: {
  /** JS day indexes (0 = Sunday) that had activity */
  activeDays?: number[];
  className?: string;
}) => {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const todayIdx = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - todayIdx);

  return (
    <div className={cn("grid grid-cols-7 gap-1.5", className)}>
      {labels.map((label, idx) => {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + idx);
        const isToday = idx === todayIdx;
        const done = activeDays.includes(idx);
        return (
          <div
            key={idx}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 transition-colors",
              isToday
                ? "border-transparent bg-ink text-ink-foreground"
                : done
                  ? "border-transparent bg-mint text-mint-foreground"
                  : "border-border/70 bg-card text-muted-foreground"
            )}
          >
            <span className="text-[10px] font-bold uppercase">{label}</span>
            <span className="font-display text-[13px] font-extrabold tabular">{date.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
};


export const MobileEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-8 text-center">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 text-sm font-bold">{title}</p>
    <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);