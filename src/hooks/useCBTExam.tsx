import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Deterministic shuffle utilities to keep option order stable per attempt
const strHash = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a: number) => {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffledIndices = (length: number, seed: number) => {
  const indices = Array.from({ length }, (_, i) => i);
  const rand = mulberry32(seed);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};
export interface CBTQuestion {
  id: string;
  questionText: string;
  options: string[]; // Already shuffled for display
  originalIndexMap: number[]; // Maps displayed index to original DB index
  subject: string;
  displayIndex: number;
}

export interface CBTAnswers {
  [questionId: string]: number; // Store as 0-based index
}

export const useCBTExam = (attemptId: string | null) => {
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const [answers, setAnswers] = useState<CBTAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examDuration, setExamDuration] = useState<number>(180); // Default 3 hours
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch questions
  useEffect(() => {
    if (!attemptId) {
      navigate('/dashboard');
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Get attempt details
        const { data: attemptData } = await supabase
          .from('attempts')
          .select('*, exams(*)')
          .eq('id', attemptId)
          .single();

        if (!attemptData) {
          throw new Error('Attempt not found');
        }

        // Set exam duration from exam data or use proctoring data or default
        if (attemptData.exams && attemptData.exams.duration_minutes) {
          setExamDuration(attemptData.exams.duration_minutes);
        } else if (attemptData.proctoring_data) {
          const proctorData = attemptData.proctoring_data as any;
          setExamDuration(proctorData.duration_minutes || 180);
        }

        // Fetch questions using secure RPCs
        let questionsData: any[] = [];
        const proctorData = attemptData.proctoring_data as any;

        // Check if questions were pre-selected (stored in proctoring_data)
        if (proctorData?.question_ids && Array.isArray(proctorData.question_ids)) {
          // School exam or pre-selected questions - fetch specific questions
          const { data: specificQs, error: specificError } = await supabase
            .rpc('get_exam_questions_secure', { 
              exam_question_ids: proctorData.question_ids 
            });
          
          if (specificError) {
            console.error('Specific questions RPC error:', specificError);
            throw new Error(`Failed to load exam questions: ${specificError.message}`);
          }
          questionsData = specificQs || [];
        } else if (attemptData.exam_id) {
          // Standard exam - use exam blueprint (restricted to the exam body)
          const { data: examQs, error: examError } = await supabase
            .rpc('get_random_questions_for_exam', { 
              target_exam_id: attemptData.exam_id,
              target_exam_body: normalizeExamBody(proctorData?.exam_type) ?? undefined,
            });
          
          if (examError) {
            console.error('Exam RPC error:', examError);
            throw new Error(`Failed to load exam questions: ${examError.message}`);
          }
          questionsData = examQs || [];
        } else {
          // Practice mode - use selected subjects
          const subjects = attemptData.selected_subjects as any;
          const examType = proctorData?.exam_type;
          console.log('Selected subjects raw:', subjects, 'exam type:', examType);
          
          if (!subjects || (Array.isArray(subjects) && subjects.length === 0)) {
            throw new Error('No subjects selected for practice');
          }
          
          // Handle different formats: array of UUIDs or array of objects with id
          let subjectIds: string[];
          if (typeof subjects[0] === 'string') {
            subjectIds = subjects;
          } else if (subjects[0]?.id) {
            subjectIds = subjects.map((s: any) => s.id);
          } else {
            throw new Error('Invalid subjects format');
          }
          
          console.log('Calling RPC with subject_ids:', subjectIds);
          
          // For JAMB: fetch questions per subject based on subject type
          if (examType === 'jamb') {
            // Get subject names to identify English
            const { data: subjectsData } = await supabase
              .from('subjects')
              .select('id, name')
              .in('id', subjectIds);
            
            // Fetch questions for each subject with appropriate count
            const allQuestions = [];
            const allQuestionsArrays = await Promise.all(
              subjectIds.map(async (subjectId) => {
                const subjectName = subjectsData?.find(s => s.id === subjectId)?.name || '';
                const questionCount = subjectName.toLowerCase().includes('english') ? 60 : 40;
                const { data: subjectQs, error: subjectError } = await supabase
                  .rpc('get_random_questions_for_subjects', { 
                    subject_ids: [subjectId],
                    per_subject_count: questionCount
                  });
                if (subjectError) {
                  console.error('Subject RPC error:', subjectError);
                  throw new Error(`Failed to load questions for ${subjectName}`);
                }
                return subjectQs || [];
              })
            );
            questionsData = allQuestionsArrays.flat();
          } else {
            // Non-JAMB: use configured question count or default 40
            const questionCount = proctorData?.question_count_per_subject || 40;
            const { data: practiceQs, error: practiceError } = await supabase
              .rpc('get_random_questions_for_subjects', { 
                subject_ids: subjectIds,
                per_subject_count: questionCount
              });
            
            if (practiceError) {
              console.error('Practice RPC error:', practiceError);
              throw new Error(`Failed to load practice questions: ${practiceError.message}`);
            }
            questionsData = practiceQs || [];
          }
          
          console.log('Questions fetched:', questionsData.length);
        }

        if (!questionsData || questionsData.length === 0) {
          throw new Error('No questions available for this exam');
        }

        // Get subject names
        const subjectIds = [...new Set(questionsData.map(q => q.subject_id))];
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds);

        // Transform to clean format with stable shuffled options
        const attemptSeed = strHash(attemptId);
        const transformedQuestions: CBTQuestion[] = questionsData.map((q, idx) => {
          const originalOptions = Array.isArray(q.options) 
            ? q.options.map((opt: any) => String(opt)) 
            : [];
          
          // Generate deterministic shuffle for this question in this attempt
          const questionSeed = attemptSeed ^ strHash(q.id);
          const shuffleMap = shuffledIndices(originalOptions.length, questionSeed);
          
          // Shuffle options using the map
          const shuffledOptions = shuffleMap.map(origIdx => originalOptions[origIdx]);
          
          return {
            id: q.id,
            questionText: q.question_text,
            options: shuffledOptions,
            originalIndexMap: shuffleMap, // Store mapping: displayIdx -> originalIdx
            subject: subjectsData?.find(s => s.id === q.subject_id)?.name || 'Unknown',
            displayIndex: idx
          };
        });

        setQuestions(transformedQuestions);

        // Load any existing answers and map to display indices
        const { data: existingAnswers } = await supabase
          .from('attempt_answers')
          .select('question_id, answer')
          .eq('attempt_id', attemptId);

        const loadedAnswers: CBTAnswers = {};
        existingAnswers?.forEach(a => {
          const question = transformedQuestions.find(q => q.id === a.question_id);
          if (!question) return;
          
          // Parse stored answer (original index from DB)
          const originalIndex = typeof a.answer === 'number' 
            ? a.answer 
            : parseInt(String(a.answer));
          
          if (isNaN(originalIndex)) return;
          
          // Map original index to display index using reverse lookup
          const displayIndex = question.originalIndexMap.indexOf(originalIndex);
          if (displayIndex !== -1) {
            loadedAnswers[a.question_id] = displayIndex;
          }
        });
        setAnswers(loadedAnswers);

      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load exam questions',
          variant: 'destructive'
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [attemptId, navigate, toast]);

  // Select answer (stores display index, will be mapped to original on submit)
  const selectAnswer = useCallback((questionId: string, displayIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: displayIndex }));
  }, []);

  // Submit exam - optimized for speed with chunked inserts to avoid statement timeout
  const submitExam = useCallback(async (timeSpentSeconds: number) => {
    if (!attemptId || submitting) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare only answered questions to reduce writes and avoid null payloads
      const answersToSubmit = questions.flatMap((question) => {
        const displayIndex = answers[question.id];
        if (displayIndex === undefined) return [] as any[];

        const originalIndex = question.originalIndexMap[displayIndex];
        if (!Number.isInteger(originalIndex) || originalIndex < 0 || originalIndex >= question.options.length) {
          return [] as any[];
        }

        return [
          {
            attempt_id: attemptId,
            question_id: question.id,
            answer: originalIndex as any,
          },
        ];
      });

      console.log('Submitting answers:', { attemptId, totalQuestions: questions.length, answered: answersToSubmit.length });

      // Submit answers in small batches to avoid statement timeout under heavy DB load
      if (answersToSubmit.length > 0) {
        const BATCH_SIZE = 20;
        for (let i = 0; i < answersToSubmit.length; i += BATCH_SIZE) {
          const batch = answersToSubmit.slice(i, i + BATCH_SIZE);
          let retries = 0;
          let lastError: any = null;
          while (retries < 3) {
            const { error: batchError } = await supabase
              .from('attempt_answers')
              .upsert(batch, { onConflict: 'attempt_id,question_id' });
            if (!batchError) {
              lastError = null;
              break;
            }
            lastError = batchError;
            const isTimeout = batchError.message?.toLowerCase().includes('timeout') ||
                              batchError.message?.toLowerCase().includes('canceling statement') ||
                              batchError.code === '57014';
            if (!isTimeout) throw batchError;
            retries++;
            await new Promise(r => setTimeout(r, 1000 * retries));
          }
          if (lastError) throw lastError;
        }
      }

      // Update attempt status to SUBMITTED — also retry on timeout
      let statusRetries = 0;
      while (statusRetries < 3) {
        const { error: attemptError } = await supabase
          .from('attempts')
          .update({
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString()
          })
          .eq('id', attemptId);

        if (!attemptError) break;
        const isTimeout = attemptError.message?.toLowerCase().includes('timeout') ||
                          attemptError.message?.toLowerCase().includes('canceling statement') ||
                          attemptError.code === '57014';
        if (!isTimeout) throw attemptError;
        statusRetries++;
        if (statusRetries >= 3) throw attemptError;
        await new Promise(r => setTimeout(r, 1500 * statusRetries));
      }

      toast({
        title: 'Exam Submitted Successfully',
        description: 'Processing your results...'
      });

      // Navigate immediately — results page already handles loading state
      navigate(`/results?attempt=${attemptId}`);

    } catch (error: any) {
      console.error('Submission error:', error);
      
      let errorMessage = 'Failed to submit exam. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'PGRST301') {
        errorMessage = 'Session expired. Please log in again.';
      }
      
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      setSubmitting(false);
    }
  }, [attemptId, questions, answers, navigate, toast, submitting]);

  return {
    questions,
    answers,
    loading,
    submitting,
    selectAnswer,
    submitExam,
    examDuration
  };
};
