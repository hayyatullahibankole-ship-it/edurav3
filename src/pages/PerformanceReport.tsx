import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrintableReport } from '@/components/reports/PrintableReport';
import { FileText, TrendingUp, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PerformanceReport = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (userProfile?.id) {
      fetchReportData();
    }
  }, [userProfile]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch attempts and results
      const { data: attempts } = await supabase.rpc('get_student_exam_progress');
      
      const userAttempts = attempts?.filter(
        a => a.user_id === userProfile?.id && a.status === 'SUBMITTED'
      ) || [];

      // Fetch results for attempts
      const attemptsWithResults = await Promise.all(
        userAttempts.map(async (attempt) => {
          const { data: result } = await supabase
            .from('results')
            .select('*')
            .eq('attempt_id', attempt.id)
            .maybeSingle();
          
          return { ...attempt, result };
        })
      );

      const resultsWithScores = attemptsWithResults.filter(a => a.result);
      
      // Calculate stats
      const totalTests = resultsWithScores.length;
      const averageScore = totalTests > 0
        ? Math.round(resultsWithScores.reduce((sum, a) => sum + (a.result?.percentage || 0), 0) / totalTests)
        : 0;
      
      const totalHours = Math.round(
        resultsWithScores.reduce((sum, a) => sum + (a.result?.time_taken_minutes || 0), 0) / 60
      );

      // Subject breakdown
      const subjectScores: { [key: string]: number[] } = {};
      resultsWithScores.forEach(attempt => {
        const breakdown = attempt.result?.subject_breakdown || {};
        Object.entries(breakdown).forEach(([subject, data]: [string, any]) => {
          if (!subjectScores[subject]) subjectScores[subject] = [];
          const percentage = typeof data === 'object' ? (data.percentage || data.score || 0) : data;
          subjectScores[subject].push(percentage);
        });
      });

      const subjectBreakdown = Object.entries(subjectScores).map(([subject, scores]) => ({
        subject,
        score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      }));

      // Recent tests
      const recentTests = resultsWithScores.slice(0, 5).map(attempt => {
        const proctoringData = attempt.proctoring_data as any || {};
        return {
          subject: proctoringData.title || 'Practice Test',
          score: Math.round(attempt.result?.percentage || 0),
          date: new Date(attempt.submitted_at).toLocaleDateString(),
          duration: `${Math.floor((attempt.result?.time_taken_minutes || 0) / 60)}h ${(attempt.result?.time_taken_minutes || 0) % 60}m`,
        };
      });

      // Get rank
      let rank = 0;
      let totalStudents = 0;
      if (resultsWithScores[0]?.id) {
        try {
          const { data: rankData } = await supabase.functions.invoke('get-rank', {
            body: { attemptId: resultsWithScores[0].id },
          });
          if (rankData) {
            rank = rankData.rank || 0;
            totalStudents = rankData.total || 0;
          }
        } catch (e) {
          console.error('Failed to fetch rank', e);
        }
      }

      setReportData({
        userName: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Student',
        totalTests,
        averageScore,
        totalHours,
        rank,
        totalStudents,
        subjectBreakdown,
        recentTests,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-muted-foreground py-12">Loading report...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
                <p className="text-muted-foreground mb-4">
                  Complete some tests to generate your performance report
                </p>
                <Button onClick={() => window.location.href = '/demo-test'}>
                  Start Practice Test
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!showReport) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Performance Report Preview</CardTitle>
                <CardDescription>
                  Review your academic performance summary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                    <p className="text-3xl font-bold text-primary">{reportData.totalTests}</p>
                  </div>
                  <div className="p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-3xl font-bold text-success">{reportData.averageScore}%</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button size="lg" onClick={() => setShowReport(true)} className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Report
                  </Button>
                </div>

                <div className="p-4 bg-info/10 rounded-lg text-sm">
                  <p className="font-semibold mb-2">📊 Your report includes:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• Complete performance overview</li>
                    <li>• Subject-wise breakdown</li>
                    <li>• Recent test results</li>
                    <li>• Ranking and achievements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowReport(false)}
            className="mb-4"
          >
            ← Back to Preview
          </Button>
          
          <PrintableReport data={reportData} />
        </div>
      </div>
    </Layout>
  );
};

export default PerformanceReport;
