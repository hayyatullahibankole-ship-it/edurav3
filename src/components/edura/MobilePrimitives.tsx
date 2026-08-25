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

export const MobileToolCard = ({
  to,
  icon: Icon,
  title,
  description,
  tone = "primary",
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "primary" | "info" | "warning" | "neutral";
}) => {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
    neutral: "bg-muted text-foreground",
  }[tone];

  return (
    <Link to={to} className="app-card press flex min-h-32 flex-col p-4">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{description}</p>
    </Link>
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