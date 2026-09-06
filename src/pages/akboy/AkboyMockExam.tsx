import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { normalizeOptionMedia } from '@/lib/questionMedia';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MockCBTInterface } from "@/components/MockCBTInterface";
import { MockBrandBanner } from "@/components/MockBrandBanner";
import { CBTQuestion, CBTAnswers } from "@/hooks/useCBTExam";
import { ExamNotYetAvailableModal } from "@/components/ExamNotYetAvailableModal";
import { Button } from "@/components/ui/button";

export default function AkboyMockExam() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAkboy } = useDomainDetection();
  const basePath = isAkboy ? "" : "/akboy";
  const regNumber = searchParams.get("reg");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const [answers, setAnswers] = useState<CBTAnswers>({});
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [rawQuestions, setRawQuestions] = useState<any[]>([]);
  const [examDuration, setExamDuration] = useState(120);
  const [showNotYetAvailableModal, setShowNotYetAvailableModal] = useState(false);
  const [notYetAvailableExam, setNotYetAvailableExam] = useState<{ title: string; scheduledDate: Date } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (!regNumber) {
      navigate(`${basePath}/mock-login`);
      return;
    }
    loadExam();
  }, [regNumber]);

  const loadExam = async () => {
    try {
      const { data: loginResult, error: loginError } = await supabase.rpc("validate_mock_exam_login" as any, {
        p_registration_number: regNumber,
      });

      if (loginError) throw loginError;
      const login = loginResult as any;

      if (!login.valid) {
        toast.error(login.message);
        navigate(`${basePath}/mock-login`);
        return;
      }

      setRegistrationData(login);

      // Check if exam is scheduled for a future date/time
      if (login.batch_id) {
        const { data: batch, error: batchError } = await supabase
          .from("mock_batches" as any)
          .select("exam_date, title")
          .eq("id", login.batch_id)
          .single();
        
        if (!batchError && batch) {
          const batchData = batch as any;
          if (batchData?.exam_date) {
            const scheduledExamTime = new Date(batchData.exam_date);
            const currentTime = new Date();
            
            if (currentTime < scheduledExamTime) {
              setNotYetAvailableExam({
                title: batchData.title || "Mock Examination",
                scheduledDate: scheduledExamTime
              });
              setShowNotYetAvailableModal(true);
              setLoading(false);
              return;
            }
          }
        }
      }

      const { data: durSetting } = await supabase
        .from("mock_settings" as any)
        .select("value")
        .eq("key", "exam_duration_minutes")
        .single();
      
      if (durSetting) {
        const dur = typeof (durSetting as any).value === 'string' 
          ? parseInt((durSetting as any).value) 
          : (durSetting as any).value;
        if (dur && !isNaN(dur)) setExamDuration(dur);
      }

      const subjects = login.subjects || [];
      const allRawQuestions: any[] = [];

      for (const subject of subjects) {
        const questionCount = subject.questions || (subject.name === 'English Language' ? 60 : 40);
        
        try {
          const { data: rpcQuestions, error: rpcError } = await supabase.rpc(
            "get_random_questions_for_subjects" as any,
            { subject_ids: [subject.id], per_subject_count: questionCount }
          );

          if (!rpcError && rpcQuestions && (rpcQuestions as any[]).length > 0) {
            const qs = (rpcQuestions as any[]).map((q: any) => ({ ...q, subject_name: subject.name }));
            allRawQuestions.push(...qs);
            continue;
          }
        } catch (e) {
          console.warn("RPC failed for subject", subject.name, e);
        }

        const { data: directQuestions } = await supabase
          .from("questions")
          .select("id, question_text, options, correct_answer, explanation, subject_id, media_urls, option_media")
          .eq("subject_id", subject.id)
          .eq("is_active", true)
          .limit(questionCount);

        if (directQuestions) {
          const qs = directQuestions.map((q: any) => ({ ...q, subject_name: subject.name }));
          allRawQuestions.push(...qs);
        }
      }

      if (allRawQuestions.length === 0) {
        toast.error("No questions available. Please contact the administrator.");
        navigate(`${basePath}/mock-login`);
        return;
      }

      setRawQuestions(allRawQuestions);

      // Convert to CBTQuestion format
      const cbtQuestions: CBTQuestion[] = allRawQuestions.map((q, index) => {
        const options = Array.isArray(q.options) ? q.options : 
          typeof q.options === 'object' ? Object.values(q.options) : [];
        const optionStrings = options.map((o: any) => typeof o === 'string' ? o : String(o));
        const originalIndexMap = optionStrings.map((_: any, i: number) => i);

        return {
          id: q.id,
          questionText: q.question_text,
          options: optionStrings,
          originalIndexMap,
          subject: q.subject_name || 'Unknown',
          displayIndex: index + 1,
          media: q.media_urls ?? null,
          optionMedia: normalizeOptionMedia(q.option_media),
        };
      });

      setQuestions(cbtQuestions);

      // Create an attempt record
      try {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc("create_mock_exam_attempt" as any, {
            p_exam_id: (login?.mock_exam_id ?? null) as any,
            p_registration_id: login.registration_id,
            p_registration_number: regNumber,
            p_exam_duration_minutes: examDuration,
            p_exam_title: "AKBOY JAMB Mock Examination"
          });

        if (rpcError) {
          console.error("RPC call failed:", rpcError);
          toast.error("Failed to initialize exam: " + rpcError.message);
          return;
        }

        const rpcData = rpcResult as any;
        if (rpcData?.status !== 'success') {
          toast.error("Failed to initialize exam: " + (rpcData?.message || "Unknown error"));
          return;
        }

        const newAttemptId = rpcData?.attempt_id;
        if (!newAttemptId) {
          toast.error("Failed to initialize exam session");
          return;
        }

        setAttemptId(newAttemptId);
      } catch (attemptCreationError: any) {
        console.error("Attempt creation error:", attemptCreationError);
        toast.error("Failed to create exam attempt: " + attemptCreationError.message);
        return;
      }

      // For virtual registrations, call server RPC to verify + mark started atomically
      if (login.mode === 'virtual') {
        try {
          const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_virtual_student' as any, {
            p_reg_number: regNumber,
            p_attempt_id: (attemptId ?? null),
          });

          if (verifyError) {
            console.error('verify_virtual_student RPC error', verifyError);
            toast.error('Failed to verify virtual exam registration. Please contact support.');
            return;
          }

          const vr = verifyResult as any;
          if (!vr || !vr.ok) {
            toast.error('Verification failed: ' + (vr?.error || 'unknown'));
            return;
          }
        } catch (e) {
          console.error('Verification call failed', e);
          toast.error('Failed to verify virtual registration.');
          return;
        }
      } else {
        // Physical registrations: mark started locally as before
        await supabase
          .from("mock_registrations" as any)
          .update({ exam_status: "started", exam_started_at: new Date().toISOString() } as any)
          .eq("id", login.registration_id);
      }

    } catch (error: any) {
      console.error("Error loading exam:", error);
      toast.error("Failed to load exam");
      navigate(`${basePath}/mock-login`);
    } finally {
      setLoading(false);
    }
  };

  // Persist answers to localStorage on every change
  useEffect(() => {
    if (regNumber && Object.keys(answers).length > 0) {
      localStorage.setItem(`mock_exam_answers_${regNumber}`, JSON.stringify(answers));
    }
  }, [answers, regNumber]);

  // Restore answers from localStorage on mount
  useEffect(() => {
    if (regNumber) {
      const saved = localStorage.getItem(`mock_exam_answers_${regNumber}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Object.keys(parsed).length > 0) {
            setAnswers(parsed);
          }
        } catch {}
      }
    }
  }, [regNumber]);

  const selectAnswer = useCallback((questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const submitExam = useCallback(async () => {
    if (submitting) return;
    
    if (!attemptId) {
      toast.error("Exam session not initialized.");
      return;
    }
    
    if (!regNumber) {
      toast.error("Registration information missing.");
      return;
    }
    
    setSubmitting(true);

    const attemptAnswers = rawQuestions.map((q) => {
      const optionIndex = answers[q.id];
      let selectedAnswer: string | null = null;

      if (optionIndex !== undefined) {
        const cbtQ = questions.find(cq => cq.id === q.id);
        if (cbtQ) {
          const originalIndex = cbtQ.originalIndexMap[optionIndex];
          selectedAnswer = String.fromCharCode(65 + originalIndex);
        }
      }

      return {
        question_id: q.id,
        selected_answer: selectedAnswer,
      };
    });

    // Save submission payload locally for offline resilience
    const submissionPayload = {
      attemptId,
      regNumber,
      attemptAnswers,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`mock_exam_pending_${regNumber}`, JSON.stringify(submissionPayload));

    const trySubmit = async (): Promise<boolean> => {
      try {
        const { data: answerResult, error: answersError } = await supabase
          .rpc("submit_mock_exam_answers" as any, {
            p_attempt_id: attemptId,
            p_answers: attemptAnswers
          });

        if (answersError) {
          console.error("Answer submission error:", answersError);
          return false;
        }

        const answerData = answerResult as any;
        if (answerData?.status !== 'success') {
          console.error("Answer submission failed:", answerData?.message);
          return false;
        }

        const { data: submitResult, error: statusError } = await supabase
          .rpc("submit_mock_exam" as any, {
            p_attempt_id: attemptId
          });

        if (statusError) {
          console.error("Exam finalize error:", statusError);
          return false;
        }

        const submitData = submitResult as any;
        if (submitData?.status !== 'success') {
          console.error("Exam finalize failed:", submitData?.message);
          return false;
        }

        // Clear local storage on success
        localStorage.removeItem(`mock_exam_answers_${regNumber}`);
        localStorage.removeItem(`mock_exam_pending_${regNumber}`);
        return true;
      } catch (err) {
        console.error("Submit network error:", err);
        return false;
      }
    };

    // Retry up to 3 times with backoff
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      success = await trySubmit();
      if (success) break;
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }

    if (success) {
      toast.success("Exam submitted successfully!");
      navigate(`${basePath}/mock-submitted?reg=${encodeURIComponent(regNumber)}`);
    } else {
      // If all retries fail, wait for reconnection
      toast.info("Your answers are saved locally. They will be submitted once your connection is restored.", { duration: 10000 });
      
      const retryOnReconnect = () => {
        const retrySubmit = async () => {
          const retrySuccess = await trySubmit();
          if (retrySuccess) {
            toast.success("Exam submitted successfully after reconnection!");
            navigate(`${basePath}/mock-submitted?reg=${encodeURIComponent(regNumber)}`);
          } else {
            // Try again in 10 seconds
            setTimeout(retrySubmit, 10000);
          }
        };
        retrySubmit();
        window.removeEventListener("online", retryOnReconnect);
      };

      if (navigator.onLine) {
        // Online but server issues - retry in 10s
        setTimeout(async () => {
          const retrySuccess = await trySubmit();
          if (retrySuccess) {
            toast.success("Exam submitted successfully!");
            navigate(`${basePath}/mock-submitted?reg=${encodeURIComponent(regNumber)}`);
          }
        }, 10000);
      } else {
        window.addEventListener("online", retryOnReconnect);
      }
      
      setSubmitting(false);
    }
  }, [attemptId, answers, rawQuestions, questions, navigate, basePath, regNumber, submitting]);

  if (!regNumber) return null;

  if (showNotYetAvailableModal && notYetAvailableExam) {
    return (
      <ExamNotYetAvailableModal
        isOpen={showNotYetAvailableModal}
        examTitle={notYetAvailableExam.title}
        scheduledDate={notYetAvailableExam.scheduledDate}
        onClose={() => navigate(`${basePath}/mock-login`)}
      />
    );
  }

  const reprintButton = (
    <div className="absolute top-4 right-4 z-10">
      <Button variant="outline" size="sm" asChild>
        <Link to={`${basePath}/reprint-admit-slip`}>Reprint Admit Slip</Link>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        {reprintButton}
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-lg">Loading mock exam...</p>
          <p className="text-sm text-muted-foreground">Preparing your 180 questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {reprintButton}
      <MockBrandBanner />
      <MockCBTInterface
        questions={questions}
        answers={answers}
        onAnswerSelect={selectAnswer}
        onSubmit={submitExam}
        duration={examDuration}
        examTitle="AKBOY JAMB Mock Examination"
        submitting={submitting}
        disableSubmit={!attemptId || loading}
      />
    </div>
  );
}
