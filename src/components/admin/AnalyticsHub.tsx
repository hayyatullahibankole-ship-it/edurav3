import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Clock,
  Target,
  Award,
  Activity,
  Calendar,
  DollarSign,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Cell, Pie, LineChart, Line } from 'recharts';
import { countUsersLoggedInWithinDays } from '@/lib/adminUserActivity';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function AnalyticsHub() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalAttempts: 0,
    avgScore: 0,
    recentUsers: 0,
    loggedInUsers7d: 0,
    recentExams: 0,
    activeSessions: 0,
    subjectPerformance: [] as any[],
    userGrowth: [] as any[],
    examTrends: [] as any[],
    revenue: [] as any[],
    demographics: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts' }, () => fetchAnalyticsData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => fetchAnalyticsData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchAnalyticsData())
      .subscribe();
    const refreshInterval = window.setInterval(() => fetchAnalyticsData(), 60_000);

    return () => {
      window.clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch comprehensive live analytics data
      const [
        usersResp,
        examsResp,
        attemptsResp,
        resultsResp,
        subscriptionsResp,
        transactionsResp,
        subjectsResp,
        authActivityResp,
      ] = await Promise.all([
        supabase.from('users').select('id, created_at, country').order('created_at', { ascending: false }),
        supabase.from('exams').select('id, title, type, created_at, is_published'),
        supabase.from('attempts').select('id, status, started_at, submitted_at, user_id, exam_id').order('started_at', { ascending: false }),
        supabase.from('results').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*, subscription_plans(name, price, currency)').eq('status', 'ACTIVE'),
        supabase.from('transactions').select('*').eq('status', 'SUCCESS').order('created_at', { ascending: false }),
        supabase.from('subjects').select('id, name'),
        supabase.functions.invoke('admin-user-activity')
      ]);
      if (authActivityResp.error) console.error('Could not load sign-in activity', authActivityResp.error);

      // Process user growth data
      const userGrowthData = [];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();

      last7Days.forEach(date => {
        const dayUsers = usersResp.data?.filter(user => {
          const userDate = new Date(user.created_at);
          return userDate.toDateString() === date.toDateString();
        }).length || 0;
        
        userGrowthData.push({
          date: date.toISOString().split('T')[0],
          users: dayUsers,
          name: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      });

      // Process exam performance data
      const examTrends = [];
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      }).reverse();

      last14Days.forEach(date => {
        const dayAttempts = attemptsResp.data?.filter(attempt => {
          const attemptDate = new Date(attempt.started_at);
          return attemptDate.toDateString() === date.toDateString();
        }).length || 0;
        
        examTrends.push({
          date: date.toISOString().split('T')[0],
          attempts: dayAttempts,
          name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      });

      // Process subject performance
      const subjectPerformance = [];
      subjectsResp.data?.forEach(subject => {
        const subjectResults = resultsResp.data?.filter(result => {
          const breakdown = result.subject_breakdown;
          return breakdown && breakdown[subject.id];
        }) || [];

        if (subjectResults.length > 0) {
          const totalCorrect = subjectResults.reduce((sum, result) => {
            const subjectData = result.subject_breakdown[subject.id];
            return sum + (subjectData?.correct || 0);
          }, 0);
          
          const totalQuestions = subjectResults.reduce((sum, result) => {
            const subjectData = result.subject_breakdown[subject.id];
            return sum + (subjectData?.total || 0);
          }, 0);

          const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
          
          subjectPerformance.push({
            subject: subject.name,
            score: averageScore,
            attempts: subjectResults.length
          });
        }
      });

      // Process revenue data
      const revenueData = [];
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date;
      }).reverse();

      last6Months.forEach(date => {
        const monthRevenue = transactionsResp.data?.filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear();
        }).reduce((sum, transaction) => sum + parseFloat(String(transaction.amount) || '0'), 0) || 0;
        
        revenueData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          fullDate: date.toISOString().split('T')[0]
        });
      });

      // Process demographics
      const demographics = [];
      const countries = usersResp.data?.reduce((acc, user) => {
        const country = user.country || 'Nigeria';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {}) || {};

      Object.entries(countries).slice(0, 5).forEach(([country, count]) => {
        const countValue = count as number;
        demographics.push({
          name: country,
          value: countValue,
          percentage: Math.round((countValue / (usersResp.data?.length || 1)) * 100)
        });
      });

      // Calculate comprehensive stats
      const completedAttempts = attemptsResp.data?.filter(a => a.status === 'SUBMITTED').length || 0;
      const totalQuestions = resultsResp.data?.reduce((sum, result) => sum + (result.total_questions || 0), 0) || 0;
      const correctAnswers = resultsResp.data?.reduce((sum, result) => sum + (result.correct_answers || 0), 0) || 0;
      const avgScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      // Get recent activity
      const recentUsers = usersResp.data?.filter(user => {
        const userDate = new Date(user.created_at);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return userDate > dayAgo;
      }).length || 0;

      const recentExams = attemptsResp.data?.filter(attempt => {
        const attemptDate = new Date(attempt.started_at);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return attemptDate > dayAgo;
      }).length || 0;

      setAnalytics({
        totalUsers: usersResp.data?.length || 0,
        totalExams: examsResp.data?.length || 0,
        totalAttempts: completedAttempts,
        avgScore,
        recentUsers,
        loggedInUsers7d: countUsersLoggedInWithinDays(authActivityResp.data?.users || [], 7),
        recentExams,
        activeSessions: attemptsResp.data?.filter(a => a.status === 'IN_PROGRESS').length || 0,
        subjectPerformance: subjectPerformance.slice(0, 10),
        userGrowth: userGrowthData,
        examTrends,
        revenue: revenueData,
        demographics
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-slate-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Analytics Hub</h1>
          <p className="text-slate-400">Real-time insights and performance metrics</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-blue-900/50 border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Total Users</p>
                  <p className="text-3xl font-bold text-blue-100">{analytics.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-xs text-green-400">+{analytics.recentUsers} registrations today</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900/50 border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Exam Completions</p>
                  <p className="text-3xl font-bold text-green-100">{analytics.totalAttempts.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-xs text-green-400">+{analytics.recentExams} today</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/50 border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Avg. Score</p>
                  <p className="text-3xl font-bold text-purple-100">{analytics.avgScore}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-xs text-green-400">Platform average</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-900/50 border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-300">Active Sessions</p>
                  <p className="text-3xl font-bold text-orange-100">{analytics.activeSessions}</p>
                  <div className="flex items-center mt-2">
                    <Activity className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-xs text-green-400">In progress now</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
            <TabsTrigger value="exams">Exam Performance</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">User Growth (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar dataKey="users" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Demographics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">User Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.demographics}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.demographics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Daily User Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                        <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">User Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">New Registrations Today</span>
                    <Badge className="bg-green-600">{analytics.recentUsers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Logged In Within 7 Days</span>
                    <Badge className="bg-emerald-700">{analytics.loggedInUsers7d}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Total Registered</span>
                    <Badge className="bg-blue-600">{analytics.totalUsers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Exams In Progress</span>
                    <Badge className="bg-orange-600">{analytics.activeSessions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Platform Average Score</span>
                    <Badge className="bg-purple-600">{analytics.avgScore}%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Exam Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.examTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                        <Bar dataKey="attempts" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.subjectPerformance.slice(0, 6).map((subject, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">{subject.subject}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${subject.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-12">{subject.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Session Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">24min</div>
                  <p className="text-slate-400 text-sm">Average session length</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Page Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">12.4k</div>
                  <p className="text-slate-400 text-sm">This week</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Bounce Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">23%</div>
                  <p className="text-slate-400 text-sm">Users leaving quickly</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                          formatter={(value) => [`₦${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Total Revenue</span>
                    <Badge className="bg-green-600">
                      ₦{analytics.revenue.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">This Month</span>
                    <Badge className="bg-blue-600">
                      ₦{(analytics.revenue[analytics.revenue.length - 1]?.revenue || 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Average Monthly</span>
                    <Badge className="bg-purple-600">
                      ₦{Math.round(analytics.revenue.reduce((sum, item) => sum + item.revenue, 0) / Math.max(analytics.revenue.length, 1)).toLocaleString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}