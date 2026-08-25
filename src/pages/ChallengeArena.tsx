import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, Zap, Clock, Target, Award, TrendingUp, ArrowLeft, Flame, Star, Crown, Sparkles, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import WhatsAppButton from '@/components/WhatsAppButton';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  question_count: number;
  duration_minutes: number;
  difficulty_level: number;
  points_reward: number;
  start_date: string;
  end_date: string;
  isCompleted?: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  users: {
    first_name: string;
    last_name: string;
  };
  score: number;
  time_taken_seconds: number;
  points_earned: number;
  completed_at: string;
}

export default function ChallengeArena() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isEnterprise, loading: subLoading } = useSubscription();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('daily');
  const [courseCategory, setCourseCategory] = useState<'science' | 'art' | 'management'>('science');
  const [userAttempts, setUserAttempts] = useState<Set<string>>(new Set());
  const [userStreak, setUserStreak] = useState(0);
const [userStats, setUserStats] = useState({ rank: 0, points: 0, achievements: 0 });
const [accessDenied, setAccessDenied] = useState(false);

useEffect(() => {
  if (!subLoading && !isEnterprise) {
    setAccessDenied(true);
    setLoading(false);
    return;
  }

  if (isEnterprise) {
    fetchChallenges();
    fetchLeaderboard();
    fetchUserAttempts();

    // Subscribe to real-time updates
    const challengesChannel = supabase
      .channel('challenges-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(challengesChannel);
    };
  }
}, [isEnterprise, subLoading, selectedTab, courseCategory]);

  const fetchUserAttempts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userProfile) return;

      const { data, error } = await supabase
        .from('challenge_attempts')
        .select('challenge_id')
        .eq('user_id', userProfile.id);

      if (error) throw error;
      setUserAttempts(new Set(data?.map(a => a.challenge_id) || []));
    } catch (error) {
      console.error('Error fetching user attempts:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .eq('challenge_type', selectedTab)
        .eq('course_category', courseCategory)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      const challengesWithStatus = (data || []).map(challenge => ({
        ...challenge,
        isCompleted: userAttempts.has(challenge.id)
      }));
      
      setChallenges(challengesWithStatus);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_attempts')
        .select(`
          *,
          users (first_name, last_name)
        `)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  if (subLoading || loading) {
    return (
      <Layout showNavbar={false} showMobileNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

if (accessDenied) {
  return (
    <Layout showNavbar={false} showMobileNav={false}>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <Trophy className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Challenge Arena is a Pro feature</h1>
          <p className="text-muted-foreground mb-6">Upgrade to access daily missions, competitions, and leaderboards.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/payment')}>Go Premium</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Modern Mobile Design
if (isMobile) {
  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="bg-primary/10 p-6 pb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Challenge Arena
          </h1>
          <p className="text-muted-foreground text-sm">Complete daily missions and compete!</p>
        </div>

        {/* Streak Card */}
        <div className="px-6 -mt-6 mb-6">
          <Card className="bg-orange-500 border-0 shadow-xl overflow-hidden">
            <CardContent className="p-5 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Flame className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{userStreak} days</p>
                    <p className="text-sm text-white/80">Current Streak</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60" />
              </div>
              {userStreak > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20 relative z-10">
                  <p className="text-xs text-white/80">
                    Practice daily to maintain your streak!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-xl bg-yellow-500/20 w-fit mx-auto mb-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">#{userStats.rank || '--'}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-xl bg-blue-500/20 w-fit mx-auto mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{userStats.points}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </CardContent>
            </Card>
            
            <Card className="bg-card border shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="p-2 rounded-xl bg-green-500/20 w-fit mx-auto mb-2">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{userStats.achievements}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['science', 'art', 'management'] as const).map((cat) => (
              <Button
                key={cat}
                onClick={() => setCourseCategory(cat)}
                variant={courseCategory === cat ? "default" : "outline"}
                className="rounded-full px-6 whitespace-nowrap"
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Challenges Section */}
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily Missions
          </h2>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full bg-muted mb-4">
              <TabsTrigger 
                value="daily"
                className="flex-1"
              >
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="weekly"
                className="flex-1"
              >
                Weekly
              </TabsTrigger>
              <TabsTrigger 
                value="special"
                className="flex-1"
              >
                Special
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-0">
              <div className="space-y-3">
                {challenges.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No {selectedTab} challenges available</p>
                    </CardContent>
                  </Card>
                ) : (
                  challenges.map((challenge, index) => (
                    <Card 
                      key={challenge.id}
                      className="shadow-lg hover:shadow-xl transition-all overflow-hidden border-l-4"
                      style={{
                        borderLeftColor: 
                          index === 0 ? 'hsl(var(--primary))' :
                          index === 1 ? '#fbbf24' :
                          index === 2 ? '#ec4899' : 'hsl(var(--primary))'
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`p-3 rounded-2xl ${
                            index === 0 ? 'bg-primary/20' :
                            index === 1 ? 'bg-yellow-500/20' :
                            index === 2 ? 'bg-pink-500/20' :
                            'bg-primary/20'
                          }`}>
                            {index === 0 ? <Zap className="h-6 w-6 text-primary" /> :
                             index === 1 ? <Star className="h-6 w-6 text-yellow-600" /> :
                             index === 2 ? <Target className="h-6 w-6 text-pink-600" /> :
                             <Trophy className="h-6 w-6 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold">{challenge.title}</h3>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                +{challenge.points_reward} XP
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {challenge.question_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {challenge.duration_minutes}m
                              </div>
                              <div>Level {challenge.difficulty_level}</div>
                            </div>

                            {challenge.isCompleted ? (
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                                Completed
                              </div>
                            ) : (
                              <Progress value={0} className="h-1.5" />
                            )}
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => navigate(`/challenge/${challenge.id}`)}
                          disabled={challenge.isCompleted}
                          className="w-full"
                          variant={challenge.isCompleted ? "secondary" : "default"}
                        >
                          {challenge.isCompleted ? '✓ Completed' : 'Start Challenge'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Leaderboard */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Leaderboard
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 h-8"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-4">
              {leaderboard.length === 0 ? (
                <div className="py-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">No rankings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div 
                      key={entry.user_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-300 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {entry.users?.first_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {entry.users?.first_name} {entry.users?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.completed_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-600" />
                          <p className="font-bold">{entry.score}</p>
                        </div>
                        <p className="text-xs text-white/50">
                          {Math.floor(entry.time_taken_seconds / 60)}:{(entry.time_taken_seconds % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium CTA */}
        <div className="px-6 mb-8">
          <Card className="bg-purple-600 border-0 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <CardContent className="p-6 relative">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-1">Unlock Premium</h3>
                  <p className="text-sm text-white/80 mb-4">
                    Get unlimited challenges, exclusive badges, and more rewards!
                  </p>
                  <Button
                    onClick={() => navigate('/payment')}
                    className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <WhatsAppButton />
    </>
  );
}

// Desktop Layout
return (
  <Layout showNavbar={false} showMobileNav={false}>
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          Challenge Arena
        </h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['science','art','management'] as const).map((cat) => (
            <Button
              key={cat}
              onClick={() => setCourseCategory(cat)}
              variant={courseCategory === cat ? 'default' : 'outline'}
              className="rounded-full px-6 capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div>
        {challenges.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No {selectedTab} challenges available
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge, index) => (
              <Card 
                key={challenge.id}
                className="shadow-lg hover:shadow-xl transition-all overflow-hidden border-l-4"
                style={{
                  borderLeftColor: 
                    index === 0 ? 'hsl(var(--primary))' :
                    index === 1 ? '#fbbf24' :
                    index === 2 ? '#ec4899' : 'hsl(var(--primary))'
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${index === 0 ? 'bg-primary/20' : index === 1 ? 'bg-yellow-500/20' : index === 2 ? 'bg-pink-500/20' : 'bg-primary/20'} p-3 rounded-2xl`}>
                      {index === 0 ? <Zap className="h-6 w-6 text-primary" /> :
                       index === 1 ? <Star className="h-6 w-6 text-yellow-600" /> :
                       index === 2 ? <Target className="h-6 w-6 text-pink-600" /> :
                       <Trophy className="h-6 w-6 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold pr-2 line-clamp-2">{challenge.title}</h3>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          +{challenge.points_reward} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{challenge.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {challenge.question_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {challenge.duration_minutes}m
                        </div>
                        <div>Level {challenge.difficulty_level}</div>
                      </div>
                      {challenge.isCompleted ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                          Completed
                        </div>
                      ) : (
                        <Progress value={0} className="h-1.5" />
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/challenge/${challenge.id}`)}
                    disabled={challenge.isCompleted}
                    className="w-full"
                    variant={challenge.isCompleted ? 'secondary' : 'default'}
                  >
                    {challenge.isCompleted ? '✓ Completed' : 'Start Challenge'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          Leaderboard
        </h2>
        <Card>
          <CardContent className="p-4">
            {leaderboard.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No rankings yet</div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className={`${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'} w-10 h-10 rounded-full flex items-center justify-center font-bold`}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {entry.users?.first_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{entry.users?.first_name} {entry.users?.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.completed_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-600" />
                        <p className="font-bold">{entry.score}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(entry.time_taken_seconds / 60)}:{(entry.time_taken_seconds % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </Layout>
);
}
