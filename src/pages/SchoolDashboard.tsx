import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, BookOpen, TrendingUp, DollarSign, LayoutDashboard, Settings,
  LogOut, Copy, Building2, HelpCircle, Video, Trophy, Lock, AlertTriangle, UserCog } from
"lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger } from
"@/components/ui/sidebar";
import SchoolStudentsManager from "@/components/school/SchoolStudentsManager";
import SchoolReports from "@/components/school/SchoolReports";
import SchoolBilling from "@/components/school/SchoolBilling";
import SchoolSettings from "@/components/school/SchoolSettings";
import SchoolOverviewCharts from "@/components/school/SchoolOverviewCharts";
import RealtimeActivityFeed from "@/components/school/RealtimeActivityFeed";
import PerformanceTrends from "@/components/school/PerformanceTrends";
import StudentEngagement from "@/components/school/StudentEngagement";
import QuickActions from "@/components/school/QuickActions";
import TopPerformers from "@/components/school/TopPerformers";
import ComparisonAnalytics from "@/components/school/ComparisonAnalytics";
import AlertsCenter from "@/components/school/AlertsCenter";
import ExportTools from "@/components/school/ExportTools";
import WelcomeManualModal from "@/components/school/WelcomeManualModal";
import SchoolExamManager from "@/components/school/SchoolExamManagerEnhanced";
import VideoTutorials from "@/components/school/VideoTutorials";
import SchoolMockManager from "@/components/school/SchoolMockManager";
import SchoolStaffManager from "@/components/school/SchoolStaffManager";

const menuItems = [
{ id: "overview", title: "Overview", icon: LayoutDashboard },
{ id: "students", title: "Students", icon: Users },
{ id: "exams", title: "Exams", icon: BookOpen },
{ id: "mock", title: "Mock Exam", icon: Trophy },
{ id: "reports", title: "Reports", icon: TrendingUp },
{ id: "tutorials", title: "Video Tutorials", icon: Video },
{ id: "staff", title: "Staff", icon: UserCog },
{ id: "billing", title: "Billing", icon: DollarSign },
{ id: "settings", title: "Settings", icon: Settings }];


function SchoolSidebar({ activeTab, setActiveTab, schoolData, isPaid }: any) {
  const lockedTabs = isPaid ? [] : ['exams', 'reports'];

  return (
    <Sidebar className="border-r bg-card">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2">
            {schoolData?.logo_url ?
            <AvatarImage
              src={`${schoolData.logo_url}?t=${Date.now()}`}
              alt={schoolData?.name} /> :


            <AvatarFallback className="bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
            }
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">{schoolData?.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{schoolData?.school_code}</p>
            {!isPaid &&
            <Badge variant="outline" className="text-[10px] mt-1 border-amber-500 text-amber-600">
                Unpaid
              </Badge>
            }
          </div>
        </div>
      </div>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) =>
              <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                  onClick={() => setActiveTab(item.id)}
                  isActive={activeTab === item.id}
                  className="w-full justify-start">
                  
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {lockedTabs.includes(item.id) &&
                  <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                  }
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>);

}

