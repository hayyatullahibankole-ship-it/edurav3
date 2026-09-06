import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeOptionMedia } from '@/lib/questionMedia';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Same shuffle utilities as in useCBTExam for consistency
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

export interface CleanQuestionReview {
  id: string;
  questionText: string;
  options: string[]; // Shuffled same as during exam
  userAnswerIndex: number | null; // Display index
  correctAnswerIndex: number; // Display index
  isCorrect: boolean;
  explanation: string;
  subject: string;
  timeSpentSeconds: number;
  media?: any;
  optionMedia?: (any | null)[];
}

export const useCleanAnswerReview = (attemptId: string | null) => {
  const [questions, setQuestions] = useState<CleanQuestionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!attemptId) {
      navigate('/dashboard');
      return;
    }

    const fetchReview = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Get user internal ID
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (!userData) {
          toast({
            title: 'Error',
            description: 'User not found',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }

        // Verify attempt ownership
        const { data: attemptData } = await supabase
          .from('attempts')
          .select('user_id, status')
          .eq('id', attemptId)
          .single();

        if (!attemptData || attemptData.user_id !== userData.id) {
          toast({
            title: 'Error',
            description: 'Attempt not found or access denied',
            variant: 'destructive'
          });
          navigate('/dashboard');
          return;
        }

        // Wait for attempt to be SUBMITTED (short polling to avoid race conditions)
        let status = attemptData.status;
        let tries = 0;
        while (status !== 'SUBMITTED' && tries < 20) {
          await new Promise((res) => setTimeout(res, 1000));
          const { data: latestAttempt, error: latestErr } = await supabase
            .from('attempts')
            .select('status')
            .eq('id', attemptId)
            .single();
          if (latestErr) break;
          status = latestAttempt?.status;
          tries++;
        }

        if (status !== 'SUBMITTED') {
          toast({
            title: 'Preparing review…',
            description: 'Your results are being finalized. Please try again shortly.',
            variant: 'default'
          });
          setLoading(false);
          return;
        }

        // Use secure review RPC that returns everything we need
        console.log('Fetching review for attempt:', attemptId);
        
        const { data: reviewData, error: reviewError } = await supabase
          .rpc('get_review_questions_for_attempt', { 
            attempt_uuid: attemptId 
          });

        if (reviewError) {
          console.error('Review RPC error:', reviewError);
          throw new Error(`Failed to load review: ${reviewError.message}`);
        }

        if (!reviewData || reviewData.length === 0) {
          console.warn('No review data returned');
          throw new Error('No review data available for this attempt');
        }
        
        console.log('Review data fetched:', reviewData.length, 'questions');

        // Apply same deterministic shuffle as during exam
        const attemptSeed = strHash(attemptId);
        
        const reviewQuestions: CleanQuestionReview[] = reviewData.map(item => {
          // Normalize options from array/object to a simple string[]
          const normalizeOptions = (opts: any): string[] => {
            try {
              if (Array.isArray(opts)) {
                return opts.map((o: any) => {
                  if (typeof o === 'string') return o;
                  if (o == null) return '';
                  if (typeof o === 'number' || typeof o === 'boolean') return String(o);
                  if (typeof o === 'object') {
                    // Try common shapes
                    const cand = (o.text ?? o.label ?? o.value ?? Object.values(o)[0]);
                    return cand != null ? String(cand) : '';
                  }
                  return String(o);
                });
              }
              if (opts && typeof opts === 'object') {
                // Sort A..Z if letter keys, else by key name
                const keys = Object.keys(opts).sort((a, b) => a.localeCompare(b));
                return keys.map(k => String((opts as any)[k] ?? ''));
              }
              return [];
            } catch {
              return [];
            }
          };

          const originalOptions = normalizeOptions(item.options);
          
          // Generate same shuffle as during exam
          const questionSeed = attemptSeed ^ strHash(item.id);
          const shuffleMap = shuffledIndices(originalOptions.length, questionSeed);
          
          // Shuffle options
          const shuffledOptions = originalOptions.length > 0
            ? shuffleMap.map(origIdx => originalOptions[origIdx])
            : [];
          
          // Map indices: stored original indices -> display indices
          const userDisplayIndex = (item.user_answer_index !== null && originalOptions.length > 0)
            ? shuffleMap.indexOf(item.user_answer_index)
            : null;
          
          const correctDisplayIndexRaw = (originalOptions.length > 0)
            ? shuffleMap.indexOf(item.correct_answer_index)
            : -1;

          return {
            id: item.id,
            questionText: item.question_text,
            options: shuffledOptions,
            userAnswerIndex: userDisplayIndex,
            correctAnswerIndex: correctDisplayIndexRaw !== -1 ? correctDisplayIndexRaw : 0,
            isCorrect: !!item.is_correct,
            explanation: item.explanation || 'No explanation available',
            subject: item.subject_name || 'Unknown',
            timeSpentSeconds: item.time_spent_seconds || 0,
            media: (item as any).media_urls ?? null,
            optionMedia: (() => {
              const om = normalizeOptionMedia((item as any).option_media);
              return om.length ? shuffleMap.map(origIdx => om[origIdx] ?? null) : [];
            })()
          };
        });

        setQuestions(reviewQuestions);

      } catch (error) {
        console.error('Error fetching review:', error);
        toast({
          title: 'Error',
          description: 'Failed to load answer review',
          variant: 'destructive'
        });
        // stay on page to allow retry or polling
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [attemptId, navigate, toast]);

  return { questions, loading };
};
