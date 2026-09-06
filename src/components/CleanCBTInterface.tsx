import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MathRenderer } from '@/components/ui/math-renderer';
import { Clock, ChevronLeft, ChevronRight, Check, Lock, Crown, Calculator as CalculatorIcon, Eye, FileText } from 'lucide-react';
import { QuestionMedia, OptionMedia } from "@/components/questions/QuestionMedia";
import { cn } from '@/lib/utils';
import { CBTQuestion, CBTAnswers } from '@/hooks/useCBTExam';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';
import Calculator from '@/components/Calculator';

interface CleanCBTInterfaceProps {
  questions: CBTQuestion[];
  answers: CBTAnswers;
  onAnswerSelect: (questionId: string, optionIndex: number) => void;
  onSubmit: (timeSpent: number) => Promise<void>;
  duration: number;
  examTitle?: string;
  submitting?: boolean;
  bypassSubscription?: boolean;
  disableSubmit?: boolean;
}

export const CleanCBTInterface: React.FC<CleanCBTInterfaceProps> = ({
  questions,
  answers,
  onAnswerSelect,
  onSubmit,
  duration,
  examTitle = 'CBT Exam',
  submitting = false,
  bypassSubscription = false,
  disableSubmit = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const { canAccessPremium, loading: subscriptionLoading } = useSubscription();

  const currentQuestion = questions[currentIndex];

  const hasAutoSubmittedRef = useRef(false);

  // Timer with auto-submit
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasAutoSubmittedRef.current && !submitting) {
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
  }, [timeLeft, duration, onSubmit, submitting]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitClick = async () => {
    // Prevent double submission
    if (submitting || disableSubmit) return;
    
    // Block submission for free/basic users
    if (!bypassSubscription && !subscriptionLoading && !canAccessPremium) {
      setShowSubmitDialog(false);
      setShowUpgradeDialog(true);
      return;
    }
    const timeSpent = (duration * 60) - timeLeft;
    try {
      await onSubmit(timeSpent);
      // Close the dialog after successful submission
      setShowSubmitDialog(false);
    } catch (error) {
      console.error('Submission error:', error);
      // Error toast should be handled in onSubmit
      // Keep dialog open so user can try again
    }
  };

  const progressPercentage = (Object.keys(answers).length / questions.length) * 100;

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="rounded-md border bg-muted p-2 flex-shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base font-semibold truncate">{examTitle}</h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Q {currentIndex + 1}/{questions.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 justify-end flex-wrap">
              {/* Timer */}
              <div className={cn(
                "flex items-center rounded-lg border px-2 sm:px-3 py-1.5 font-mono text-sm font-semibold whitespace-nowrap",
                timeLeft < 300 ? "border-destructive/40 bg-destructive/10 text-destructive" : "bg-muted"
              )}>
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              
              {/* Controls */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCalculator(true)}
                className="h-9 px-2.5 flex-shrink-0"
              >
                <CalculatorIcon className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={() => setShowSubmitDialog(true)}
                disabled={submitting || disableSubmit}
                className="h-9 px-4 text-sm flex-shrink-0"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
              <span className="whitespace-nowrap">{Object.keys(answers).length}/{questions.length} answered</span>
              <span className="whitespace-nowrap">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </div>
      </div>


      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 overflow-hidden">
        <div className={cn("grid gap-3 sm:gap-4 lg:grid-cols-[1fr_280px]")}>  
          {/* Question Area */}
          <div className="space-y-3 sm:space-y-4 min-w-0">
            <Card className="border">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm sm:text-base font-semibold flex-shrink-0">
                    Q {currentIndex + 1}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium flex-shrink-0">
                    {currentQuestion.subject}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                {/* Question Text */}
                <div className="p-2.5 sm:p-4 rounded-lg bg-muted border text-sm sm:text-base overflow-x-auto">
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

                    return (
                      <button
                        key={index}
                        onClick={() => onAnswerSelect(currentQuestion.id, index)}
                        className={cn(
                          "w-full text-left p-2.5 sm:p-4 rounded-lg border transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "bg-card hover:border-primary/60"
                        )}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                          <div className={cn(
                            "w-6 h-6 sm:w-8 sm:h-8 rounded-md border flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0 mt-0.5",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {isSelected ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : String.fromCharCode(65 + index)}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <MathRenderer content={option} className="text-xs sm:text-sm break-words word-break" />
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
                    className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 flex-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground px-2 flex-shrink-0">
                    {currentIndex + 1}/{questions.length}
                  </span>

                  <Button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 flex-1"
                    size="sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:flex lg:flex-col lg:space-y-4">
            {/* Question Navigation Grid */}
            <Card className="border">
              <CardHeader className="py-2 px-3 border-b bg-muted">
                <CardTitle className="text-[10px] font-semibold text-muted-foreground">
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-6 gap-1">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = idx === currentIndex;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                          "w-full aspect-square rounded border text-[10px] font-semibold flex items-center justify-center transition-colors text-center",
                          isCurrent && "bg-primary text-primary-foreground border-primary",
                          !isCurrent && isAnswered && "bg-success/10 text-success border-success/30",
                          !isCurrent && !isAnswered && "bg-card text-muted-foreground hover:border-primary/60"
                        )}
                        title={`Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t text-[9px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" /> <span>Current</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-success/10 border border-success/30" /> <span>Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-card border" /> <span>Not done</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-sm border">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-semibold">Submit Exam?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg border bg-muted">
                  <div className="text-2xl font-bold text-success">{Object.keys(answers).length}</div>
                  <div className="text-xs text-muted-foreground">Answered</div>
                </div>
                <div className="p-3 rounded-lg border bg-muted">
                  <div className="text-2xl font-bold text-destructive">{questions.length - Object.keys(answers).length}</div>
                  <div className="text-xs text-muted-foreground">Unanswered</div>
                </div>
                <div className="p-3 rounded-lg border bg-muted">
                  <div className="text-2xl font-bold">{questions.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="flex-1 h-11">
                  Continue
                </Button>
                <Button
                  onClick={handleSubmitClick}
                  className="flex-1 h-11"
                  disabled={submitting || disableSubmit}
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Required Dialog */}
      {showUpgradeDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-sm border">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 w-fit rounded-lg border bg-muted p-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Upgrade to Submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Subscribe to submit your exam and unlock detailed results and explanations.
              </p>

              <div className="flex flex-col gap-2">
                {['Submit tests & view full results', 'Detailed answer explanations', 'Performance analytics'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="flex-1 h-11">
                  Continue
                </Button>
                <Link to="/payment" className="flex-1">
                  <Button className="w-full h-11">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
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