export default function SchoolDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to continue");
      navigate("/auth");
      return;
    }

    fetchSchoolData();
  }, [user]);

  const handleCloseWelcomeModal = () => {
    if (schoolData?.id) {
      localStorage.setItem(`school_welcome_${schoolData.id}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const fetchSchoolData = async () => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.
      from("users").
      select("id").
      eq("auth_user_id", user?.id).
      maybeSingle();

      if (!userData) {
        toast.error("User not found");
        return;
      }

      const { data: school, error: schoolError } = await supabase.
      from("schools").
      select("*").
      eq("admin_user_id", userData.id).
      maybeSingle();

      if (schoolError) throw schoolError;

      if (!school) {
        // Try to create school from pending registration data
        const pendingRaw = localStorage.getItem('pendingSchoolRegistration');
        if (pendingRaw) {
          const pendingData = JSON.parse(pendingRaw);
          const { data: createResult, error: createError } = await supabase.functions.invoke(
            'create-school-from-pending',
            {
              body: {
                schoolData: {
                  schoolName: pendingData.schoolName || "My School",
                  schoolEmail: pendingData.schoolEmail || user?.email || "",
                  schoolPhone: pendingData.schoolPhone || "",
                  schoolAddress: pendingData.schoolAddress || "",
                  state: pendingData.state || "",
                  schoolType: pendingData.schoolType || "secondary"
                }
              }
            }
          );

          if (!createError && createResult?.school) {
            localStorage.removeItem('pendingSchoolRegistration');
            setSchoolData(createResult.school);
            // Continue to fetch subscription
            const { data: subscriptions } = await (supabase as any).
            from("school_subscriptions").
            select("*").
            eq("school_id", createResult.school.id).
            order("created_at", { ascending: false }).
            limit(1);
            setSubscriptionData(subscriptions?.[0] || null);
            const hasSeenWelcome = localStorage.getItem(`school_welcome_${createResult.school.id}`);
            if (!hasSeenWelcome) setShowWelcomeModal(true);
            return;
          } else {
            console.error("Failed to create school from pending data:", createError);
          }
        }

        setSchoolData(null);
        setSubscriptionData(null);
        toast.error("No school account found. Please complete registration.");
        navigate("/school-registration");
        return;
      }

      setSchoolData(school);

      const { data: subscriptions } = await (supabase as any).
      from("school_subscriptions").
      select("*").
      eq("school_id", school.id).
      order("created_at", { ascending: false }).
      limit(1);

      const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
      setSubscriptionData(subscription);

      // Check if this is a new school and show welcome modal
      const hasSeenWelcome = localStorage.getItem(`school_welcome_${school.id}`);
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }

    } catch (error: any) {
      console.error("Error fetching school data:", error);
      toast.error("Failed to load school data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>);

  }

  const remainingSlots = (subscriptionData?.student_seats || schoolData?.max_students || 0) - (schoolData?.students_added || 0);
  const isSubscriptionActive = subscriptionData?.status?.toUpperCase() === 'ACTIVE';
  const isPaid = schoolData?.is_active && isSubscriptionActive;

  // Locked feature overlay component
  const LockedOverlay = ({ featureName }: {featureName: string;}) =>
  <div className="relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
        <Card className="max-w-md mx-4 border-destructive/50">
          <CardContent className="p-6 text-center">
            <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">Feature Locked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {featureName} is only available after completing your subscription payment. 
              Your students also won't be able to access their portals until payment is made.
            </p>
            <Button onClick={() => navigate("/school-subscription")} className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Complete Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;


  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full flex">
        <SchoolSidebar activeTab={activeTab} setActiveTab={setActiveTab} schoolData={schoolData} isPaid={isPaid} />
        
        <div className="flex-1 flex flex-col w-full">
          {/* Header */}
          <header className="h-16 border-b bg-background sticky top-0 z-40">
            <div className="h-full px-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-6" />
                <h1 className="text-lg font-semibold">
                  {menuItems.find((item) => item.id === activeTab)?.title}
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open("https://wa.me/2347050757085?text=Hello,%20I%20need%20support%20with%20my%20school%20account", "_blank");
                  }}>
                  
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.success("Logged out successfully");
                    navigate("/school-login");
                  }}>
                  
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container max-w-7xl mx-auto p-8">
              {/* Payment Required Banner */}
              {!isPaid &&
              <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 dark:text-amber-300">Subscription Payment Required</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-400">You can add students now, but features like Exams, and Reports are locked. Students won't be able to access their portals until payment is completed.


                    </p>
                    </div>
                    <Button
                    onClick={() => navigate("/school-subscription")}
                    className="shrink-0"
                    size="sm">
                    
                      <DollarSign className="h-4 w-4 mr-1" />
                      Pay Now
                    </Button>
                  </CardContent>
                </Card>
              }

              {activeTab === "overview" &&
              <div className="space-y-8">
                  {/* Alerts Center - Critical Info First */}
                  <AlertsCenter
                  schoolId={schoolData?.id}
                  subscriptionData={subscriptionData}
                  schoolData={schoolData} />
                

                  {/* School Code Section */}
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">School Code</CardTitle>
                          <CardDescription className="mt-1">
                            Share this code with students for registration
                          </CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-md text-xs font-medium ${
                      isSubscriptionActive ?
                      'bg-green-50 text-green-700 border border-green-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'}`
                      }>
                          {isSubscriptionActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 p-3 bg-muted rounded-lg">
                          <p className="text-xl font-mono font-bold tracking-wider">
                            {schoolData?.school_code}
                          </p>
                        </div>
                        <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(schoolData?.school_code || '');
                          toast.success('School code copied to clipboard');
                        }}>
                        
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Grid */}
                  <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Total Seats</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {subscriptionData?.student_seats || schoolData?.max_students || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum capacity
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Students Added</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {schoolData?.students_added || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Currently enrolled
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Available Slots</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {remainingSlots}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Remaining capacity
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription className="text-xs">Subscription</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold capitalize">
                          {subscriptionData?.status || 'Inactive'}
                        </div>
                        {subscriptionData?.end_date &&
                      <p className="text-xs text-muted-foreground mt-1">
                            Until {new Date(subscriptionData.end_date).toLocaleDateString()}
                          </p>
                      }
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions + Engagement */}
                  <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
                    <QuickActions
                    onAddStudent={() => setActiveTab("students")}
                    onViewReports={() => setActiveTab("reports")}
                    onViewStudents={() => setActiveTab("students")}
                    schoolId={schoolData?.id} />
                  
                    <StudentEngagement schoolId={schoolData?.id} />
                  </div>

                  {/* Performance Trends */}
                  <PerformanceTrends schoolId={schoolData?.id} />

                  {/* Charts + Top Performers + Activity */}
                  <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
                    <div>
                      {schoolData?.id && <SchoolOverviewCharts schoolId={schoolData.id} />}
                    </div>
                    <div className="space-y-4">
                      <TopPerformers schoolId={schoolData?.id} />
                      <RealtimeActivityFeed schoolId={schoolData?.id} />
                    </div>
                  </div>
                </div>
              }

              {activeTab === "students" && schoolData &&
              <SchoolStudentsManager
                schoolId={schoolData.id}
                schoolCode={schoolData.school_code}
                remainingSlots={remainingSlots}
                onStudentsUpdate={fetchSchoolData} />

              }

              {activeTab === "exams" && schoolData &&
              <div className="relative">
                  {!isPaid && <LockedOverlay featureName="Exam Management" />}
                  <div className={!isPaid ? "pointer-events-none opacity-40 min-h-[300px]" : ""}>
                    <SchoolExamManager schoolId={schoolData.id} />
                  </div>
                </div>
              }

              {activeTab === "mock" && schoolData &&
              <SchoolMockManager schoolId={schoolData.id} />
              }

              {activeTab === "reports" && schoolData &&
              <div className="relative">
                  {!isPaid && <LockedOverlay featureName="Reports & Analytics" />}
                  <div className={!isPaid ? "pointer-events-none opacity-40 min-h-[300px]" : ""}>
                    <div className="space-y-6">
                      <ExportTools
                      schoolId={schoolData.id}
                      schoolName={schoolData.name} />
                    
                      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
                        <ComparisonAnalytics schoolId={schoolData?.id} />
                        <div>
                          <SchoolReports schoolId={schoolData.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }

              {activeTab === "tutorials" &&
              <VideoTutorials />
              }

              {activeTab === "staff" && schoolData &&
              <SchoolStaffManager schoolId={schoolData.id} />
              }

              {activeTab === "billing" && schoolData &&
              <SchoolBilling
                schoolId={schoolData.id}
                currentStudentLimit={schoolData.student_limit} />

              }

              {activeTab === "settings" && schoolData &&
              <SchoolSettings schoolData={schoolData} onUpdate={fetchSchoolData} />
              }
            </div>
          </main>
        </div>
      </div>

      {/* Welcome Modal for New Schools */}
      {schoolData &&
      <WelcomeManualModal
        open={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        schoolName={schoolData.name} />

      }
    </SidebarProvider>);

}