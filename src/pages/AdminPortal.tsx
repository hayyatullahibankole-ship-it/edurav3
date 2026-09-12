import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Shield, Users, BookOpen, Settings, BarChart3, LogOut, FileText, DollarSign,
  Gift, Newspaper, MessageCircle, GraduationCap, Sword, Palette, Briefcase,
  CalendarDays, Mail, ClipboardList, CheckCircle, Lock, Upload, Search, Menu,
  Home, ChevronRight, Activity, AlertTriangle, School,
} from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import ExamControl from '@/components/admin/ExamControl';
import QuestionManagement from '@/components/admin/QuestionManagement';
import ResourceManagement from '@/components/admin/ResourceManagement';
import SecurityCenter from '@/components/admin/SecurityCenter';
import AnalyticsHub from '@/components/admin/AnalyticsHub';
import SystemConfig from '@/components/admin/SystemConfig';
import PricingManager from '@/components/admin/PricingManager';
import BlogManager from '@/components/admin/BlogManager';
import CustomerCommunications from '@/components/admin/CustomerCommunications';
import StudyHubManager from '@/components/admin/StudyHubManager';
import ForumManager from '@/components/admin/ForumManager';
import SchoolManagement from '@/components/admin/SchoolManagement';
import ChallengeManager from '@/components/admin/ChallengeManager';
import { CouponManager } from '@/components/admin/CouponManager';
import { AkboyServicesManager } from '@/components/admin/AkboyServicesManager';
import { AkboyPortfolioManager } from '@/components/admin/AkboyPortfolioManager';
import { AkboyEventsManager } from '@/components/admin/AkboyEventsManager';
import { InstitutionLogosManager } from '@/components/admin/InstitutionLogosManager';
import EbooksManager from '@/components/admin/EbooksManager';
import { AkboyInquiriesManager } from '@/components/admin/AkboyInquiriesManager';
import { AkboyTutorialsManager } from '@/components/admin/AkboyTutorialsManager';
import { AkboyRegistrationsManager } from '@/components/admin/AkboyRegistrationsManager';
import { AkboyNewsletterSubscribersManager } from '@/components/admin/AkboyNewsletterSubscribersManager';
import { AkboyProductsManager } from '@/components/admin/AkboyProductsManager';
import { AkboyAmbassadorsManager } from '@/components/admin/AkboyAmbassadorsManager';
import { AkboyPartnerSchoolsManager } from '@/components/admin/AkboyPartnerSchoolsManager';
import { AkboyHomepageManager } from '@/components/admin/AkboyHomepageManager';
import ServiceCatalogManager from '@/components/admin/ServiceCatalogManager';
import InstitutionsManager from '@/components/admin/InstitutionsManager';
import CampusManager from '@/components/admin/CampusManager';
import ServiceRequestsManager from '@/components/admin/ServiceRequestsManager';
import MockExamManager from '@/components/admin/MockExamManager';
import MockResultsManager from '@/components/admin/MockResultsManager';
import SubjectManager from '@/components/admin/SubjectManager';
import { MockExamDashboard } from '@/components/admin/MockExamDashboard';
import { ExamDayVerification } from '@/components/admin/ExamDayVerification';
import BetaTestingManager from '@/components/admin/BetaTestingManager';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

