import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Briefcase,
  ChevronRight,
  Crown,
  FileText,
  GraduationCap,
  Library,
  Loader2,
  Newspaper,
  Play,
  Sparkles,
  Target,
  Ticket,
  Trophy,
  Bot,
  Layers,
  Flame,
} from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { ListRow, Panel, EmptyState } from "@/components/edura/tiles";
import { EDUCATION_NEWS_URL } from "@/lib/openExternal";

import UpgradeToCampus from "@/components/edura/UpgradeToCampus";
import OnboardingTour from "@/components/OnboardingTour";
import StreakHero from "@/components/edura/gamify/StreakHero";
import BadgeStrip from "@/components/edura/gamify/BadgeStrip";
import CountUp from "@/components/edura/gamify/CountUp";
import { MobileSection, MobileToolCard, PrimaryActionCard } from "@/components/edura/MobilePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import { useStudentStats } from "@/hooks/useStudentStats";
import { useStreaks } from "@/hooks/useStreaks";
import { computeBadges, computeLevel, isToday } from "@/lib/gamify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const naira = (value: number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

/** Compact bento metric with animated value. */
const Metric = ({
  label,
  value,
  hint,
  className,
  to,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
  to?: string;
}) => {
  const inner = (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
    </>
  );
  return to ? (
    <Link to={to} className={cn("app-card press p-4", className)}>
      {inner}
    </Link>
  ) : (
    <div className={cn("app-card p-4", className)}>{inner}</div>
  );
};

const HomeSkeleton = () => (
  <div className="space-y-4">
    <div className="skeleton h-44 w-full rounded-[1.25rem]" />
    <div className="skeleton h-28 w-full rounded-[1.25rem]" />
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-24 rounded-[1.25rem]" />
      ))}
    </div>
    <div className="skeleton h-40 w-full rounded-[1.25rem]" />
  </div>
);

/**
 * The unified home for exam candidates: progress first, one-tap practice, then
 * everything else. Built to feel like an app, not a page.
 */
