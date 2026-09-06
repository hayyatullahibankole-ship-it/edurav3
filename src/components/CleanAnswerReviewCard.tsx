import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Lightbulb } from 'lucide-react';
import { CleanQuestionReview } from '@/hooks/useCleanAnswerReview';
import { MathRenderer } from '@/components/ui/math-renderer';
import { QuestionMedia, OptionMedia } from '@/components/questions/QuestionMedia';
import { cn } from '@/lib/utils';

interface CleanAnswerReviewCardProps {
  question: CleanQuestionReview;
  index: number;
}

export const CleanAnswerReviewCard = ({ question, index }: CleanAnswerReviewCardProps) => {
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <Card 
      className="border-l-4" 
      style={{ borderLeftColor: question.isCorrect ? '#22c55e' : '#ef4444' }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Question {index + 1}
              {question.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{question.subject}</Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {Math.floor(question.timeSpentSeconds / 60)}:{(question.timeSpentSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question Text */}
        <div>
          <h4 className="font-medium mb-2">Question:</h4>
          <MathRenderer content={question.questionText} className="text-foreground" />
          <QuestionMedia media={question.media} className="mt-3" />
        </div>

        {/* Options */}
        {question.options.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Options:</h4>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => {
                const isUserAnswer = question.userAnswerIndex === optIndex;
                const isCorrectAnswer = question.correctAnswerIndex === optIndex;
                
                return (
                  <div
                    key={optIndex}
                    className={cn(
                      "p-3 rounded-lg border-2",
                      isCorrectAnswer && "border-green-500 bg-green-50",
                      isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50",
                      !isUserAnswer && !isCorrectAnswer && "border-border bg-background"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
                        isCorrectAnswer && "bg-green-500 text-white",
                        isUserAnswer && !isCorrectAnswer && "bg-red-500 text-white",
                        !isUserAnswer && !isCorrectAnswer && "bg-muted text-muted-foreground"
                      )}>
                        {optionLabels[optIndex]}
                      </div>
                      <div className="flex-1">
                        <MathRenderer content={option} />
                        <div className="flex gap-2 mt-1">
                          {isUserAnswer && (
                            <Badge variant={question.isCorrect ? "default" : "destructive"} className="text-xs">
                              Your Answer
                            </Badge>
                          )}
                          {isCorrectAnswer && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show unanswered state */}
        {question.userAnswerIndex === null && (
          <div className="p-3 rounded-lg border-2 border-orange-200 bg-orange-50">
            <p className="text-orange-800 text-sm">
              ⚠️ This question was not answered
            </p>
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Explanation:</h4>
                <MathRenderer content={question.explanation} className="text-blue-800 text-sm" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
