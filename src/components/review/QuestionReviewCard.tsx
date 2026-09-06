import { QuestionMedia } from '@/components/questions/QuestionMedia';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Lightbulb } from 'lucide-react';
import { QuestionReview } from '@/hooks/useAnswerReview';
import { AnswerOption } from './AnswerOption';

interface QuestionReviewCardProps {
  question: QuestionReview;
  index: number;
}

export const QuestionReviewCard = ({ question, index }: QuestionReviewCardProps) => {
  const getDifficultyBadge = (level: number) => {
    switch (level) {
      case 1: return <Badge variant="secondary">Easy</Badge>;
      case 2: return <Badge variant="outline">Medium</Badge>;
      case 3: return <Badge variant="destructive">Hard</Badge>;
      default: return <Badge variant="secondary">Easy</Badge>;
    }
  };

  const getOptionText = (opt: any): string => {
    if (opt == null) return '';
    if (typeof opt === 'string') return opt;
    if (typeof opt === 'object') {
      // Common shapes: { text }, { label }, { option }, { value }
      const candidate = (opt as any).text ?? (opt as any).label ?? (opt as any).option ?? (opt as any).value;
      if (typeof candidate === 'string') return candidate;
      if (candidate != null) return String(candidate);
      try { return JSON.stringify(opt); } catch { return String(opt); }
    }
    return String(opt);
  };

  return (
    <Card 
      className="border-l-4" 
      style={{ borderLeftColor: question.is_correct ? '#22c55e' : '#ef4444' }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Question {index + 1}
              {question.is_correct ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getDifficultyBadge(question.difficulty_level)}
              <Badge variant="outline">{question.subject}</Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {Math.floor(question.time_spent_seconds / 60)}:{(question.time_spent_seconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Question:</h4>
          <p className="text-foreground">{question.question_text}</p>
          <QuestionMedia media={(question as any).media_urls} className="mt-3" />
        </div>

        {question.options && question.options.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Options:</h4>
            <div className="space-y-2">
              {question.options.map((option: any, optIndex: number) => (
                <AnswerOption
                  key={optIndex}
                  option={getOptionText(option)}
                  optIndex={optIndex}
                  userAnswer={question.user_answer}
                  correctAnswer={question.correct_answer}
                  isCorrect={question.is_correct}
                  totalOptions={question.options.length}
                />
              ))}
            </div>
          </div>
        )}

        {/* Show answers for non-MCQ questions */}
        {(!question.options || question.options.length === 0) && (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Your Answer:</h4>
              <div className={`p-3 rounded border ${
                question.is_correct 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {question.user_answer || 'No answer provided'}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Correct Answer:</h4>
              {(typeof question.correct_answer === 'string' || (question.correct_answer && typeof question.correct_answer === 'object')) && (
                <div className="p-3 rounded border bg-green-50 border-green-200 text-green-700">
                  {typeof question.correct_answer === 'string' 
                    ? question.correct_answer 
                    : JSON.stringify(question.correct_answer)}
                </div>
              )}
            </div>
          </div>
        )}

        {question.explanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Explanation:</h4>
                <p className="text-blue-800 text-sm">{question.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
