import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  ClipboardCheck,
  GraduationCap,
  School,
  BookOpen,
  Bot,
  FileText,
  MessageSquare,
  Sword,
  Target,
  Trophy,
  Layers,
  Play,
} from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { ListRow, Panel, EmptyState } from "@/components/edura/tiles";
import ScheduleTestModal from "@/components/ScheduleTestModal";
import SchoolAvailableExams from "@/components/school/SchoolAvailableExams";
import MockResultChecker from "@/components/MockResultChecker";
import { InstallRequiredModal } from "@/components/InstallRequiredModal";
import { Button } from "@/components/ui/button";
import { useStudentStats } from "@/hooks/useStudentStats";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { MobileSection, PrimaryActionCard, MobileToolCard } from "@/components/edura/MobilePrimitives";
import ExamBadge from "@/components/edura/ExamBadge";


const EXAM_TYPES = [
  { type: "jamb" as const, label: "JAMB", subtitle: "UTME practice", icon: GraduationCap },
  { type: "waec" as const, label: "WAEC", subtitle: "SSCE practice", icon: FileText },
  { type: "neco" as const, label: "NECO", subtitle: "Senior secondary", icon: ClipboardCheck },
  { type: "post-utme" as const, label: "POST-UTME", subtitle: "University practice", icon: School },
];

/**
 * The dedicated CBT workspace: everything about practising and tracking exams.
 */
const CBTHome = () => {
  const { stats, recentTests, subjectProgress, loading } = useStudentStats();
  const isMobile = useIsMobile();
  const { isInstalledApp } = useInstalledApp();
  const isMobileBrowser = isMobile && !isInstalledApp;

  const [showMockResult, setShowMockResult] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  if (showMockResult) {
    return (
      <AppShell side="cbt" title="Mock result checker" subtitle="Check your official mock results">
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setShowMockResult(false)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to CBT
          </Button>
          <MockResultChecker />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      side="cbt"
      title="CBT Practice"
      subtitle="Pick an exam, practise under real conditions and track your progress."
      action={
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowMockResult(true)}>
          <Award className="h-4 w-4" /> Mock result
        </Button>
      }
    >
      <div className="space-y-4">
        <PrimaryActionCard
          eyebrow="Recommended"
          title="Practise with real exam questions"
          description="Pick an exam below to start a timed session, then review every answer immediately."
          to="/study-hub"
          actionLabel="Browse study hub"
          icon={Play}
        />

        <section className="animate-screen-in">
          <div className="mb-3">
            <h2 className="font-display text-[15px] font-bold">Choose your exam</h2>
            <p className="mt-1 text-xs text-muted-foreground">We will use your choice to show the right subjects and timing.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXAM_TYPES.map((exam, i) => {
              const inner = (
                <div
                  className={`app-card press flex w-full items-center gap-3 p-3.5 text-left animate-pop-in stagger-${Math.min(i + 1, 5)}`}
                >
                  <ExamBadge exam={exam.type} />
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-extrabold">{exam.label}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{exam.subtitle}</span>
                  </span>
                </div>
              );

              return isMobileBrowser ? (
                <button
                  key={exam.type}
                  className="text-left"
                  onClick={() => {
                    setBlockedFeature(`${exam.label} Practice`);
                    setShowInstallModal(true);
                  }}
                >
                  {inner}
                </button>
              ) : (
                <ScheduleTestModal key={exam.type} defaultExamType={exam.type}>
                  <button className="w-full text-left">{inner}</button>
                </ScheduleTestModal>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-[1.25rem]" />
            ))}
          </div>
        ) : (
          <MobileSection title="Your progress">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 animate-screen-in stagger-2">
            {[
              { label: "Tests taken", value: `${stats.testsTaken}` },
              { label: "Average", value: `${stats.averageScore}%` },
              { label: "Study hours", value: `${stats.studyHours}h` },
              { label: "Rank", value: stats.rank > 0 ? `#${stats.rank}` : "—" },
            ].map((m) => (
              <div key={m.label} className="app-card p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </span>
                <p className="mt-1 font-display text-2xl font-bold tabular">{m.value}</p>
              </div>
            ))}
          </div>
          </MobileSection>
        )}


        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Subject progress">
            {loading ? (
              <EmptyState>Loading…</EmptyState>
            ) : subjectProgress.length ? (
              <div className="space-y-4">
                {subjectProgress.slice(0, 6).map((subject) => (
                  <div key={subject.subject}>
                    <div className="mb-1.5 flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">{subject.subject}</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Complete tests to track your subject progress.</EmptyState>
            )}
          </Panel>

          <Panel
            title="Recent results"
            action={
              <Link to="/performance-report" className="text-xs font-semibold text-primary hover:underline">
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
                    className="flex items-center justify-between rounded-xl border px-3.5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{test.subject}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {test.date} · {test.duration}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">{test.score}%</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState>No results yet — take your first test.</EmptyState>
            )}
          </Panel>
        </div>

        <Panel title="School exams">
          <SchoolAvailableExams />
        </Panel>

        <MobileSection title="Practice tools">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MobileToolCard to="/study-hub" icon={Target} title="Study hub" description="Plan your sessions" tone="mint" />
            <MobileToolCard to="/decks" icon={Layers} title="Study decks" description="Turn a PDF into quizzes" tone="sky" />
            <MobileToolCard to="/resources" icon={FileText} title="Past questions" description="Browse by exam" tone="butter" />
            <MobileToolCard to="/challenge-arena" icon={Sword} title="Challenge arena" description="Compete live with friends" tone="lilac" />
            <MobileToolCard to="/forum" icon={MessageSquare} title="Forum" description="Ask and answer" tone="peach" />
            <MobileToolCard to="/ai-tutor" icon={Bot} title="Ask a tutor" description="Instant explanations" tone="sky" />
            <MobileToolCard to="/leaderboard" icon={Trophy} title="Leaderboard" description="Compare your scores" tone="butter" />
            <MobileToolCard to="/performance-report" icon={Award} title="My report" description="See where you improve" tone="mint" />
          </div>
        </MobileSection>

      </div>

      <InstallRequiredModal
        open={showInstallModal}
        onOpenChange={setShowInstallModal}
        featureName={blockedFeature}
      />
    </AppShell>
  );
};

export default CBTHome;
