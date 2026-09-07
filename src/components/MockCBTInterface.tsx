import React from 'react';
import { CBTQuestion, CBTAnswers } from '@/hooks/useCBTExam';
import { ExamConsole } from '@/components/cbt/ExamConsole';

interface MockCBTInterfaceProps {
  questions: CBTQuestion[];
  answers: CBTAnswers;
  onAnswerSelect: (questionId: string, optionIndex: number) => void;
  onSubmit: (timeSpent?: number) => void | Promise<void>;
  duration: number;
  examTitle?: string;
  submitting?: boolean;
  disableSubmit?: boolean;
  attemptId?: string | null;
  candidateName?: string | null;
  candidatePhotoUrl?: string | null;
  registrationNumber?: string | null;
}

export const MockCBTInterface: React.FC<MockCBTInterfaceProps> = ({
  questions,
  answers,
  onAnswerSelect,
  onSubmit,
  duration,
  examTitle = 'AKBOY JAMB Mock Examination',
  submitting = false,
  disableSubmit = false,
  attemptId = null,
  candidateName,
  candidatePhotoUrl,
  registrationNumber,
}) => (
  <ExamConsole
    questions={questions}
    answers={answers}
    onAnswerSelect={onAnswerSelect}
    onSubmit={timeSpent => onSubmit(timeSpent)}
    duration={duration}
    examTitle={examTitle}
    submitting={submitting}
    disableSubmit={disableSubmit}
    attemptId={attemptId}
    proctoring="required"
    candidate={{
      name: candidateName || 'Candidate',
      photoUrl: candidatePhotoUrl || null,
      regNumber: registrationNumber || null,
    }}
  />
);

export default MockCBTInterface;
