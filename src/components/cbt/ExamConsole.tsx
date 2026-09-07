import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MathRenderer } from '@/components/ui/math-renderer';
import { QuestionMedia, OptionMedia } from '@/components/questions/QuestionMedia';
import Calculator from '@/components/Calculator';
import { cn } from '@/lib/utils';
import { CBTQuestion, CBTAnswers } from '@/hooks/useCBTExam';
import { useProctoring, ProctoringMode } from '@/components/cbt/useProctoring';
import {
  Camera,
  CameraOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Grid3X3,
  Calculator as CalculatorIcon,
  ShieldCheck,
} from 'lucide-react';

export interface ExamCandidate {
  name?: string | null;
  photoUrl?: string | null;
  regNumber?: string | null;
}

export interface ExamConsoleProps {
  questions: CBTQuestion[];
  answers: CBTAnswers;
  onAnswerSelect: (questionId: string, optionIndex: number) => void;
  onSubmit: (timeSpent: number) => void | Promise<void>;
  duration: number; // minutes
  examTitle?: string;
  submitting?: boolean;
  disableSubmit?: boolean;
  candidate?: ExamCandidate;
  attemptId?: string | null;
  proctoring?: ProctoringMode;
  /** Return false to block submission (e.g. subscription required). */
  canSubmit?: () => boolean;
  onSubmitBlocked?: () => void;
}

const formatTime = (seconds: number) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(v => v.toString().padStart(2, '0')).join(':');
};

const initialsOf = (name?: string | null) =>
  (name || 'Candidate')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || 'C';

