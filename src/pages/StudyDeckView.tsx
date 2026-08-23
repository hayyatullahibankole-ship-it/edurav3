import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Lock, RotateCcw, Trophy } from "lucide-react";
import AppShell from "@/components/edura/AppShell";
import { Panel } from "@/components/edura/tiles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ContentRenderer } from "@/components/ui/content-renderer";
import { useToast } from "@/hooks/use-toast";
import { useAcademicStage } from "@/hooks/useAcademicStage";
import { supabase } from "@/integrations/supabase/client";
import {
  computeUnlocked,
  type DeckAttempt,
  type DeckQuestion,
  type DeckSection,
  type StudyDeck,
} from "@/lib/studyDecks";

const StudyDeckView = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCampus } = useAcademicStage();

  const [deck, setDeck] = useState<StudyDeck | null>(null);
  const [sections, setSections] = useState<DeckSection[]>([]);
  const [attempts, setAttempts] = useState<DeckAttempt[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [questions, setQuestions] = useState<DeckQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"read" | "quiz" | "result">("read");
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!deckId) return;
    const [{ data: d }, { data: s }, { data: a }] = await Promise.all([
      supabase.from("study_decks").select("*").eq("id", deckId).maybeSingle(),
      supabase.from("deck_sections").select("*").eq("deck_id", deckId).order("order_index"),
      supabase.from("deck_section_attempts").select("id, section_id, percentage, passed, created_at").eq("deck_id", deckId),
    ]);
    setDeck((d as StudyDeck) ?? null);
    setSections((s as DeckSection[]) ?? []);
    setAttempts((a as DeckAttempt[]) ?? []);
    setLoading(false);
  }, [deckId]);

  useEffect(() => {
    load();
  }, [load]);

  const { unlockedUpTo, bestBySection } = useMemo(
    () => computeUnlocked(sections, attempts),
    [sections, attempts],
  );

  const passMark = deck?.pass_mark ?? 70;
  const completed = sections.filter((s) => attempts.some((a) => a.section_id === s.id && a.passed)).length;

  const openSection = async (index: number) => {
    if (index > unlockedUpTo) return;
    setActiveIndex(index);
    setMode("read");
    setAnswers({});
    setResult(null);
    const { data } = await supabase
      .from("deck_questions")
      .select("*")
      .eq("section_id", sections[index].id)
      .order("order_index");
    setQuestions(((data as any[]) ?? []).map((q) => ({ ...q, options: (q.options as string[]) ?? [] })));
  };

  const submitQuiz = async () => {
    if (!deck || activeIndex === null) return;
    const section = sections[activeIndex];
    const total = questions.length;
    const score = questions.filter((q) => answers[q.id] === q.correct_index).length;
    const percentage = total ? Math.round((score / total) * 100) : 0;
    const passed = percentage >= passMark;

    const { error } = await supabase.from("deck_section_attempts").insert({
      deck_id: deck.id,
      section_id: section.id,
      score,
      total,
      percentage,
      passed,
      answers: questions.map((q) => ({ id: q.id, chosen: answers[q.id] ?? null })),
    });
    if (error) {
      toast({ title: "Could not save your score", description: error.message, variant: "destructive" });
      return;
    }
    setResult({ score, total, percentage, passed });
    setMode("result");
    load();
  };

  if (loading) {
    return (
      <AppShell side={isCampus ? "campus" : "cbt"} title="Study Deck">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AppShell>
    );
  }

  if (!deck) {
    return (
      <AppShell side={isCampus ? "campus" : "cbt"} title="Study Deck">
        <Panel title="Not found">
          <p className="text-sm text-muted-foreground">This deck no longer exists.</p>
          <Button className="mt-3" onClick={() => navigate("/decks")}>Back to decks</Button>
        </Panel>
      </AppShell>
    );
  }

  const section = activeIndex !== null ? sections[activeIndex] : null;

  return (
    <AppShell
      side={isCampus ? "campus" : "cbt"}
      title={deck.title}
      subtitle={`${completed} of ${sections.length} sections passed · pass mark ${passMark}%`}
    >
      <div className="space-y-6">
        <Progress value={sections.length ? (completed / sections.length) * 100 : 0} />

        {!section && (
          <Panel title="Sections">
            <div className="space-y-2">
              {sections.map((s, i) => {
                const locked = i > unlockedUpTo;
                const passed = attempts.some((a) => a.section_id === s.id && a.passed);
                return (
                  <button
                    key={s.id}
                    onClick={() => openSection(i)}
                    disabled={locked}
                    className={`flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left ${
                      locked ? "opacity-60" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{s.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.summary ?? "Read, then take the quiz"}
                      </span>
                    </span>
                    {locked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : passed ? (
                      <Badge variant="secondary">{bestBySection[s.id] ?? 0}%</Badge>
                    ) : (
                      <Badge variant="outline">Open</Badge>
                    )}
                  </button>
                );
              })}
            </div>
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                This deck has no sections yet. {deck.error_message ?? ""}
              </p>
            )}
          </Panel>
        )}

        {section && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setActiveIndex(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> All sections
            </Button>

            {mode === "read" && (
              <Panel title={`${activeIndex! + 1}. ${section.title}`}>
                <ContentRenderer content={section.content} />
                <Button
                  className="mt-6 w-full"
                  onClick={() => setMode("quiz")}
                  disabled={questions.length === 0}
                >
                  {questions.length ? `Take the quiz (${questions.length} questions)` : "No quiz for this section"}
                </Button>
              </Panel>
            )}

            {mode === "quiz" && (
              <Panel title={`Quiz — ${section.title}`}>
                <div className="space-y-5">
                  {questions.map((q, qi) => (
                    <div key={q.id} className="space-y-2">
                      <p className="text-sm font-semibold">
                        {qi + 1}. {q.question}
                      </p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                            className={`w-full rounded-lg border p-2.5 text-left text-sm ${
                              answers[q.id] === oi ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    className="w-full"
                    onClick={submitQuiz}
                    disabled={Object.keys(answers).length < questions.length}
                  >
                    Submit quiz
                  </Button>
                </div>
              </Panel>
            )}

            {mode === "result" && result && (
              <Panel title="Your score">
                <div className="space-y-4 text-center">
                  {result.passed ? (
                    <Trophy className="mx-auto h-10 w-10 text-primary" />
                  ) : (
                    <RotateCcw className="mx-auto h-10 w-10 text-muted-foreground" />
                  )}
                  <p className="text-3xl font-extrabold">{result.percentage}%</p>
                  <p className="text-sm text-muted-foreground">
                    {result.score} of {result.total} correct.{" "}
                    {result.passed
                      ? "Section passed — the next one is unlocked."
                      : `You need ${passMark}% to unlock the next section.`}
                  </p>
                  <div className="space-y-3 pt-2 text-left">
                    {questions.map((q, qi) => {
                      const chosen = answers[q.id];
                      const right = chosen === q.correct_index;
                      return (
                        <div key={q.id} className="rounded-lg border border-border p-3">
                          <p className="text-sm font-semibold">
                            {qi + 1}. {q.question}
                          </p>
                          <p className={`mt-1 text-xs ${right ? "text-primary" : "text-destructive"}`}>
                            {right ? "Correct" : `Your answer: ${q.options[chosen] ?? "—"}`}
                          </p>
                          {!right && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              {q.options[q.correct_index]}
                              {q.explanation ? ` — ${q.explanation}` : ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setAnswers({});
                        setMode("quiz");
                      }}
                    >
                      Retake
                    </Button>
                    {result.passed && activeIndex! + 1 < sections.length ? (
                      <Button className="flex-1" onClick={() => openSection(activeIndex! + 1)}>
                        Next section
                      </Button>
                    ) : (
                      <Button className="flex-1" onClick={() => setActiveIndex(null)}>
                        Back to sections
                      </Button>
                    )}
                  </div>
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default StudyDeckView;
