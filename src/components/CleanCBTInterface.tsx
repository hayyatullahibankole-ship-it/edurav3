import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CBTQuestion, CBTAnswers } from '@/hooks/useCBTExam';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { ExamConsole } from '@/components/cbt/ExamConsole';

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
  attemptId?: string | null;
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
  disableSubmit = false,
  attemptId = null,
}) => {
  const { canAccessPremium, loading: subscriptionLoading } = useSubscription();
  const { userProfile } = useAuth();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const profile = userProfile as any;
  const candidateName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.full_name ||
    profile?.email ||
    'Candidate';

  return (
    <>
      <ExamConsole
        questions={questions}
        answers={answers}
        onAnswerSelect={onAnswerSelect}
        onSubmit={onSubmit}
        duration={duration}
        examTitle={examTitle}
        submitting={submitting}
        disableSubmit={disableSubmit}
        attemptId={attemptId}
        proctoring="optional"
        candidate={{
          name: candidateName,
          photoUrl: profile?.profile_image_url || profile?.avatar_url || null,
          regNumber: profile?.registration_number || null,
        }}
        canSubmit={() => bypassSubscription || subscriptionLoading || canAccessPremium}
        onSubmitBlocked={() => setShowUpgradeDialog(true)}
      />

      {showUpgradeDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                {['Submit tests & view full results', 'Detailed answer explanations', 'Performance analytics'].map(
                  item => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ),
                )}
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
    </>
  );
};

export default CleanCBTInterface;