type NavItem = { key: string; label: string; icon: any };
type NavSection = { label: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: Home },
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Edura CBT',
    items: [
      { key: 'users', label: 'Users', icon: Users },
      { key: 'schools', label: 'Schools', icon: School },
      { key: 'exams', label: 'Exams', icon: BookOpen },
      { key: 'questions', label: 'Question Bank', icon: FileText },
      { key: 'subjects', label: 'Subjects', icon: BookOpen },
      { key: 'resources', label: 'Resources', icon: Upload },
      { key: 'study-hub', label: 'Study Hub', icon: GraduationCap },
      { key: 'forum', label: 'Forum', icon: MessageCircle },
      { key: 'challenges', label: 'Challenges', icon: Sword },
    ],
  },
  {
    label: 'Mock Exams',
    items: [
      { key: 'mock-exam', label: 'Mock Exam', icon: FileText },
      { key: 'mock-results', label: 'Results', icon: GraduationCap },
      { key: 'mock-dashboard', label: 'Student Batches', icon: Users },
      { key: 'exam-verification', label: 'Verify Students', icon: CheckCircle },
    ],
  },
  {
    label: 'Akboy',
    items: [
      { key: 'akboy-homepage', label: 'Homepage', icon: Home },
      { key: 'akboy-services', label: 'Services', icon: Palette },
      { key: 'akboy-products', label: 'Products', icon: Briefcase },
      { key: 'akboy-ambassadors', label: 'Ambassadors', icon: Users },
      { key: 'akboy-partner-schools', label: 'Partner Schools', icon: School },
      { key: 'akboy-portfolio', label: 'Portfolio', icon: Briefcase },
      { key: 'akboy-events', label: 'Events', icon: CalendarDays },
      { key: 'akboy-ebooks', label: 'Ebooks', icon: BookOpen },
      { key: 'akboy-tutorials', label: 'Tutorials', icon: GraduationCap },
      { key: 'akboy-registrations', label: 'Registrations', icon: ClipboardList },
      { key: 'akboy-inquiries', label: 'Inquiries', icon: Mail },
      { key: 'akboy-newsletter', label: 'Subscribers', icon: Mail },
      { key: 'institution-logos', label: 'Institution Logos', icon: School },
    ],
  },
  {
    label: 'Commerce & Content',
    items: [
      { key: 'edu-services', label: 'Educational Services', icon: Briefcase },
      { key: 'service-requests', label: 'Service Requests', icon: ClipboardList },
      { key: 'institutions', label: 'Institutions & Fees', icon: School },
      { key: 'campus', label: 'Edura Campus', icon: GraduationCap },
      { key: 'pricing', label: 'Pricing', icon: DollarSign },
      { key: 'promos', label: 'Promo Codes', icon: Gift },
      { key: 'blog', label: 'Blog', icon: Newspaper },
      { key: 'communications', label: 'Communications', icon: MessageCircle },
    ],
  },
  {
    label: 'System',
    items: [
      { key: 'beta-testing', label: 'Beta Testing', icon: ClipboardList },
      { key: 'security', label: 'Security', icon: Lock },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];


export default function AdminPortal() {
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const validKeys = useMemo(() => NAV.flatMap(s => s.items.map(i => i.key)), []);
  const tabParam = searchParams.get('section') || '';
  const activeKey = validKeys.includes(tabParam) ? tabParam : 'dashboard';
  const setActiveKey = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', key);
    setSearchParams(next);
  };
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);


  const [stats, setStats] = useState({
    totalUsers: 0,
    activeExams: 0,
    totalAttempts: 0,
    suspiciousActivities: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) fetchAdminData();
  }, [isAdmin]);

  const fetchAdminData = async () => {
    try {
      const [usersResp, examsResp, attemptsResp] = await Promise.all([
        supabase.rpc('get_users_masked'),
        supabase.from('exams').select('*'),
        supabase.from('attempts').select(`*, users(first_name, last_name, email), exams(title)`)
          .order('created_at', { ascending: false }).limit(8),
      ]);
      setStats({
        totalUsers: usersResp.data?.length || 0,
        activeExams: examsResp.data?.filter((e: any) => e.is_published).length || 0,
        totalAttempts: attemptsResp.data?.length || 0,
        suspiciousActivities: attemptsResp.data?.filter((a: any) => a.suspicious_activity_count > 0).length || 0,
      });
      setUsers(usersResp.data || []);
      setRecentActivities(attemptsResp.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to load admin data', variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); navigate('/admin/login'); } catch (e) { console.error(e); }
  };

  const filteredNav = useMemo(() => {
    if (!search.trim()) return NAV;
    const q = search.toLowerCase();
    return NAV.map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(s => s.items.length);
  }, [search]);

  const activeMeta = useMemo(() => {
    for (const s of NAV) {
      const m = s.items.find(i => i.key === activeKey);
      if (m) return { section: s.label, item: m };
    }
    return { section: 'Overview', item: NAV[0].items[0] };
  }, [activeKey]);

  const renderContent = () => {
    switch (activeKey) {
      case 'dashboard': return <DashboardOverview stats={stats} activities={recentActivities} />;
      case 'users': return <UserManagement users={users} onRefresh={fetchAdminData} />;
      case 'exams': return <ExamControl />;
      case 'questions': return <QuestionManagement />;
      case 'subjects': return <SubjectManager />;
      case 'resources': return <ResourceManagement />;
      case 'security': return <SecurityCenter suspiciousActivities={recentActivities.filter((a: any) => a.suspicious_activity_count > 0)} />;
      case 'analytics': return <AnalyticsHub />;
      case 'edu-services': return <ServiceCatalogManager />;
      case 'service-requests': return <ServiceRequestsManager />;
      case 'institutions': return <InstitutionsManager />;
      case 'campus': return <CampusManager />;
      case 'pricing': return <PricingManager />;
      case 'promos': return <CouponManager />;
      case 'schools': return <SchoolManagement />;
      case 'communications': return <CustomerCommunications users={users} />;
      case 'study-hub': return <StudyHubManager />;
      case 'forum': return <ForumManager />;
      case 'challenges': return <ChallengeManager />;
      case 'beta-testing': return <BetaTestingManager />;
      case 'settings': return <SystemConfig />;

      case 'akboy-homepage': return <AkboyHomepageManager />;
      case 'akboy-services': return <AkboyServicesManager />;
      case 'akboy-products': return <AkboyProductsManager />;
      case 'akboy-ambassadors': return <AkboyAmbassadorsManager />;
      case 'akboy-partner-schools': return <AkboyPartnerSchoolsManager />;
      case 'akboy-portfolio': return <AkboyPortfolioManager />;
      case 'akboy-events': return <AkboyEventsManager />;
      case 'institution-logos': return <InstitutionLogosManager />;
      case 'akboy-ebooks': return <EbooksManager />;
      case 'akboy-inquiries': return <AkboyInquiriesManager />;
      case 'akboy-newsletter': return <AkboyNewsletterSubscribersManager />;
      case 'akboy-tutorials': return <AkboyTutorialsManager />;
      case 'akboy-registrations': return <AkboyRegistrationsManager />;
      case 'mock-exam': return <MockExamManager />;
      case 'mock-results': return <MockResultsManager />;
      case 'mock-dashboard': return <MockExamDashboard />;
      case 'exam-verification': return <ExamDayVerification />;
      case 'blog': return <BlogManager />;
      default: return null;
    }
  };

  if (!isAdmin) return null;

  const SidebarBody = () => (
    <div className="flex h-full w-full flex-col bg-white border-r border-slate-200">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
        <div className="h-9 w-9 rounded-lg bg-slate-900 grid place-items-center">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">Edura Admin</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Control Center</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Jump to section"
            className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-8 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {filteredNav.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { setActiveKey(item.key); setMobileOpen(false); }}
                    className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredNav.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400">No sections match “{search}”</p>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-900">{user?.email}</p>
            <p className="text-[10px] text-slate-500">Administrator</p>
          </div>
          <Button
            onClick={handleSignOut}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:flex">
        <SidebarBody />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs border-0 bg-white p-0">
          <SidebarBody />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex min-w-0 items-center gap-1.5 text-sm">
                <span className="hidden text-slate-400 sm:inline">{activeMeta.section}</span>
                <ChevronRight className="hidden h-3.5 w-3.5 text-slate-300 sm:inline" />
                <span className="truncate font-semibold text-slate-900">{activeMeta.item.label}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 overflow-x-hidden p-3 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

/* ====================== Dashboard Overview (flat, no gradients) ====================== */
function DashboardOverview({ stats, activities }: { stats: any; activities: any[] }) {
  const metrics = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Active Exams', value: stats.activeExams, icon: BookOpen },
    { label: 'Recent Attempts', value: stats.totalAttempts, icon: Activity },
    { label: 'Security Alerts', value: stats.suspiciousActivities, icon: AlertTriangle, alert: true },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">A quick look at your platform health.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">{m.label}</p>
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${m.alert ? 'bg-rose-50' : 'bg-slate-100'}`}>
                  <Icon className={`h-3.5 w-3.5 ${m.alert ? 'text-rose-600' : 'text-slate-600'}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl">{m.value}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          <p className="text-xs text-slate-500">Latest exam attempts across the platform</p>
        </div>
        <div className="divide-y divide-slate-100">
          {activities.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-500">No recent activity</div>
          )}
          {activities.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                  {a.users?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-900">
                    <span className="font-medium">{a.users?.first_name} {a.users?.last_name}</span>
                    <span className="text-slate-500"> attempted </span>
                    <span className="font-medium">{a.exams?.title || 'Exam'}</span>
                  </p>
                  <p className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
              {a.suspicious_activity_count > 0 && (
                <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-[10px] text-rose-700">
                  Flagged
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

