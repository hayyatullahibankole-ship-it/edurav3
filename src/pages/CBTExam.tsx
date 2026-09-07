import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCBTExam } from '@/hooks/useCBTExam';
import { CleanCBTInterface } from '@/components/CleanCBTInterface';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CBTExam = () => {
  const [searchParams] = useSearchParams();
  const { attemptId: pathAttemptId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [resolvedAttemptId, setResolvedAttemptId] = useState<string | null>(null);
  const [attemptCreateError, setAttemptCreateError] = useState(false);
  
  // Support both query param (?attempt=...) and path param (/exam/:attemptId)
  // Also support exam ID (?exam=...) which will auto-create an attempt
  const attemptIdParam = pathAttemptId || searchParams.get('attempt');
  const examIdParam = searchParams.get('exam');

  // If we have a direct exam ID, create an attempt for it
  useEffect(() => {
    if (!examIdParam || !userProfile) return;

    const createAttemptForExam = async () => {
      try {
        // Check if exam exists and get its details
        const { data: exam, error: examError } = await supabase
          .from('exams')
          .select('id, title, duration_minutes')
          .eq('id', examIdParam)
          .single();

        if (examError || !exam) {
          toast.error('Exam not found');
          setAttemptCreateError(true);
          setTimeout(() => navigate('/dashboard'), 1000);
          return;
        }

        // Create a new attempt
        const { data: attempt, error: attemptError } = await supabase
          .from('attempts')
          .insert({
            user_id: userProfile.id,
            exam_id: examIdParam,
            status: 'STARTED',
            time_remaining_seconds: (exam.duration_minutes || 180) * 60,
            proctoring_data: {
              title: exam.title || 'Practice Exam',
              duration_minutes: exam.duration_minutes || 180
            }
          })
          .select()
          .single();

        if (attemptError || !attempt) {
          toast.error('Failed to start exam');
          setAttemptCreateError(true);
          setTimeout(() => navigate('/dashboard'), 1000);
          return;
        }

        setResolvedAttemptId(attempt.id);
      } catch (error) {
        console.error('Error creating attempt:', error);
        toast.error('Failed to start exam');
        setAttemptCreateError(true);
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    };

    createAttemptForExam();
  }, [examIdParam, userProfile, navigate]);

  // Use the resolved attempt ID if we created one, otherwise use the provided one
  const attemptId = resolvedAttemptId || attemptIdParam;

  const {
    questions,
    answers,
    loading,
    submitting,
    selectAnswer,
    submitExam,
    examDuration
  } = useCBTExam(attemptId);

  if (!attemptId) {
    navigate('/dashboard');
    return null;
  }

  if (attemptCreateError) {
    return null; // Error already handled and navigation triggered
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
          <p className="text-muted-foreground mb-6">
            There are no questions available for this exam. Please contact support or try again.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <CleanCBTInterface
      questions={questions}
      answers={answers}
      onAnswerSelect={selectAnswer}
      onSubmit={submitExam}
      duration={examDuration}
      examTitle="CBT Practice Exam"
      submitting={submitting}
      attemptId={attemptId}
    />
  );

};

export default CBTExam;
