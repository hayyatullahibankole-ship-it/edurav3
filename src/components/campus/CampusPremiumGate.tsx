import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";

const PERKS = [
  "Past question generator & study packs",
  "Project assistant and milestone tracking",
  "SIWES / NYSC logbooks and CV builder",
  "A much larger daily AI credit allowance",
];

const cacheKey = (userId?: string) => `campus_premium_${userId || "anon"}`;

const readCache = (userId?: string): boolean | null => {
  try {
    const v = sessionStorage.getItem(cacheKey(userId));
    return v === null ? null : v === "1";
  } catch {
    return null;
  }
};

const writeCache = (userId: string | undefined, allowed: boolean) => {
  try {
    sessionStorage.setItem(cacheKey(userId), allowed ? "1" : "0");
  } catch {
    /* ignore */
  }
};

/**
 * Gate for paid Edura Campus tools.
 * The decision is cached per session so a returning premium user never sees the
 * wall, and undecided lookups fall back to the wall after 2s instead of spinning.
 */
export const CampusPremiumGate = ({
  children,
  title = "Premium campus tool",
}: {
  children: ReactNode;
  title?: string;
}) => {
  const { user } = useAuth();
  const { loading, canAccessPremium, isOnTrial } = useSubscription();
  const [cached, setCached] = useState<boolean | null>(() => readCache(user?.id));
  const [settled, setSettled] = useState(false);

  const allowed = canAccessPremium || isOnTrial;

  useEffect(() => {
    if (loading) return;
    setCached(allowed);
    writeCache(user?.id, allowed);
  }, [loading, allowed, user?.id]);

  // Never spin for more than 2 seconds — decide with whatever we know.
  useEffect(() => {
    if (!loading) {
      setSettled(true);
      return;
    }
    setSettled(false);
    const t = setTimeout(() => setSettled(true), 2000);
    return () => clearTimeout(t);
  }, [loading]);

  // Known-premium from an earlier check: show content immediately.
  if (allowed || cached === true) return <>{children}</>;

  if (loading && !settled && cached === null) {
    return (
      <CampusShell title={title}>
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </CampusShell>
    );
  }

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
