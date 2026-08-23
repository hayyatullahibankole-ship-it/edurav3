import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Bot,
  FileText,
  MessageSquare,
  Sword,
  Target,
  Trophy,
  Layers,
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

const EXAM_TYPES = [
  { type: "jamb" as const, label: "JAMB", subtitle: "UTME practice", letter: "J" },
  { type: "waec" as const, label: "WAEC", subtitle: "SSCE practice", letter: "W" },
  { type: "neco" as const, label: "NECO", subtitle: "Senior secondary", letter: "N" },
  { type: "post-utme" as const, label: "POST-UTME", subtitle: "University practice", letter: "P" },
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
        <section className="animate-screen-in">
          <h2 className="mb-2 font-display text-sm font-bold">Choose your exam</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXAM_TYPES.map((exam, i) => {
              const inner = (
                <div
                  className={`app-card press w-full p-4 text-left animate-pop-in stagger-${Math.min(i + 1, 5)}`}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
                    {exam.letter}
                  </div>
                  <span className="block font-display text-sm font-bold">{exam.label}</span>
                  <span className="text-[10px] text-muted-foreground">{exam.subtitle}</span>
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

        <Panel title="Practice tools">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <ListRow to="/study-hub" icon={Target} title="Study hub" meta="Plan your sessions" />
            <ListRow to="/decks" icon={Layers} title="Study decks" meta="Turn a PDF into quizzes" />
            <ListRow to="/resources" icon={FileText} title="Past questions" meta="Browse by exam" />
            <ListRow to="/challenge-arena" icon={Sword} title="Challenge arena" meta="Compete in live challenges" />
            <ListRow to="/forum" icon={MessageSquare} title="Forum" meta="Ask and answer" />
            <ListRow to="/ai-tutor" icon={Bot} title="AI tutor" meta="Instant explanations" />
            <ListRow to="/leaderboard" icon={Trophy} title="Leaderboard" meta="Compare scores" />
          </div>
        </Panel>
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
