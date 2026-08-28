import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import CampusShell from "@/components/campus/CampusShell";

const PERKS = [
  "AI course companion with daily credits",
  "Past question generator & study packs",
  "Project assistant and milestone tracking",
  "SIWES / NYSC logbooks and CV builder",
];

/**
 * Gate for paid Edura Campus tools.
 * Trials and active plans pass through; everyone else sees the upgrade screen.
 */
export const CampusPremiumGate = ({
  children,
  title = "Premium campus tool",
}: {
  children: ReactNode;
  title?: string;
}) => {
  const { loading, hasPremiumAccess, isOnTrial } = useSubscription();

  if (loading) {
    return (
      <CampusShell title={title}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CampusShell>
    );
  }

  if (hasPremiumAccess || isOnTrial) return <>{children}</>;

  return (
    <CampusShell title={title} subtitle="Available on Edura Campus plans">
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl font-bold">Upgrade to unlock this</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your campus tools are part of the Edura Campus plan.
        </p>
        <ul className="mt-5 space-y-2 text-left">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="mt-6 w-full">
          <Link to="/payment?scope=campus">View campus plans</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full">
          <Link to="/campus">Back to campus home</Link>
        </Button>
      </div>
    </CampusShell>
  );
};

export default CampusPremiumGate;
