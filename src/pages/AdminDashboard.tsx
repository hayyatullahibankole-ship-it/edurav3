import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  DollarSign, 
  Settings, 
  AlertTriangle,
  FileText,
  BarChart3,
  Shield,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  LogOut,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Activity,
  Calculator,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SecurityConfig from '@/components/admin/SecurityConfig';
import SecurityManager from '@/components/admin/SecurityManager';
import SecurityMonitor from '@/components/admin/SecurityMonitor';
import SecurityAlertsBanner from '@/components/admin/SecurityAlertsBanner';
import SystemConfig from '@/components/admin/SystemConfig';
import QuestionManagement from '@/components/admin/QuestionManagement';
import ResourceManagement from '@/components/admin/ResourceManagement';
import AnalyticsHub from '@/components/admin/AnalyticsHub';
import UserManagement from '@/components/admin/UserManagement';
import ExamControl from '@/components/admin/ExamControl';
import PricingManager from '@/components/admin/PricingManager';
import NotificationManager from '@/components/admin/NotificationManager';
import ReferralManager from '@/components/admin/ReferralManager';
import { CouponManager } from '@/components/admin/CouponManager';

export default function AdminDashboard() {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Allow deep-linking to tabs via ?tab= query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, []);
  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
  
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalExams: 0,
    recentActivities: [],
    suspiciousActivities: []
  });

  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  
  // Form states
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    type: 'JAMB' as 'JAMB' | 'WAEC' | 'CUSTOM',
    duration_minutes: 120,
    total_questions: 180,
    passing_score: 50,
    instructions: '',
    is_published: false
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking admin status
    if (authLoading) {
      return;
    }
    
    if (!isAdmin) {
      console.log('Not admin, redirecting to login');
      navigate('/admin/login');
      return;
    }
    
    console.log('Admin verified, loading dashboard data');
    fetchAdminData();

    // Set up real-time updates for subscriptions and transactions
    const channel = supabase
      .channel('admin-dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        console.log('Subscription changed, refreshing dashboard');
        fetchAdminData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        console.log('Transaction changed, refreshing dashboard');
        fetchAdminData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('User changed event received:', payload);
        fetchAdminData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, authLoading, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics with transactions for revenue
      const [usersResp, subscriptionsResp, examsResp, attemptsResp, transactionsResp] = await Promise.all([
        supabase.rpc('get_users_masked'),
        supabase.from('subscriptions').select('id, status, start_date, end_date', { count: 'exact' }),
        supabase.from('exams').select('id, title, type, is_published'),
        supabase.from('attempts').select(`
          id, 
          suspicious_activity_count, 
          created_at,
          users(first_name, last_name, email),
          exams(title)
        `).order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('amount, status, created_at').eq('status', 'SUCCESS')
      ]);

      const totalUsers = usersResp.data?.length || 0;
      const activeSubscriptions = subscriptionsResp.data?.filter(s => s.status === 'ACTIVE').length || 0;
      const totalExams = examsResp.data?.length || 0;
      
      // Calculate total revenue from successful transactions
      const totalRevenue = transactionsResp.data?.reduce((sum, transaction) => 
        sum + parseFloat(String(transaction.amount) || '0'), 0) || 0;
      
      // Get suspicious activities
      const suspiciousActivities = attemptsResp.data?.filter(a => a.suspicious_activity_count > 0) || [];

      setDashboardStats({
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        totalExams,
        recentActivities: attemptsResp.data?.slice(0, 5) || [],
        suspiciousActivities
      });

      setUsers(usersResp.data || []);
      setExams(examsResp.data || []);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          return;
        }
        const { error } = await supabase.rpc('delete_user_completely', { user_uuid: userId });
        if (error) throw error;
        toast({ title: "User deleted successfully" });
      } else {
        const { error } = await supabase
          .from('users')
          .update({ is_suspended: action === 'suspend' })
          .eq('id', userId);
        if (error) throw error;
        toast({ title: `User ${action}d successfully` });
      }
      fetchAdminData();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} user`,
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    try {
      // Export all data as CSV
      const exportData = {
        users: users.slice(0, 100), // Limit for performance
        exams: exams,
        dashboardStats
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json;charset=utf-8;' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `admin_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: "Admin data exported successfully"
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleCreateExam = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert([newExam])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exam created successfully"
      });

      setIsCreateExamModalOpen(false);
      setNewExam({
        title: '',
        description: '',
        type: 'JAMB' as 'JAMB' | 'WAEC' | 'CUSTOM',
        duration_minutes: 120,
        total_questions: 180,
        passing_score: 50,
        instructions: '',
        is_published: false
      });
      fetchAdminData();
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: "Error",
        description: "Failed to create exam",
        variant: "destructive"
      });
    }
  };

  const handleEditExam = (exam: any) => {
    setSelectedExam(exam);
    setNewExam({
      title: exam.title,
      description: exam.description || '',
      type: exam.type,
      duration_minutes: exam.duration_minutes,
      total_questions: exam.total_questions || 180,
      passing_score: exam.passing_score || 50,
      instructions: exam.instructions || '',
      is_published: exam.is_published
    });
    setIsExamModalOpen(true);
  };

  const handleUpdateExam = async () => {
    try {
      const { error } = await supabase
        .from('exams')
        .update(newExam)
        .eq('id', selectedExam.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exam updated successfully"
      });

      setIsExamModalOpen(false);
      setSelectedExam(null);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating exam:', error);
      toast({
        title: "Error",
        description: "Failed to update exam",
        variant: "destructive"
      });
    }
  };

  const handleViewExam = (exam: any) => {
    setSelectedExam(exam);
    setIsExamModalOpen(true);
  };

  const handleToggleExamPublished = async (examId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_published: !currentStatus })
        .eq('id', examId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Exam ${!currentStatus ? 'published' : 'unpublished'} successfully`
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error toggling exam status:', error);
      toast({
        title: "Error",
        description: "Failed to update exam status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Exam deleted successfully"
      });
      
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const handleFixMathNotation = async () => {
    try {
      setLoading(true);
      toast({
        title: "Processing",
        description: "Fixing mathematical notation in all questions...",
      });

      const { data, error } = await supabase.functions.invoke('fix-math-notation');
      
      if (error) throw error;
      
      toast({
        title: "Mathematical Notation Fixed",
        description: data.message || "Successfully processed all questions with mathematical notation fixes.",
      });
    } catch (error) {
      console.error('Math notation fix error:', error);
      toast({
        title: "Error",
        description: "Failed to fix mathematical notation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 w-full max-w-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Edura Admin</h1>
                  <p className="text-xs text-muted-foreground">Administration Portal</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="h-6 w-px bg-border" />
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <Badge variant="destructive" className="text-xs">
                    Super Admin
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">

        {/* Security Status Banner */}
        <div className="mb-6">
          <SecurityAlertsBanner criticalIssues={[
            "Enable Leaked Password Protection in Supabase Authentication settings",
            "Verify Site URL and Redirect URLs in Supabase Authentication configuration"
          ]} />
        </div>

        {/* Security Alert */}
        {dashboardStats.suspiciousActivities.length > 0 && (
          <Alert className="mb-6 border-orange-500 bg-orange-50/50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {dashboardStats.suspiciousActivities.length} suspicious exam activities detected. 
              <Button variant="link" className="p-0 h-auto ml-2 text-orange-600" onClick={() => setActiveTab('security')}>
                Review now →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="relative overflow-hidden bg-blue-50 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/25 dark:border-blue-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{dashboardStats.totalUsers}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">+12% from last month</p>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-green-50 border-green-200 dark:from-green-950/50 dark:to-green-900/25 dark:border-green-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 break-words">
                    ₦{dashboardStats.totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">{dashboardStats.activeSubscriptions} active subs</p>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-purple-50 border-purple-200 dark:from-purple-950/50 dark:to-purple-900/25 dark:border-purple-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300">Total Exams</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">{dashboardStats.totalExams}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">+5 new this week</p>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-orange-50 border-orange-200 dark:from-orange-950/50 dark:to-orange-900/25 dark:border-orange-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">Security Alerts</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {dashboardStats.suspiciousActivities.length}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {dashboardStats.suspiciousActivities.length === 0 ? 'All clear' : 'Needs attention'}
                  </p>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Admin Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full lg:min-w-0 bg-card border">
                <TabsTrigger value="overview" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Overview</TabsTrigger>
                <TabsTrigger value="users" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Users</TabsTrigger>
                <TabsTrigger value="exams" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Exams</TabsTrigger>
                <TabsTrigger value="questions" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Questions</TabsTrigger>
                <TabsTrigger value="resources" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Resources</TabsTrigger>
                <TabsTrigger value="subscriptions" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Subscriptions</TabsTrigger>
                <TabsTrigger value="promos" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Promos</TabsTrigger>
                <TabsTrigger value="referrals" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Referrals</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Analytics</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Notifications</TabsTrigger>
                <TabsTrigger value="security" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Security</TabsTrigger>
                <TabsTrigger value="monitor" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Monitor</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs lg:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium whitespace-nowrap">Settings</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportData} className="text-xs sm:text-sm">
                <Filter className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData} className="text-xs sm:text-sm">
                <Download className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleFixMathNotation} disabled={loading} className="text-xs sm:text-sm">
                <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Fix Math</span>
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Exam Activities</CardTitle>
                  <CardDescription>Latest exam attempts by students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardStats.recentActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {activity.users?.first_name} {activity.users?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.exams?.title}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Platform health indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Database Status</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Authentication</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>File Storage</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Anti-Cheat System</span>
                    <Badge variant="default">Monitoring</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement users={users} onRefresh={fetchAdminData} />
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <ExamControl />
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card className="bg-blue-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-blue-900 dark:text-blue-100">Mathematical Notation Tools</CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Fix rendering of matrices, determinants, square roots, exponents, subscripts and other LaTeX math expressions.
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleFixMathNotation} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {loading ? "Fixing..." : "Fix Math Notation"}
                </Button>
              </CardHeader>
            </Card>
            <QuestionManagement />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <ResourceManagement />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <PricingManager />
          </TabsContent>

          <TabsContent value="promos" className="space-y-6">
            <CouponManager />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <ReferralManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsHub />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <TrialsAndAutomation />
            <NotificationManager />
          </TabsContent>


          <TabsContent value="security" className="space-y-6">
            <Tabs defaultValue="monitor" className="space-y-6">
              <TabsList className="bg-card border">
                <TabsTrigger value="monitor">Security Monitor</TabsTrigger>
                <TabsTrigger value="config">Security Config</TabsTrigger>
              </TabsList>
              <TabsContent value="monitor">
                <SecurityManager />
              </TabsContent>
              <TabsContent value="config">
                <SecurityConfig />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            <SecurityMonitor />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}