import { useEffect, useState } from 'react';

import { SideSwitcher } from '@/components/edura/SideSwitcher';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Clock,
  ChevronRight,
  Flame,
  LogOut,
  FileText,
  TrendingUp,
  Calculator,
  Wallet,
  Beaker,
  Microscope,
  Globe,
  Search,
  Sparkles,
  Library,
  Award,
  GraduationCap,
  Calendar,
  Video,
  Gift,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import MobileNav from '@/components/MobileNav';
import { useSubscription } from '@/hooks/useSubscription';
import { playTapSound } from '@/utils/sounds';
import ProfileSettings from '@/components/ProfileSettings';
import WhatsAppButton from '@/components/WhatsAppButton';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import NotificationBell from '@/components/NotificationBell';
import { MobilePromoCodeActivation } from '@/components/dashboard/MobilePromoCodeActivation';
import { useInstalledApp } from '@/hooks/useInstalledApp';
import { InstallRequiredModal } from '@/components/InstallRequiredModal';
import eduraLogo from '@/assets/edura-logo.png';
import { DashboardThemeMenu } from '@/components/DashboardThemeMenu';

const naira = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

const MobileHome = () => {
  const { user, userProfile, signOut } = useAuth();
  const { isPremium, hasFreePromoAccess, loading: subscriptionLoading } = useSubscription();
  const { balance: walletBalance, loading: walletLoading } = useWallet();
  const { isInstalledApp } = useInstalledApp();
  //usePushNotifications();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    testsTaken: 0,
    averageScore: 0,
    studyHours: 0,
  });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [dailyGoal, setDailyGoal] = useState({ answered: 0, target: 20 });
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [blockedFeatureName, setBlockedFeatureName] = useState('');

  const hasMeaningfulPhone = Boolean(
    typeof userProfile?.phone === 'string' &&
    userProfile.phone.trim() !== '' &&
    userProfile.phone.trim() !== '+234'
  );

  const isProfileIncomplete = !userProfile?.first_name?.trim() || !userProfile?.last_name?.trim() || !hasMeaningfulPhone;

  // Features that require app installation
  const premiumFeatures = ['/study-planner', '/challenge-arena', '/performance-report', '/cbt-exam', '/practice'];
  const isMobileBrowser =
  !isInstalledApp &&
  typeof navigator !== 'undefined' &&
  typeof navigator.userAgent === 'string' &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const motivationalQuotes = [
    "Success is the sum of small efforts repeated daily.",
    "The expert in anything was once a beginner.",
    "Study hard, stay focused, and achieve greatness!",
    "Every question you answer brings you closer to your goal.",
    "Consistency is the key to mastering any subject."
  ];

  useEffect(() => {
    if (isProfileIncomplete && isInstalledApp) {
      setShowProfileSheet(true);
    }
  }, [isProfileIncomplete, isInstalledApp]);

  useEffect(() => {
    if (!userProfile?.id) return;
  
    (async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchStreak(),
          fetchDailyGoal()
        ]);
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    })();
  }, [userProfile?.id]);
  

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    
    // Immediate haptic feedback
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Medium });
    }
    playTapSound();
    
    // Navigate first for instant visual feedback, then sign out
    navigate('/auth', { replace: true });
    await signOut();
  };

  const fetchStats = async () => {
    try {
      // Get attempts with results in a single query using join
      const { data: attemptsWithResults, error } = await supabase
        .from('attempts')
        .select(`
          id,
          user_id,
          exam_id,
          status,
          submitted_at,
          results(id, percentage, time_taken_minutes, attempt_id),
          exams(title, type)
        `)
        .eq('user_id', userProfile?.id)
        .eq('status', 'SUBMITTED')
        .order('submitted_at', { ascending: false })
        .limit(50); // Limit to prevent loading too many

      if (error) throw error;

      const validAttempts = attemptsWithResults || [];
      // Filter to only attempts that have results (results is an array from the join)
      const resultsWithScores = validAttempts.filter(a => 
        a.results && Array.isArray(a.results) && a.results.length > 0
      );

      const testsTaken = resultsWithScores.length;
      const averageScore = resultsWithScores.length > 0
        ? Math.round(resultsWithScores.reduce((sum, a) => {
            const result = Array.isArray(a.results) ? a.results[0] : a.results;
            return sum + (result?.percentage || 0);
          }, 0) / resultsWithScores.length)
        : 0;
      const studyHours = Math.round(
        resultsWithScores.reduce((sum, a) => {
          const result = Array.isArray(a.results) ? a.results[0] : a.results;
          return sum + (result?.time_taken_minutes || 0);
        }, 0) / 60
      );

      setStats({ testsTaken, averageScore, studyHours });

      // Format recent results (already sorted, just take first 3)
      const recentWithExam = resultsWithScores.slice(0, 3).map((attempt) => {
        const result = Array.isArray(attempt.results) ? attempt.results[0] : attempt.results;
        const exam = attempt.exams as any;
        return {
          id: result?.id,
          percentage: result?.percentage || 0,
          attempt_id: result?.attempt_id,
          examTitle: exam?.title || 'Practice Test',
          examType: exam?.type || 'JAMB',
          submittedAt: attempt.submitted_at
        };
      });
      
      setRecentResults(recentWithExam);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchStreak = async () => {
    try {
      const { data: attempts } = await supabase
        .from('attempts')
        .select('submitted_at')
        .eq('user_id', userProfile?.id)
        .eq('status', 'SUBMITTED')
        .order('submitted_at', { ascending: false });

      if (!attempts || attempts.length === 0) {
        setStreak({ current: 0, longest: 0 });
        return;
      }

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastTest = new Date(attempts[0].submitted_at);
      lastTest.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        currentStreak = 1;
        
        for (let i = 1; i < attempts.length; i++) {
          const prevDate = new Date(attempts[i - 1].submitted_at);
          const currDate = new Date(attempts[i].submitted_at);
          prevDate.setHours(0, 0, 0, 0);
          currDate.setHours(0, 0, 0, 0);
          
          const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diff === 1) {
            currentStreak++;
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
      setStreak({ current: currentStreak, longest: longestStreak });
    } catch (error) {
      console.error('Error fetching streak:', error);
    }
  };

  const fetchDailyGoal = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayAttempts } = await supabase
        .from('attempts')
        .select('id')
        .eq('user_id', userProfile?.id)
        .gte('created_at', today.toISOString());

      if (todayAttempts) {
        const { count } = await supabase
          .from('attempt_answers')
          .select('*', { count: 'exact', head: true })
          .in('attempt_id', todayAttempts.map(a => a.id))
          .not('answer', 'is', null);

        setDailyGoal({ answered: count || 0, target: 20 });
      }
    } catch (error) {
      console.error('Error fetching daily goal:', error);
    }
  };

  const handleNavigation = async (path: string, featureLabel?: string) => {
    if (isProfileIncomplete && isInstalledApp) {
      setShowProfileSheet(true);
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    playTapSound();
    
    // Check if this is a premium feature and user is on mobile browser (not installed app)
    if (isMobileBrowser && premiumFeatures.some(p => path.startsWith(p))) {
      setBlockedFeatureName(featureLabel || 'this feature');
      setShowInstallModal(true);
      return;
    }
    
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header — matches Services side */}
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={eduraLogo} alt="Edura" className="h-7 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">CBT Practice</p>
              <p className="text-xs text-muted-foreground truncate">Tests, study & analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DashboardThemeMenu />
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-9 w-9"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">
              Hi, {userProfile?.first_name || 'Student'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Keep your streak going today.</p>
          </div>
          <SideSwitcher compact />
        </div>

        <Card className="border bg-gradient-to-br from-primary/10 to-background">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-xl border bg-background p-2.5">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Wallet</p>
                  <p className="mt-1 text-lg font-bold truncate">
                    {walletLoading ? 'Loading…' : naira(walletBalance)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/wallet')}>
                Fund
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tests', value: stats.testsTaken, icon: Trophy },
            { label: 'Avg score', value: `${stats.averageScore}%`, icon: TrendingUp },
            { label: 'Streak', value: streak.current, icon: Flame },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-3 border">
                <div className="mb-2 w-fit rounded-md border bg-muted p-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </Card>
            );
          })}
        </section>

        {/* Daily goal */}
        <Card className="border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-lg border bg-muted p-2.5">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Daily goal</p>
                  <p className="text-xs text-muted-foreground">
                    {dailyGoal.answered}/{dailyGoal.target} questions today
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold shrink-0">
                {Math.min(100, Math.round((dailyGoal.answered / dailyGoal.target) * 100))}%
              </span>
            </div>
            <Progress value={Math.min(100, (dailyGoal.answered / dailyGoal.target) * 100)} className="h-2" />
          </CardContent>
        </Card>

        {/* Promo */}
        {!isPremium && !hasFreePromoAccess && !subscriptionLoading && (
          <MobilePromoCodeActivation onSuccess={() => window.location.reload()} />
        )}

        {/* Subjects */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Subjects</h2>
            <p className="text-xs text-muted-foreground">Pick a subject to study</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'Math', icon: Calculator, subject: 'Mathematics' },
              { name: 'Physics', icon: Sparkles, subject: 'Physics' },
              { name: 'Chem', icon: Beaker, subject: 'Chemistry' },
              { name: 'Biology', icon: Microscope, subject: 'Biology' },
              { name: 'English', icon: BookOpen, subject: 'English' },
              { name: 'Geo', icon: Globe, subject: 'Geography' },
              { name: 'Econ', icon: TrendingUp, subject: 'Economics' },
              { name: 'More', icon: GraduationCap, subject: null },
            ].map((subject) => (
              <button
                key={subject.name}
                onClick={() =>
                  subject.subject
                    ? handleNavigation(`/study-hub?subject=${subject.subject}`)
                    : handleNavigation('/study-hub')
                }
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 transition-colors hover:border-primary/60"
              >
                <div className="rounded-md border bg-muted p-2">
                  <subject.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-medium">{subject.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <p className="text-xs text-muted-foreground">Jump straight into a feature</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Study Planner', icon: Calendar, path: '/study-planner' },
              { label: 'Challenge Arena', icon: Trophy, path: '/challenge-arena' },
              { label: 'Analytics', icon: TrendingUp, path: '/performance-report' },
              { label: 'Resources', icon: Library, path: '/resources' },
              { label: 'Forum', icon: MessageSquare, path: '/forum' },
              { label: 'Referral', icon: Gift, path: '/referral-program' },
              { label: 'Ebook Library', icon: BookOpen, path: '/ebooks' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => handleNavigation(action.path, action.label)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/60"
              >
                <div className="rounded-md border bg-muted p-2">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent results */}
        {recentResults.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Recent tests</h2>
                <p className="text-xs text-muted-foreground">Your latest attempts</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/performance-report')}>
                View all
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {recentResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => navigate(`/results?attempt=${result.attempt_id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-md border bg-muted p-2 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{result.examTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 text-sm font-bold ${
                      result.percentage >= 75
                        ? 'text-success'
                        : result.percentage >= 50
                        ? 'text-warning'
                        : 'text-destructive'
                    }`}
                  >
                    {result.percentage}%
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Premium CTA */}
        {!isPremium && (
          <Card className="border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border bg-muted p-2.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Go Premium</p>
                  <p className="text-xs text-muted-foreground">
                    Unlimited tests, AI tutor and exclusive study materials.
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate('/payment')}>
                Upgrade now
              </Button>
            </CardContent>
          </Card>
        )}
      </main>


      {/* Profile Settings Sheet */}
      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Profile Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto">
            <ProfileSettings />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Navigation */}
      <MobileNav activeTab="dashboard" onTabChange={(tab) => {
        if (tab === "profile") setShowProfileSheet(true);
      }} />

      {/* WhatsApp Support */}
      <WhatsAppButton />

      {/* AI Assistant */}

      {/* Install Required Modal for mobile browser users */}
      <InstallRequiredModal 
        open={showInstallModal} 
        onOpenChange={setShowInstallModal}
        featureName={blockedFeatureName}
      />
    </div>
  );
};

export default MobileHome;
