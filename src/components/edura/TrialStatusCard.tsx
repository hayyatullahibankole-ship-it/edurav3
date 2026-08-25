import { Link } from "react-router-dom";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Compact free-trial status strip.
 * Shows only while a trial is running (or just ended) and the user has no paid plan.
 */
export default function TrialStatusCard() {
  const { loading, isOnTrial, trialDaysLeft, trialExpired, subscription } = useSubscription();

  const planPrice = subscription?.subscription_plans?.price || 0;
  if (loading || planPrice > 0) return null;

  if (isOnTrial) {
    const urgent = trialDaysLeft <= 3;
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border p-3 ${
          urgent ? "border-warning/40 bg-warning/10" : "border-border bg-card"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            urgent ? "bg-warning/20 text-warning" : "bg-primary/10 text-primary"
          }`}
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            Free trial · {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Full access to premium practice, mocks and study tools.
          </p>
        </div>
        <Button asChild size="sm" variant={urgent ? "default" : "outline"} className="shrink-0">
          <Link to="/subscription">Keep access</Link>
        </Button>
      </div>
    );
  }

  if (trialExpired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Your free trial has ended</p>
          <p className="truncate text-xs text-muted-foreground">
            Upgrade to restore premium practice and study tools.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to="/subscription">Upgrade</Link>
        </Button>
      </div>
    );
  }

  return null;
}
