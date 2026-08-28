import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MathRenderer } from '@/components/ui/math-renderer';
import Calculator from '@/components/Calculator';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Calculator as CalculatorIcon,
  Users,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';

interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
}

interface JambCBTInterfaceProps {
  questions: Question[];
  duration: number;
  onSubmit: (answers: { [key: number]: string }, timeSpent: number) => void;
  examTitle?: string;
  examDescription?: string;
}

interface SubjectQuestions {
  [subject: string]: {
    questions: Question[];
    completed: number;
    score?: number;
  };
}

const JambCBTInterface: React.FC<JambCBTInterfaceProps> = ({
  questions,
  duration,
  onSubmit,
  examTitle = "JAMB CBT Practice Test",
  examDescription = "Joint Admissions and Matriculation Board Computer Based Test"
}) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [subjectQuestions, setSubjectQuestions] = useState<SubjectQuestions>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { canAccessPremium, loading: subscriptionLoading } = useSubscription();

  // Group questions by subject on mount
  useEffect(() => {
    const grouped: SubjectQuestions = {};
    questions.forEach(question => {
      if (!grouped[question.subject]) {
        grouped[question.subject] = {
          questions: [],
          completed: 0
        };
      }
      grouped[question.subject].questions.push(question);
    });

    setSubjectQuestions(grouped);
    
    // Set first subject as current
    const firstSubject = Object.keys(grouped)[0];
    if (firstSubject) {
      setCurrentSubject(firstSubject);
    }
  }, [questions]);

  // Timer effect
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleManualSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeLeft]);

  // Anti-cheat measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        if (tabSwitchCount >= 2) {
          toast.warning('Excessive tab switching detected', {
            description: 'Leaving the exam repeatedly may affect your submission.',
            duration: 6000,
          });
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common cheating shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'f')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        toast.error('Action not allowed during the exam');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabSwitchCount]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleFlagQuestion = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const confirmSubmit = () => {
    setShowSubmitDialog(true);
  };

  const handleManualSubmit = useCallback(() => {
    if (!subscriptionLoading && !canAccessPremium) {
      setShowSubmitDialog(false);
      setShowUpgradeDialog(true);
      return;
    }
    setIsSubmitting(true);
    const timeSpent = (duration * 60) - timeLeft;
    onSubmit(answers, timeSpent);
  }, [answers, duration, timeLeft, onSubmit, canAccessPremium, subscriptionLoading]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getCurrentQuestion = () => {
    if (!currentSubject || !subjectQuestions[currentSubject]) return null;
    return subjectQuestions[currentSubject].questions[currentQuestionIndex] || null;
  };

  const nextQuestionInSubject = () => {
    const subjectData = subjectQuestions[currentSubject];
    if (subjectData && currentQuestionIndex < subjectData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestionInSubject = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const switchToSubject = (subject: string) => {
    setCurrentSubject(subject);
    setCurrentQuestionIndex(0);
  };

  const getSubjectProgress = (subject: string) => {
    if (!subjectQuestions[subject]) return 0;
    const answeredCount = subjectQuestions[subject].questions.filter(q => 
      answers.hasOwnProperty(q.id)
    ).length;
    return (answeredCount / subjectQuestions[subject].questions.length) * 100;
  };

  const getTotalProgress = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  const currentQuestion = getCurrentQuestion();

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading JAMB CBT Interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      {/* Header */}
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">JAMB</div>
              <div>
                <h1 className="text-lg font-bold">{examTitle}</h1>
                <p className="text-xs opacity-90">{examDescription}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className={`flex items-center px-4 py-2 rounded-xl font-mono text-lg font-bold ${
                timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-white/20'
              }`}>
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(timeLeft)}
              </div>
              
              {/* Controls */}
              <Button
                size="sm"
                onClick={togglePause}
                disabled={isSubmitting}
                className="bg-white/20 hover:bg-white/30 h-9 px-3"
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              
              <Button
                size="sm"
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="bg-white text-orange-600 hover:bg-white/90 font-bold h-9 px-4"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{Object.keys(answers).length}/{questions.length} answered</span>
              <span>{Math.round(getTotalProgress())}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {Object.keys(subjectQuestions).map((subject) => {
              const answeredInSubject = subjectQuestions[subject].questions.filter(q => answers.hasOwnProperty(q.id)).length;
              const isActive = currentSubject === subject;
              return (
                <button
                  key={subject}
                  onClick={() => switchToSubject(subject)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-orange-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  )}
                >
                  {subject}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    isActive ? "bg-white/30" : "bg-gray-100"
                  )}>
                    {answeredInSubject}/{subjectQuestions[subject].questions.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Anti-cheat warning */}
      {tabSwitchCount > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Tab switches detected: {tabSwitchCount}
              {tabSwitchCount >= 2 && " (Warning issued)"}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white/50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <Progress value={getTotalProgress()} className="h-2" />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        <div className={cn("grid gap-4 lg:grid-cols-[1fr_280px]")}>
          {/* Question Area */}
          <div className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-medium border-orange-200 bg-orange-50 text-orange-700">
                    {currentSubject}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Question Text */}
                <div className="p-4 rounded-xl bg-gray-50 border">
                  <MathRenderer
                    content={currentQuestion.question}
                    className="text-base font-medium leading-relaxed"
                  />
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === option;

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                        )}
                      >
                        <div className="flex items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full border-2 mr-3 flex items-center justify-center font-bold text-sm",
                            isSelected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-gray-300 text-gray-500"
                          )}>
                            {isSelected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + index)}
                          </div>
                          <MathRenderer content={option} className="flex-1 text-sm" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={prevQuestionInSubject}
                    disabled={currentQuestionIndex === 0}
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm font-semibold text-orange-600">
                    {currentQuestionIndex + 1} / {subjectQuestions[currentSubject]?.questions.length}
                  </span>

                  <Button
                    onClick={nextQuestionInSubject}
                    disabled={currentQuestionIndex === subjectQuestions[currentSubject]?.questions.length - 1}
                    className="bg-orange-500 hover:bg-orange-600"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Question Navigation Grid */}
            <Card className="border">
              <CardHeader className="py-2 px-3 border-b bg-gray-50">
                <CardTitle className="text-xs font-semibold text-gray-600">
                  {currentSubject || 'All Questions'} — Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {subjectQuestions[currentSubject]?.questions.map((q, idx) => {
                    const isAnswered = answers.hasOwnProperty(q.id);
                    const isCurrent = idx === currentQuestionIndex;
                    const isFlagged = flaggedQuestions.has(q.id);

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={cn(
                          "w-full aspect-square rounded-lg border text-xs font-bold flex items-center justify-center transition-all relative",
                          isCurrent && "bg-orange-500 text-white border-orange-500 shadow-md",
                          !isCurrent && isAnswered && "bg-green-100 text-green-700 border-green-300",
                          !isCurrent && !isAnswered && "bg-white text-gray-400 border-gray-200 hover:border-orange-300"
                        )}
                      >
                        {isFlagged && (
                          <Flag className="h-2 w-2 absolute -top-1 -right-1 fill-red-500 text-red-500" />
                        )}
                        {idx + 1}
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

            {/* Tools */}
            <Card className="border">
              <CardContent className="p-3 space-y-2">
                <Button
                  onClick={() => setIsCalculatorOpen(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                >
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calculator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFlagQuestion(currentQuestion.id)}
                  className={flaggedQuestions.has(currentQuestion.id) ? "bg-red-50 border-red-200" : ""}
                  size="sm"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {flaggedQuestions.has(currentQuestion.id) ? "Flagged" : "Flag"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-3">
            <DialogTitle className="text-xl font-bold">Submit JAMB CBT Test?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-600">{Object.keys(answers).length}</div>
                <div className="text-xs text-gray-500">Answered</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{flaggedQuestions.size}</div>
                <div className="text-xs text-gray-500">Flagged</div>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-600">{questions.length - Object.keys(answers).length}</div>
                <div className="text-xs text-gray-500">Unanswered</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 h-11"
              >
                Continue
              </Button>
              <Button 
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 font-bold"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border-2 shadow-2xl mx-4">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-xl font-bold">Test Paused</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-600">Your exam has been paused. Click resume to continue.</p>
              <Button onClick={togglePause} className="w-full bg-orange-500 hover:bg-orange-600 h-11">
                Resume Test
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculator Component */}
      <Calculator 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />

      {/* Upgrade Required Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold">Upgrade to Submit</DialogTitle>
            <DialogDescription className="text-sm">
              Subscribe to submit your test and unlock full results and explanations.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="flex-1 h-11">
              Continue Test
            </Button>
            <Link to="/payment" className="flex-1">
              <Button className="w-full h-11 bg-orange-500 hover:bg-orange-600">Upgrade Now</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JambCBTInterface;