import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MathRenderer } from '@/components/ui/math-renderer';
import { Clock, ChevronLeft, ChevronRight, Check, Calculator as CalculatorIcon, Camera, AlertTriangle, Eye } from 'lucide-react';
import { QuestionMedia, OptionMedia } from "@/components/questions/QuestionMedia";
import { cn } from '@/lib/utils';
import { CBTQuestion, CBTAnswers } from '@/hooks/useCBTExam';
import Calculator from '@/components/Calculator';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface MockCBTInterfaceProps {
  questions: CBTQuestion[];
  answers: CBTAnswers;
  onAnswerSelect: (questionId: string, optionIndex: number) => void;
  onSubmit: (timeSpent?: number) => Promise<void>;
  duration: number;
  examTitle?: string;
  submitting?: boolean;
  disableSubmit?: boolean;
}

export const MockCBTInterface: React.FC<MockCBTInterfaceProps> = ({
  questions,
  answers,
  onAnswerSelect,
  onSubmit,
  duration,
  examTitle = 'AKBOY JAMB Mock Examination',
  submitting = false,
  disableSubmit = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasAutoSubmittedRef = useRef(false);
  const isMobile = useIsMobile();

  const currentQuestion = questions[currentIndex];

  // Get unique subjects from questions
  const subjects = React.useMemo(() => {
    const subjectMap = new Map<string, number[]>();
    questions.forEach((q, idx) => {
      const existing = subjectMap.get(q.subject) || [];
      existing.push(idx);
      subjectMap.set(q.subject, existing);
    });
    return Array.from(subjectMap.entries()).map(([name, indices]) => ({ name, indices }));
  }, [questions]);

  // Set initial active subject
  useEffect(() => {
    if (subjects.length > 0 && !activeSubject) {
      setActiveSubject(subjects[0].name);
    }
  }, [subjects, activeSubject]);

  // Get questions for the active subject
  const activeSubjectData = subjects.find(s => s.name === activeSubject);
  const subjectQuestionIndices = activeSubjectData?.indices || [];

  // Start camera for proctoring
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.error("Camera start failed:", err);
        toast.error("Camera access lost. Please re-enable camera access.");
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Anti-cheat: tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setSuspiciousCount(prev => {
          const newCount = prev + 1;
          toast.warning(`Warning: Tab switch detected (${newCount}/3). Exam will auto-submit at 3 violations.`);
          return newCount;
        });
      }
    };

    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); toast.warning("Copy is disabled during exam"); };
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); toast.warning("Paste is disabled during exam"); };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const blocked = ['c', 'v', 'a', 's', 'p', 'f', 'r', 'u', 'i'];
        if (blocked.includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }
      if (['F5', 'F11', 'F12'].includes(e.key)) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-submit on 3 suspicious activities
  useEffect(() => {
    if (suspiciousCount >= 3 && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      toast.error("Too many violations detected. Exam is being auto-submitted.");
      const timeSpent = (duration * 60) - timeLeft;
      onSubmit(timeSpent);
    }
  }, [suspiciousCount, duration, timeLeft, onSubmit]);

  // Timer with auto-submit
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        toast.info("Time is up! Your exam is being submitted automatically.");
        const timeSpent = duration * 60;
        onSubmit(timeSpent);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, duration, onSubmit]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitClick = useCallback(async () => {
    if (submitting || disableSubmit || hasAutoSubmittedRef.current) return;
    const timeSpent = (duration * 60) - timeLeft;
    try {
      await onSubmit(timeSpent);
      setShowSubmitDialog(false);
    } catch (error) {
      console.error('Submission error:', error);
    }
  }, [submitting, disableSubmit, duration, timeLeft, onSubmit]);

  const progressPercentage = (Object.keys(answers).length / questions.length) * 100;
  const isTimeWarning = timeLeft < 300; // less than 5 minutes

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      {/* Header */}
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src="/akboy-logo.png" alt="AKBOY" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white p-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold truncate">{examTitle}</h1>
                <p className="text-xs opacity-90 whitespace-nowrap">Q {currentIndex + 1}/{questions.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-wrap">
              {/* Camera indicator */}
              <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 whitespace-nowrap ${
                cameraActive ? 'bg-green-600/30 text-white' : 'bg-red-600/50 text-white'
              }`}>
                <Camera className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{cameraActive ? 'Recording' : 'Off'}</span>
                {cameraActive && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
              </div>

              {/* Suspicious activity counter */}
              {suspiciousCount > 0 && (
                <div className="flex items-center gap-0.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600/40 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 whitespace-nowrap">
                  <AlertTriangle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  {suspiciousCount}/3
                </div>
              )}

              {/* Timer */}
              <div className={`flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 rounded-xl font-mono text-xs sm:text-lg font-bold whitespace-nowrap flex-shrink-0 ${
                isTimeWarning ? 'bg-red-600 animate-pulse' : 'bg-white/20'
              }`}>
                <Clock className="h-2.5 w-2.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-base">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Second row of controls */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              onClick={() => setShowCalculator(true)}
              className="bg-white/20 hover:bg-white/30 h-7 sm:h-9 px-2 sm:px-3 flex-shrink-0"
            >
              <CalculatorIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
              disabled={submitting || disableSubmit}
              className="bg-white text-orange-600 hover:bg-white/90 font-bold h-7 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0"
            >
              <span className="hidden sm:inline">{submitting ? 'Submitting...' : 'Submit'}</span>
              <span className="sm:hidden">{submitting ? '...' : 'OK'}</span>
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
              <span className="whitespace-nowrap">{Object.keys(answers).length}/{questions.length}</span>
              <span className="whitespace-nowrap">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Tabs - only on desktop wide screens */}
      {!isMobile && subjects.length > 0 && (
        <div className="hidden lg:block bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {subjects.map((subject) => {
                const answeredInSubject = subject.indices.filter(i => answers[questions[i].id] !== undefined).length;
                const isActive = activeSubject === subject.name;
                return (
                  <button
                    key={subject.name}
                    onClick={() => {
                      setActiveSubject(subject.name);
                      setCurrentIndex(subject.indices[0]);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-orange-500 text-white shadow-md"
                        : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                    )}
                  >
                    <span className="truncate">{subject.name}</span>
                    <span className={cn(
                      "text-[8px] px-1 py-0.5 rounded font-bold flex-shrink-0",
                      isActive ? "bg-white/30" : "bg-gray-100"
                    )}>
                      {answeredInSubject}/{subject.indices.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 overflow-hidden">
        <div className={cn("grid gap-3 sm:gap-4", !isMobile && "lg:grid-cols-[1fr_280px]")}>
          {/* Question Area */}
          <div className="space-y-3 sm:space-y-4 min-w-0">
            {/* Mobile Subject Selector */}
            {isMobile && subjects.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-2 px-0.5">
                {subjects.map((subject) => (
                  <button
                    key={subject.name}
                    onClick={() => {
                      setActiveSubject(subject.name);
                      setCurrentIndex(subject.indices[0]);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border transition-all flex-shrink-0",
                      activeSubject === subject.name
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    )}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            )}

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base font-bold flex-shrink-0">
                    Q {currentIndex + 1}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-medium border-orange-200 bg-orange-50 text-orange-700 flex-shrink-0">
                    {currentQuestion.subject}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                {/* Question Text */}
                <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 border text-sm sm:text-base overflow-x-auto">
                  <MathRenderer
                    content={currentQuestion.questionText}
                    className="text-sm sm:text-base font-medium leading-relaxed break-words"
                  />
                  <QuestionMedia media={currentQuestion.media} className="mt-3" />
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === index;
                    const optionLabel = String.fromCharCode(65 + index);

                    return (
                      <button
                        key={index}
                        onClick={() => onAnswerSelect(currentQuestion.id, index)}
                        className={cn(
                          "w-full text-left p-2.5 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                        )}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                          <div className={cn(
                            "w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 mt-0.5",
                            isSelected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-gray-300 text-gray-500"
                          )}>
                            {isSelected ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : optionLabel}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <MathRenderer content={option} className="text-xs sm:text-sm break-words" />
                            <OptionMedia media={currentQuestion.optionMedia?.[index]} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center gap-2 pt-3 sm:pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10 flex-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1 flex-shrink-0" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <span className="text-xs sm:text-sm font-semibold text-orange-600 px-2 flex-shrink-0 whitespace-nowrap">
                    {currentIndex + 1}/{questions.length}
                  </span>

                  <Button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="bg-orange-500 hover:bg-orange-600 text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-10 flex-1"
                    size="sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1 flex-shrink-0" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Hidden on mobile, only on lg screens */}
          <div className="hidden lg:flex lg:flex-col lg:space-y-4">

            {/* Camera Feed */}
            <Card className="border overflow-hidden">
              <CardHeader className="py-2 px-3 bg-gray-50 border-b">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <Eye className="w-3.5 h-3.5" />
                  Proctoring Camera
                  {cameraActive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-auto" />}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video bg-black object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </CardContent>
            </Card>

            {/* Question Navigation Grid */}
            <Card className="border">
              <CardHeader className="py-2 px-3 border-b bg-gray-50">
                <CardTitle className="text-xs font-semibold text-gray-600">
                  {activeSubject || 'All Questions'} — Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {subjectQuestionIndices.map((qIdx) => {
                    const q = questions[qIdx];
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = qIdx === currentIndex;
                    const displayNum = subjectQuestionIndices.indexOf(qIdx) + 1;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(qIdx)}
                        className={cn(
                          "w-full aspect-square rounded-lg border text-xs font-bold flex items-center justify-center transition-all",
                          isCurrent && "bg-orange-500 text-white border-orange-500 shadow-md",
                          !isCurrent && isAnswered && "bg-green-100 text-green-700 border-green-300",
                          !isCurrent && !isAnswered && "bg-white text-gray-400 border-gray-200 hover:border-orange-300"
                        )}
                      >
                        {displayNum}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500" /> Current
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Answered
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-white border border-gray-200" /> Unanswered
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-sm border-2 shadow-2xl">
            <CardHeader className="text-center pb-2 sm:pb-3">
              <CardTitle className="text-lg sm:text-xl font-bold">Submit Exam?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl border border-green-200">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{Object.keys(answers).length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Answered</div>
                </div>
                <div className="p-2 sm:p-3 bg-red-50 rounded-lg sm:rounded-xl border border-red-200">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{questions.length - Object.keys(answers).length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Unanswered</div>
                </div>
                <div className="p-2 sm:p-3 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-200">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{questions.length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Total</div>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="flex-1 h-9 sm:h-11 text-sm">
                  Continue
                </Button>
                <Button
                  onClick={handleSubmitClick}
                  className="flex-1 h-9 sm:h-11 bg-orange-500 hover:bg-orange-600 font-bold text-sm"
                  disabled={submitting || disableSubmit}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculator */}
      <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  );
};
