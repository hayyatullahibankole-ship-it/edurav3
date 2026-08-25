import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { CleanCBTInterface } from '@/components/CleanCBTInterface';

interface Question {
  id: string;
  question_text: string;
  options: any;
  type: string;
}

export default function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('Challenge');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId || !userProfile) return;

    const fetchChallengeAndCreateAttempt = async () => {
      try {
        // Check if user has already attempted this challenge
        const { data: existingAttempt, error: attemptCheckError } = await supabase
          .from('challenge_attempts')
          .select('id')
          .eq('challenge_id', challengeId)
          .eq('user_id', userProfile.id)
          .maybeSingle();

        if (attemptCheckError) throw attemptCheckError;

        if (existingAttempt) {
          toast.error('You have already attempted this challenge');
          navigate('/challenge-arena');
          return;
        }

        // Fetch challenge details
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', challengeId)
          .single();

        if (challengeError) throw challengeError;
        if (!challengeData) {
          toast.error('Challenge not found');
          navigate('/challenge-arena');
          return;
        }

        setExamTitle(challengeData.title);
        setDuration(challengeData.duration_minutes * 60);

        // Parse subject_ids from JSON string to array
        let subjectIds: string[] = [];
        try {
          subjectIds = typeof challengeData.subject_ids === 'string' 
            ? JSON.parse(challengeData.subject_ids)
            : challengeData.subject_ids;
        } catch (e) {
          console.error('Error parsing subject_ids:', e);
          toast.error('Invalid challenge configuration');
          navigate('/challenge-arena');
          return;
        }

        if (!subjectIds || subjectIds.length === 0) {
          // Fallback: use all subjects that have active questions
          const { data: subjectCounts, error: subjectsError } = await supabase.rpc('get_subject_question_counts');
          if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
          }
          subjectIds = (subjectCounts || [])
            .map((s: any) => s.subject_id)
            .filter((id: string | null) => Boolean(id));

          if (!subjectIds || subjectIds.length === 0) {
            toast.error('No subjects available for this challenge');
            navigate('/challenge-arena');
            return;
          }
        }

        // Filter subjects by course category to ensure only category-specific subjects are used
        const courseCategory = challengeData.course_category || 'science';
        const { data: categorySubjects, error: categoryError } = await supabase
          .from('subjects')
          .select('id')
          .eq('course_category', courseCategory)
          .eq('is_active', true);
        
        if (categoryError) throw categoryError;
        
        const categorizedSubjectIds = (categorySubjects || []).map(s => s.id);
        
        // Only use subjects that match the challenge's course category
        const filteredSubjectIds = subjectIds.filter(id => categorizedSubjectIds.includes(id));
        
        if (filteredSubjectIds.length === 0) {
          toast.error(`No ${courseCategory} subjects configured for this challenge`);
          navigate('/challenge-arena');
          return;
        }

        // Fetch random questions securely via RPC (RLS-safe)
        const questionsPerSubject = Math.ceil(challengeData.question_count / filteredSubjectIds.length);

        const { data: rpcQuestions, error: rpcError } = await supabase
          .rpc('get_random_questions_for_subjects', {
            subject_ids: filteredSubjectIds,
            per_subject_count: questionsPerSubject,
          });

        if (rpcError) throw rpcError;

        const allQuestions: Question[] = (rpcQuestions || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          options: q.options,
          type: q.type,
        }));
        if (allQuestions.length === 0) {
          toast.error('No questions available for this challenge');
          navigate('/challenge-arena');
          return;
        }

        setQuestions(allQuestions.slice(0, challengeData.question_count));

        // Create an attempt for this challenge
        const { data: attemptData, error: attemptError } = await supabase
          .from('attempts')
          .insert([{
            user_id: userProfile.id,
            exam_id: null,
            status: 'IN_PROGRESS',
            started_at: new Date().toISOString(),
            time_remaining_seconds: challengeData.duration_minutes * 60,
            proctoring_data: {
              challenge_id: challengeId,
              challenge_title: challengeData.title
            }
          }])
          .select()
          .single();

        if (attemptError) throw attemptError;
        setAttemptId(attemptData.id);

      } catch (error) {
        console.error('Error setting up challenge:', error);
        toast.error('Failed to start challenge');
        navigate('/challenge-arena');
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeAndCreateAttempt();
  }, [challengeId, userProfile, navigate]);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    try {
      // Save all answers
      const answerRecords = Object.entries(answers).map(([questionId, answerIndex]) => ({
        attempt_id: attemptId,
        question_id: questionId,
        answer: answerIndex,
        answered_at: new Date().toISOString()
      }));

      if (answerRecords.length > 0) {
        await supabase.from('attempt_answers').insert(answerRecords);
      }

      // Update attempt status
      await supabase
        .from('attempts')
        .update({ status: 'SUBMITTED', submitted_at: new Date().toISOString() })
        .eq('id', attemptId);

      // Create challenge attempt record
      const correctCount = 0; // Calculate from validation
      await supabase.from('challenge_attempts').insert([{
        challenge_id: challengeId!,
        user_id: userProfile!.id,
        score: correctCount,
        correct_answers: correctCount,
        total_questions: questions.length,
        time_taken_seconds: duration,
        points_earned: 0
      }]);

      toast.success('Challenge completed!');
      navigate(`/challenge-results/${attemptId}`);
    } catch (error) {
      console.error('Error submitting challenge:', error);
      toast.error('Failed to submit challenge');
    }
  };

  if (loading || !attemptId || questions.length === 0) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <CleanCBTInterface
        questions={questions.map((q, idx) => ({
          id: q.id,
          questionText: q.question_text,
          options: q.options,
          type: q.type,
          originalIndexMap: [idx],
          subject: '',
          displayIndex: idx
        }))}
        answers={answers}
        onAnswerSelect={handleAnswerSelect}
        onSubmit={handleSubmit}
        duration={duration}
        examTitle={examTitle}
      />
    </Layout>
  );
}