export const ExamConsole: React.FC<ExamConsoleProps> = ({
  questions,
  answers,
  onAnswerSelect,
  onSubmit,
  duration,
  examTitle = 'Computer Based Test',
  submitting = false,
  disableSubmit = false,
  candidate,
  attemptId,
  proctoring = 'off',
  canSubmit,
  onSubmitBlocked,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [started, setStarted] = useState(proctoring === 'off');
  const [requesting, setRequesting] = useState(false);
  const hasAutoSubmittedRef = useRef(false);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];

  const autoSubmit = useCallback(
    (reason: string) => {
      if (hasAutoSubmittedRef.current) return;
      hasAutoSubmittedRef.current = true;
      toast.info(reason);
      submitRef.current((duration * 60) - timeLeft);
    },
    [duration, timeLeft],
  );

  const proctor = useProctoring({
    mode: proctoring,
    attemptId,
    onViolationLimit: () => autoSubmit('Your exam is being submitted.'),
  });

  // Timer
  useEffect(() => {
    if (!started) return;
    if (timeLeft <= 0) {
      if (!hasAutoSubmittedRef.current && !submitting) {
        hasAutoSubmittedRef.current = true;
        toast.info('Time is up! Your exam is being submitted automatically.');
        submitRef.current(duration * 60);
      }
      return;
    }
    const id = window.setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => window.clearInterval(id);
  }, [timeLeft, duration, submitting, started]);

  // Subjects
  const subjects = useMemo(() => {
    const map = new Map<string, number[]>();
    questions.forEach((q, idx) => {
      const list = map.get(q.subject) || [];
      list.push(idx);
      map.set(q.subject, list);
    });
    return Array.from(map.entries()).map(([name, indices]) => ({ name, indices }));
  }, [questions]);

  const activeSubject = currentQuestion?.subject;
  const activeIndices = useMemo(
    () => subjects.find(s => s.name === activeSubject)?.indices ?? questions.map((_, i) => i),
    [subjects, activeSubject, questions],
  );
  const positionInSubject = activeIndices.indexOf(currentIndex) + 1;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      const key = e.key.toLowerCase();
      const letterIndex = ['a', 'b', 'c', 'd', 'e'].indexOf(key);
      if (letterIndex > -1 && letterIndex < currentQuestion.options.length) {
        onAnswerSelect(currentQuestion.id, letterIndex);
      }
      if (e.key === 'ArrowRight') setCurrentIndex(p => Math.min(questions.length - 1, p + 1));
      if (e.key === 'ArrowLeft') setCurrentIndex(p => Math.max(0, p - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQuestion, onAnswerSelect, questions.length]);

  const handleSubmit = async () => {
    if (submitting || disableSubmit) return;
    if (canSubmit && !canSubmit()) {
      setShowSubmitDialog(false);
      onSubmitBlocked?.();
      return;
    }
    try {
      await proctor.captureSnapshot();
      await onSubmit(duration * 60 - timeLeft);
      setShowSubmitDialog(false);
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  const startExam = async () => {
    setRequesting(true);
    const ok = await proctor.requestCamera();
    setRequesting(false);
    if (ok || proctoring === 'optional') setStarted(true);
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading exam...</p>
      </div>
    );
  }

  /* ---------------- Pre-exam camera check ---------------- */
  if (!started) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold">Exam verification</h1>
              <p className="text-xs text-muted-foreground">{examTitle}</p>
            </div>
          </div>

          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
            <video
              ref={proctor.videoRef}
              muted
              playsInline
              className={cn('h-full w-full object-cover', !proctor.cameraActive && 'hidden')}
            />
            {!proctor.cameraActive && <CameraOff className="h-8 w-8 text-muted-foreground" />}
          </div>

          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Your camera stays on and photos are taken during the exam.</li>
            <li>• Leaving the exam screen, copying or pasting is recorded.</li>
            <li>• After {proctor.violationLimit} warnings your exam is submitted automatically.</li>
          </ul>

          {proctor.cameraError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {proctor.cameraError}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={startExam} disabled={requesting}>
              <Camera className="h-4 w-4 mr-2" />
              {proctor.cameraActive ? 'Recheck camera' : 'Enable camera'}
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={startExam}
              disabled={requesting || (proctoring === 'required' && !proctor.cameraActive && !!proctor.cameraError)}
            >
              {requesting ? 'Checking...' : 'Start exam'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Question grid ---------------- */
  const gridButtons = (indices: number[], compact = false) => (
    <div className={cn('grid gap-1.5', compact ? 'grid-cols-8' : 'grid-cols-10')}>
      {indices.map(idx => {
        const q = questions[idx];
        const answered = answers[q.id] !== undefined;
        const isFlagged = flagged[q.id];
        const isCurrent = idx === currentIndex;
        return (
          <button
            key={q.id}
            onClick={() => {
              setCurrentIndex(idx);
              setShowGrid(false);
            }}
            className={cn(
              'aspect-square rounded-md border text-xs font-bold transition-colors',
              isCurrent && 'bg-primary text-primary-foreground border-primary',
              !isCurrent && isFlagged && 'bg-warning/20 text-warning-foreground border-warning',
              !isCurrent && !isFlagged && answered && 'bg-success/15 text-success border-success/40',
              !isCurrent && !isFlagged && !answered && 'bg-card text-muted-foreground hover:border-primary/50',
            )}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-primary" /> Current</span>
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-success/40" /> Answered</span>
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-warning/40" /> Flagged</span>
      <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm border bg-card" /> Not answered</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col select-none pb-40 lg:pb-4">
      {/* ---------- Candidate bar ---------- */}
      <header className="sticky top-0 z-40 border-b bg-card" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-4">
          <Avatar className="h-10 w-10 rounded-md border">
            <AvatarImage src={candidate?.photoUrl || undefined} alt={candidate?.name || 'Candidate'} />
            <AvatarFallback className="rounded-md text-xs font-bold">{initialsOf(candidate?.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">{candidate?.name || 'Candidate'}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {candidate?.regNumber ? `${candidate.regNumber} • ` : ''}{examTitle}
            </p>
          </div>

          {proctor.enabled && (
            <div className="hidden sm:block relative h-10 w-14 overflow-hidden rounded-md border bg-muted">
              <video ref={proctor.videoRef} muted playsInline className="h-full w-full object-cover" />
              <span
                className={cn(
                  'absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full',
                  proctor.cameraActive ? 'bg-destructive animate-pulse' : 'bg-muted-foreground',
                )}
              />
            </div>
          )}

          <div
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-sm font-bold tabular-nums',
              timeLeft < 300 ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'bg-muted',
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* ---------- Subject tabs ---------- */}
        {subjects.length > 1 && (
          <div className="border-t bg-muted/60">
            <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-1.5 scrollbar-hide">
              {subjects.map(subject => {
                const answeredInSubject = subject.indices.filter(i => answers[questions[i].id] !== undefined).length;
                const isActive = subject.name === activeSubject;
                return (
                  <button
                    key={subject.name}
                    onClick={() => setCurrentIndex(subject.indices[0])}
                    className={cn(
                      'whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    {subject.name}
                    <span className={cn('ml-1.5 text-[10px]', isActive ? 'opacity-80' : 'text-muted-foreground')}>
                      {answeredInSubject}/{subject.indices.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ---------- Question panel ---------- */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <section className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-bold">
                Question {positionInSubject} of {activeIndices.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={flagged[currentQuestion.id] ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    setFlagged(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }))
                  }
                >
                  <Flag className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Flag</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={() => setShowCalculator(true)}>
                  <CalculatorIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className="text-[15px] leading-relaxed">
                <MathRenderer content={currentQuestion.questionText} className="break-words font-medium" />
                <QuestionMedia media={currentQuestion.media} className="mt-3" />
              </div>

              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => onAnswerSelect(currentQuestion.id, index)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                        isSelected ? 'border-primary bg-primary/5' : 'bg-card hover:border-primary/50',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + index)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <MathRenderer content={option} className="break-words text-sm" />
                        <OptionMedia media={currentQuestion.optionMedia?.[index]} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Desktop question grid */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-3 rounded-xl border bg-card p-3">
              <p className="text-xs font-bold text-muted-foreground">
                {activeSubject} • {answeredCount}/{questions.length} answered
              </p>
              {gridButtons(activeIndices, true)}
              {legend}
              <Button
                className="h-10 w-full"
                onClick={() => setShowSubmitDialog(true)}
                disabled={submitting || disableSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit exam'}
              </Button>
            </div>
          </aside>
        </div>
      </main>

      {/* ---------- Bottom console ---------- */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-2 scrollbar-hide">
          {activeIndices.map(idx => {
            const q = questions[idx];
            const answered = answers[q.id] !== undefined;
            const isFlagged = flagged[q.id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'h-8 w-8 flex-shrink-0 rounded-md border text-xs font-bold',
                  isCurrent && 'bg-primary text-primary-foreground border-primary',
                  !isCurrent && isFlagged && 'bg-warning/20 border-warning',
                  !isCurrent && !isFlagged && answered && 'bg-success/15 text-success border-success/40',
                  !isCurrent && !isFlagged && !answered && 'bg-card text-muted-foreground',
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t px-2 py-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 flex-1"
            onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Sheet open={showGrid} onOpenChange={setShowGrid}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 px-3">
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader className="mb-3">
                <SheetTitle className="text-sm">All questions ({answeredCount}/{questions.length} answered)</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                {subjects.map(s => (
                  <div key={s.name} className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground">{s.name}</p>
                    {gridButtons(s.indices)}
                  </div>
                ))}
                {legend}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            size="sm"
            className="h-10 flex-1"
            onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))}
            disabled={currentIndex === questions.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="destructive"
            className="h-10 px-4"
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitting || disableSubmit}
          >
            {submitting ? '...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Desktop nav buttons */}
      <div className="mx-auto hidden w-full max-w-7xl gap-2 px-4 pb-4 lg:flex">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button
          onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))}
          disabled={currentIndex === questions.length - 1}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* ---------- Submit dialog ---------- */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-5">
            <h2 className="text-center text-lg font-bold">Submit exam?</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xl font-bold text-success">{answeredCount}</p>
                <p className="text-[11px] text-muted-foreground">Answered</p>
              </div>
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xl font-bold text-destructive">{questions.length - answeredCount}</p>
                <p className="text-[11px] text-muted-foreground">Left</p>
              </div>
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xl font-bold">{questions.length}</p>
                <p className="text-[11px] text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1" onClick={() => setShowSubmitDialog(false)}>
                Continue exam
              </Button>
              <Button className="h-11 flex-1" onClick={handleSubmit} disabled={submitting || disableSubmit}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  );
};

export default ExamConsole;