const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const {
    subscription,
    loading: subscriptionLoading,
    isPremium,
    hasFreePromoAccess,
    freeAccessExpiry,
    freeAccessExpired,
  } = useSubscription();
  const { balance: walletBalance, loading: walletLoading } = useWallet();
  const { stats, recentTests, schoolInfo, loading } = useStudentStats();
  const { streakData } = useStreaks();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  const firstName = userProfile?.first_name || user?.email?.split("@")[0] || "Student";

  const gamify = useMemo(() => {
    const bestScore = recentTests.reduce((m, t) => Math.max(m, t.score || 0), 0);
    const input = {
      testsTaken: stats.testsTaken,
      averageScore: stats.averageScore,
      currentStreak: streakData?.current_streak || 0,
      longestStreak: streakData?.longest_streak || 0,
      bestScore,
    };
    return { level: computeLevel(input), badges: computeBadges(input), input };
  }, [stats, recentTests, streakData]);

  const redeemCode = async () => {
    if (!accessCode.trim()) {
      toast.error("Enter your access code");
      return;
    }
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_promo_coupon", {
        coupon_code: accessCode.trim(),
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (result?.success) {
        toast.success(result.message || "Access activated");
        setAccessCode("");
        window.location.reload();
      } else {
        toast.error(result?.error || "Invalid access code");
      }
    } catch (err) {
      console.error("Redeem error", err);
      toast.error("Could not activate that code");
    } finally {
      setRedeeming(false);
    }
  };

  const lastTest = recentTests[0];

  return (
    <AppShell
      side="cbt"
      title={`Hi ${firstName}`}
      subtitle="Practice, services and wallet — all in one place."
      meta={
        <>
          {!subscriptionLoading && (
            <Badge variant={isPremium ? "default" : "secondary"} className="text-[11px]">
              {isPremium ? "Premium" : subscription?.subscription_plans?.name || "Free plan"}
            </Badge>
          )}
          {schoolInfo && (
            <Badge variant="outline" className="text-[11px]">{schoolInfo.name}</Badge>
          )}
        </>
      }
    >
      <OnboardingTour isOpen={showOnboarding} onComplete={() => setShowOnboarding(false)} />

      {loading ? (
        <HomeSkeleton />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-0.5 lg:hidden">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Welcome back,</p>
              <h1 className="font-display text-xl font-bold">{firstName}</h1>
            </div>
            <div className="flex min-h-10 items-center gap-1.5 rounded-xl bg-warning/10 px-3 text-warning">
              <Flame className="h-4 w-4 fill-current" />
              <span className="font-display text-sm font-bold tabular">{streakData?.current_streak || 0}</span>
              <span className="sr-only">day streak</span>
            </div>
          </div>

          <PrimaryActionCard
            eyebrow="Your next action"
            title={lastTest ? `Keep going with ${lastTest.subject}` : "Start your first practice"}
            description={lastTest ? `Your last score was ${lastTest.score}%. A short session now keeps your momentum going.` : "Choose your exam and complete a focused 10-minute practice session."}
            to="/cbt"
            actionLabel={lastTest ? "Continue prep" : "Start quick practice"}
            progress={gamify.level.progress}
            icon={Play}
          />

          <MobileSection title="Your tools">
            <div className="grid grid-cols-2 gap-3">
              <MobileToolCard to="/cbt" icon={GraduationCap} title="Exam prep" description="Practice JAMB, WAEC, NECO and Post-UTME" />
              <MobileToolCard to="/decks" icon={Layers} title="Study decks" description="Turn your PDF notes into guided quizzes" tone="info" />
              <MobileToolCard to="/ai-tutor" icon={Bot} title="AI tutor" description="Get a clear explanation when you are stuck" tone="warning" />
              <MobileToolCard to="/services" icon={Briefcase} title="Services" description="Buy e-PINs and track admission requests" tone="neutral" />
            </div>
          </MobileSection>

          <MobileSection title="Your progress">
          <div className="grid grid-cols-2 gap-3 animate-screen-in stagger-2 lg:grid-cols-4">
            <Metric
              label="Wallet"
              to="/wallet"
              value={walletLoading ? "…" : naira(walletBalance)}
              hint="Tap to fund"
              className="col-span-2 lg:col-span-1"
            />
            <Metric label="Tests taken" value={<CountUp value={stats.testsTaken} />} />
            <Metric
              label="Average"
              value={<CountUp value={stats.averageScore} suffix="%" />}
            />
            <Metric
              label="Rank"
              to="/leaderboard"
              value={stats.rank > 0 ? `#${stats.rank.toLocaleString()}` : "—"}
              hint={stats.totalStudents ? `of ${stats.totalStudents}` : "Practise to rank"}
              className="col-span-2 lg:col-span-1"
            />
          </div>
          </MobileSection>

          {/* Plan + admitted */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="app-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Crown className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{isPremium ? "Premium active" : "Go Premium"}</p>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? "Manage your plan" : "Unlock all subjects and mocks"}
                </p>
              </div>
              <Button size="sm" variant={isPremium ? "outline" : "default"} onClick={() => navigate("/payment")}>
                {isPremium ? "Manage" : "Upgrade"}
              </Button>
            </div>

            <div className="app-card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">I've been admitted</p>
                <p className="text-xs text-muted-foreground">Switch to Edura Campus</p>
              </div>
              <UpgradeToCampus />
            </div>
          </div>

          <Panel title="Achievements" className="animate-screen-in stagger-3">
            <BadgeStrip badges={gamify.badges} />
          </Panel>

          {/* 7. Access code — occasional, so it stays folded */}
          <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
            <CollapsibleTrigger className="app-card press flex w-full items-center gap-3 p-4 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Ticket className="h-4 w-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">Have an access code?</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  codeOpen && "rotate-90"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex gap-2">
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && redeemCode()}
                  placeholder="ENTER CODE"
                  className="h-11 uppercase"
                  disabled={redeeming}
                />
                <Button
                  onClick={redeemCode}
                  disabled={redeeming || !accessCode.trim()}
                  className="h-11"
                >
                  {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate"}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 8. Recent results + discover */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel
              title="Recent results"
              action={
                <Link
                  to="/performance-report"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View all
                </Link>
              }
            >
              {recentTests.length ? (
                <div className="space-y-2">
                  {recentTests.map((test) => (
                    <Link
                      key={test.attemptId}
                      to={`/results?attempt=${test.attemptId}`}
                      className="press flex items-center justify-between rounded-xl border px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{test.subject}</p>
                        <p className="text-[11px] text-muted-foreground">{test.date}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-lg px-2 py-1 text-xs font-bold tabular",
                          test.score >= 50
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {test.score}%
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState>No tests yet — start practising to see results here.</EmptyState>
              )}
            </Panel>

            <Panel title="Discover">
              <div className="grid gap-2 sm:grid-cols-2">
                <ListRow to="/study-hub" icon={Target} title="Study hub" meta="Planner & materials" />
                <ListRow to="/resources" icon={FileText} title="Past questions" meta="Downloadables" />
                <ListRow to="/ebooks" icon={Library} title="Ebook library" meta="Read online" />
                <ListRow href={EDUCATION_NEWS_URL} icon={Newspaper} title="Education news" meta="Admissions, scholarships & updates" />
                <ListRow to="/leaderboard" icon={Trophy} title="Leaderboard" meta="See your standing" />
                <ListRow to="/referral-program" icon={Award} title="Referrals" meta="Earn rewards" />
              </div>
            </Panel>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default Dashboard;
