import { useAuth } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDomainDetection } from "@/hooks/useDomainDetection";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { useAcademicStage } from "@/hooks/useAcademicStage";

import { useIsMobile } from "@/hooks/use-mobile";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";
import { DashboardLayout } from "./DashboardLayout";
import { NativeAppWrapper } from "./NativeAppWrapper";
import LoadingAnimation from "./LoadingAnimation";
import AkboyLoading from "./AkboyLoading";


// Edura Pages
const Home = lazy(() => import("@/pages/Home"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MobileSplash = lazy(() => import("@/pages/MobileSplash"));
const MobileOnboarding = lazy(() => import("@/pages/MobileOnboarding"));
const InstallApp = lazy(() => import("@/pages/InstallApp"));
const AdminPortal = lazy(() => import("@/pages/AdminPortal"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const CBTExam = lazy(() => import("@/pages/CBTExam"));
const TestResults = lazy(() => import("@/pages/TestResults"));
const Demo = lazy(() => import("@/pages/Demo"));
const DemoTest = lazy(() => import("@/pages/DemoTest"));
const Resources = lazy(() => import("@/pages/Resources"));
const ServicesLanding = lazy(() => import("@/pages/ServicesLanding"));
const CampusLanding = lazy(() => import("@/pages/CampusLanding"));
const Payment = lazy(() => import("@/pages/Payment"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const BetaTest = lazy(() => import("@/pages/BetaTest"));

const Privacy = lazy(() => import("@/pages/Privacy"));
const DeleteAccount = lazy(() => import("@/pages/DeleteAccount"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Terms = lazy(() => import("@/pages/Terms"));
const AnswerReview = lazy(() => import("@/pages/AnswerReview"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const StudyHub = lazy(() => import("@/pages/StudyHub"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const StudyDecks = lazy(() => import("@/pages/StudyDecks"));
const StudyDeckView = lazy(() => import("@/pages/StudyDeckView"));
const AITutor = lazy(() => import("@/pages/AITutor"));
const StudyTopic = lazy(() => import("@/pages/StudyTopic"));
const LessonView = lazy(() => import("@/pages/LessonView"));
const Forum = lazy(() => import("@/pages/Forum"));
const ForumNewPost = lazy(() => import("@/pages/ForumNewPost"));
const ForumPost = lazy(() => import("@/pages/ForumPost"));
const ChallengeArena = lazy(() => import("@/pages/ChallengeArena"));
const ChallengeDetail = lazy(() => import("@/pages/ChallengeDetail"));
const ChallengeResults = lazy(() => import("@/pages/ChallengeResults"));
const SchoolRegistration = lazy(() => import("@/pages/SchoolRegistration"));
const SchoolLogin = lazy(() => import("@/pages/SchoolLogin"));
const SchoolSubscription = lazy(() => import("@/pages/SchoolSubscription"));
const SchoolDashboard = lazy(() => import("@/pages/SchoolDashboard"));
const SchoolVerificationPending = lazy(() => import("@/pages/SchoolVerificationPending"));
const SchoolLanding = lazy(() => import("@/pages/SchoolLanding"));
const OfflineExams = lazy(() => import("@/pages/OfflineExams"));
const StudyPlanner = lazy(() => import("@/pages/StudyPlanner"));
const ReferralProgram = lazy(() => import("@/pages/ReferralProgram"));
const PerformanceReport = lazy(() => import("@/pages/PerformanceReport"));
const LessonQuiz = lazy(() => import("@/pages/LessonQuiz"));

const CBTHome = lazy(() => import("@/pages/CBTHome"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));

const Settings = lazy(() => import("@/pages/Settings"));
const ServicesHome = lazy(() => import("@/pages/ServicesHome"));
const Wallet = lazy(() => import("@/pages/Wallet"));
const CampusHome = lazy(() => import("@/pages/campus/CampusHome"));
const CampusAcademics = lazy(() => import("@/pages/campus/CampusAcademics"));
const CampusProjects = lazy(() => import("@/pages/campus/CampusProjects"));
const CampusOpportunities = lazy(() => import("@/pages/campus/CampusOpportunities"));
const CampusJourney = lazy(() => import("@/pages/campus/CampusJourney"));
const CampusTools = lazy(() => import("@/pages/campus/CampusTools"));
const CampusCompanion = lazy(() => import("@/pages/campus/CampusCompanion"));
const CampusLogbook = lazy(() => import("@/pages/campus/CampusLogbook"));
const CampusNysc = lazy(() => import("@/pages/campus/CampusNysc"));
const CampusCareer = lazy(() => import("@/pages/campus/CampusCareer"));
const CampusNotifications = lazy(() => import("@/pages/campus/CampusNotifications"));
const Notifications = lazy(() => import("@/pages/Notifications"));



// Journey-aware home: candidates get the unified home, campus students go to Campus
const DashboardBySide = ({ isInstalledApp }: { isInstalledApp: boolean }) => {
  const { stage, isCampus, loading, resolved } = useAcademicStage();

  // Journey first: only send genuinely new users to onboarding, never during a
  // session restore.
  if (loading) return <LoadingAnimation />;
  if (!stage && resolved) return <Dashboard />;

  // Higher institution students live on Campus only
  if (isCampus) return <Navigate to="/campus" replace />;

  return <Dashboard />;
};


/** Campus routes are for undergraduates & graduates only */
const CampusPremiumGate = lazy(() => import("@/components/campus/CampusPremiumGate"));

const CampusOnly = ({ children }: { children: JSX.Element }) => {
  const { stage, isCampus, loading, resolved } = useAcademicStage();
  if (loading) return <LoadingAnimation />;
  if (!stage && resolved) return <Navigate to="/dashboard" replace />;
  if (!isCampus && stage) return <Navigate to="/dashboard" replace />;
  return children;
};

/** CBT & Services routes are for SS3 / WAEC / JAMB candidates only */
const CoreOnly = ({ children }: { children: JSX.Element }) => {
  const { stage, isCampus, loading, resolved } = useAcademicStage();
  if (loading) return <LoadingAnimation />;
  if (!stage && resolved) return children;
  if (isCampus) return <Navigate to="/campus" replace />;
  return children;
};




// Akboy Pages
const AkboyHome = lazy(() => import("@/pages/akboy/AkboyHome"));
const AkboyCampusHub = lazy(() => import("@/pages/akboy/AkboyCampusHub"));
const AkboyContact = lazy(() => import("@/pages/akboy/AkboyContact"));
const AkboyBlog = lazy(() => import("@/pages/akboy/AkboyBlog"));
const AkboyBlogPost = lazy(() => import("@/pages/akboy/AkboyBlogPost"));
const AkboyAbout = lazy(() => import("@/pages/akboy/AkboyAbout"));
const AkboyServices = lazy(() => import("@/pages/akboy/AkboyServices"));
const AkboyPortfolio = lazy(() => import("@/pages/akboy/AkboyPortfolio"));
const AkboyEvents = lazy(() => import("@/pages/akboy/AkboyEvents"));
const EbookLibrary = lazy(() => import("@/pages/EbookLibrary"));
const EbookReader = lazy(() => import("@/pages/EbookReader"));
const AkboyTutorialRegistration = lazy(() => import("@/pages/akboy/AkboyTutorialRegistration"));
const AkboyMockRegistration = lazy(() => import("@/pages/akboy/AkboyMockRegistration"));
const AkboyMockLogin = lazy(() => import("@/pages/akboy/AkboyMockLogin"));
const AkboyMockExam = lazy(() => import("@/pages/akboy/AkboyMockExam"));
const AkboyMockSubmitted = lazy(() => import("@/pages/akboy/AkboyMockSubmitted"));
const AkboyMockResults = lazy(() => import("@/pages/akboy/AkboyMockResults"));
const AkboyMockPages = lazy(() => import("@/pages/akboy/AkboyMockPages"));
const ReprintAdmitSlip = lazy(() => import("@/pages/akboy/ReprintAdmitSlip"));

/** Wraps an Akboy page so its lazy-load fallback stays Akboy-branded. */
const akboy = (el: JSX.Element) => <Suspense fallback={<AkboyLoading />}>{el}</Suspense>;

// Akboy Routes Component
const AkboyRoutes = () => {
  return (
    <Suspense fallback={<AkboyLoading />}>

      <Routes>
      <Route path="/" element={<AkboyHome />} />
      <Route path="/about" element={<AkboyAbout />} />
      <Route path="/services" element={<AkboyServices />} />
      <Route path="/portfolio" element={<AkboyPortfolio />} />
      <Route path="/events" element={<AkboyEvents />} />
      <Route path="/ebooks" element={<EbookLibrary />} />
      <Route path="/ebooks/:slug" element={<EbookReader />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/contact" element={<AkboyContact />} />

      {/* Registration aliases */}
      <Route path="/register" element={<AkboyTutorialRegistration />} />
      <Route path="/tutorial-registration" element={<AkboyTutorialRegistration />} />
      <Route path="/tutorials/register" element={<AkboyTutorialRegistration />} />

      <Route path="/blog" element={<Navigate to="/campus-hub" replace />} />
      <Route path="/campus-hub" element={<AkboyCampusHub />} />
      <Route path="/blog/:slug" element={<AkboyBlogPost />} />
      <Route path="/mock" element={<AkboyMockPages />} />
      <Route path="/mock-registration" element={<AkboyMockRegistration />} />
      <Route path="/mock-login" element={<AkboyMockLogin />} />
      <Route path="/mock-exam" element={<AkboyMockExam />} />
      <Route path="/mock-submitted" element={<AkboyMockSubmitted />} />
      <Route path="/mock-results" element={<AkboyMockResults />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/reprint-admit-slip" element={<ReprintAdmitSlip />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
};

// Campus Hub standalone routes
const CampusHubRoutes = () => {
  return (
    <Suspense fallback={<AkboyLoading />}>

      <Routes>
      <Route path="/" element={<AkboyCampusHub />} />
      <Route path="/campus-hub" element={<AkboyCampusHub />} />
      <Route path="/blog" element={<Navigate to="/" replace />} />
      <Route path="/blog/:slug" element={<AkboyBlogPost />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

// Edura Routes Component
const EduraRoutes = () => {
  const { isInstalledApp } = useInstalledApp();
  const { user } = useAuth();

  
  return (
    <Suspense fallback={<LoadingAnimation />}>
      <Routes>
      {/* Mobile-specific routes */}
      <Route path="/mobile-splash" element={<MobileSplash />} />
      <Route path="/mobile-onboarding" element={<MobileOnboarding />} />

      {/* Root route */}
      <Route 
        path="/" 
        element={
          isInstalledApp ? <Navigate to="/mobile-splash" replace /> : 
          <Layout><Home /></Layout>
        } 
      />
      
      <Route path="/install-app" element={<Layout><InstallApp /></Layout>} />
      <Route path="/mobile-preview" element={<Navigate to="/mobile-splash" replace />} />

      {/* Beta testing portal - standalone, no auth */}
      <Route path="/test" element={<BetaTest />} />
      <Route path="/test/:code" element={<BetaTest />} />

      
      <Route path="/auth" element={<Layout showNavbar={false}><Auth /></Layout>} />
      <Route path="/reset-password" element={<Layout showNavbar={false}><ResetPassword /></Layout>} />
      <Route path="/choose" element={<Navigate to="/dashboard" replace />} />
      <Route path="/mobile-home" element={<Navigate to="/dashboard" replace />} />
      <Route path="/cbt" element={
        <ProtectedRoute>
          <CoreOnly><CBTHome /></CoreOnly>
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardBySide isInstalledApp={isInstalledApp} />
        </ProtectedRoute>
      } />

      
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminPortal />
        </ProtectedRoute>
      } />
      
      <Route path="/practice" element={
        <ProtectedRoute>
          <Layout showNavbar={false}><CBTExam /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute>
          <Layout showNavbar={false}><TestResults /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/test-results/:attemptId" element={
        <ProtectedRoute>
          <Layout showNavbar={false}><TestResults /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/challenge-results/:attemptId" element={
        <ProtectedRoute>
          <ChallengeResults />
        </ProtectedRoute>
      } />
      <Route path="/exam" element={
        <ProtectedRoute>
          <Layout showNavbar={false}><CBTExam /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/exam/:attemptId" element={
        <ProtectedRoute>
          <Layout showNavbar={false}><CBTExam /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/demo" element={<Layout><Demo /></Layout>} />
      <Route path="/demo-test" element={<Layout showNavbar={false}><DemoTest /></Layout>} />
      
      <Route path="/resources" element={
        <ProtectedRoute>
          <CoreOnly><DashboardLayout><Resources /></DashboardLayout></CoreOnly>
        </ProtectedRoute>
      } />

      <Route path="/services" element={user ? <CoreOnly><ServicesHome /></CoreOnly> : <Layout><ServicesLanding /></Layout>} />
      <Route path="/campus-landing" element={<Layout><CampusLanding /></Layout>} />
      <Route path="/admissions" element={<Navigate to="/services?provider=admission" replace />} />
      <Route path="/campus" element={
        <ProtectedRoute>
          <CampusOnly><CampusHome /></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/campus/academics" element={
        <ProtectedRoute>
          <CampusOnly><CampusAcademics /></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/campus/companion" element={
        <ProtectedRoute>
          <CampusOnly><CampusCompanion /></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/campus/tools" element={

        <ProtectedRoute>
          <CampusOnly><CampusPremiumGate><CampusTools /></CampusPremiumGate></CampusOnly>
        </ProtectedRoute>
      } />

      <Route path="/campus/logbook" element={
        <ProtectedRoute>
          <CampusOnly><CampusPremiumGate><CampusLogbook /></CampusPremiumGate></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/campus/nysc" element={
        <ProtectedRoute>
          <CampusOnly><CampusPremiumGate><CampusNysc /></CampusPremiumGate></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/campus/career" element={
        <ProtectedRoute>
          <CampusOnly><CampusPremiumGate><CampusCareer /></CampusPremiumGate></CampusOnly>
        </ProtectedRoute>
      } />

      <Route path="/campus/projects" element={
        <ProtectedRoute>
          <CampusOnly><CampusPremiumGate><CampusProjects /></CampusPremiumGate></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/campus/opportunities" element={
        <ProtectedRoute>
          <CampusOnly><CampusPremiumGate><CampusOpportunities /></CampusPremiumGate></CampusOnly>
        </ProtectedRoute>
      } />

      <Route path="/campus/journey" element={
        <ProtectedRoute>
          <CampusJourney />
        </ProtectedRoute>
      } />
      <Route path="/campus/notifications" element={
        <ProtectedRoute>
          <CampusOnly><CampusNotifications /></CampusOnly>
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      } />

      
      <Route path="/payment" element={<Layout><Payment /></Layout>} />
      <Route path="/answer-review" element={
        <ProtectedRoute>
          <Layout showNavbar={false}><AnswerReview /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/payment-success" element={<Layout showNavbar={false}><PaymentSuccess /></Layout>} />
      
      <Route path="/ai-tutor" element={
        <ProtectedRoute><AITutor /></ProtectedRoute>
      } />
      <Route path="/decks" element={
        <ProtectedRoute><StudyDecks /></ProtectedRoute>
      } />
      <Route path="/decks/:deckId" element={
        <ProtectedRoute><StudyDeckView /></ProtectedRoute>
      } />
      <Route path="/ai-tutor/:threadId" element={
        <ProtectedRoute><AITutor /></ProtectedRoute>
      } />
      <Route path="/study-hub" element={
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      } />
      <Route path="/study-hub/topic/:topicId" element={
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      } />
      <Route path="/study-hub/lesson/:lessonId" element={
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      } />
      <Route path="/study-hub/lesson/:lessonId/quiz" element={
        <ProtectedRoute>
          <ComingSoon />
        </ProtectedRoute>
      } />
      
      <Route path="/forum" element={
        <ProtectedRoute>
          <Forum />
        </ProtectedRoute>
      } />
      <Route path="/forum/new" element={
        <ProtectedRoute>
          <ForumNewPost />
        </ProtectedRoute>
      } />
      <Route path="/forum/post/:postId" element={
        <ProtectedRoute>
          <ForumPost />
        </ProtectedRoute>
      } />
      
      <Route path="/challenge-arena" element={
        <ProtectedRoute>
          <DashboardLayout><ChallengeArena /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/battle" element={<Navigate to="/challenge-arena" replace />} />
      <Route path="/challenge/:challengeId" element={
        <ProtectedRoute>
          <DashboardLayout><ChallengeDetail /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/schools" element={<Layout showNavbar={false}><SchoolLanding /></Layout>} />
      <Route path="/school-landing" element={<Layout showNavbar={false}><SchoolLanding /></Layout>} />
      <Route path="/school-login" element={<Layout><SchoolLogin /></Layout>} />
      <Route path="/school-registration" element={<Layout><SchoolRegistration /></Layout>} />
      <Route path="/school-subscription" element={
        <ProtectedRoute>
          <SchoolSubscription />
        </ProtectedRoute>
      } />
      <Route path="/school-dashboard" element={
        <ProtectedRoute>
          <SchoolDashboard />
        </ProtectedRoute>
      } />
      <Route path="/school-verification-pending" element={<SchoolVerificationPending />} />
      
      <Route path="/offline-exams" element={
        <ProtectedRoute>
          <Layout><OfflineExams /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/study-planner" element={
        <ProtectedRoute>
          <DashboardLayout><StudyPlanner /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/referral-program" element={
        <ProtectedRoute>
          <DashboardLayout><ReferralProgram /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/performance-report" element={
        <ProtectedRoute>
          <DashboardLayout><PerformanceReport /></DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Blog Routes - shared with Akboy (now Campus Hub) */}
      <Route path="/blog" element={<Navigate to="/campus-hub" replace />} />
      <Route path="/campus-hub" element={<AkboyCampusHub />} />
      <Route path="/blog/:slug" element={<AkboyBlogPost />} />
      
      <Route path="/terms" element={<Layout><Terms /></Layout>} />
      <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
      <Route path="/delete-account" element={<Layout><DeleteAccount /></Layout>} />
      
      {/* AKBOY Routes accessible via /akboy path on Edura domain */}
      <Route path="/akboy" element={akboy(<AkboyHome />)} />
      <Route path="/akboy/about" element={akboy(<AkboyAbout />)} />
      <Route path="/akboy/services" element={akboy(<AkboyServices />)} />
      <Route path="/akboy/portfolio" element={akboy(<AkboyPortfolio />)} />
      <Route path="/akboy/events" element={akboy(<AkboyEvents />)} />
      <Route path="/akboy/ebooks" element={akboy(<EbookLibrary />)} />
      <Route path="/akboy/ebooks/:slug" element={akboy(<EbookReader />)} />
      <Route path="/ebooks" element={akboy(<EbookLibrary />)} />
      <Route path="/ebooks/:slug" element={akboy(<EbookReader />)} />
      <Route path="/akboy/contact" element={akboy(<AkboyContact />)} />
      <Route path="/akboy/blog" element={<Navigate to="/akboy/campus-hub" replace />} />
      <Route path="/akboy/campus-hub" element={akboy(<AkboyCampusHub />)} />
      <Route path="/akboy/blog/:slug" element={akboy(<AkboyBlogPost />)} />

      {/* Registration aliases */}
      <Route path="/akboy/register" element={akboy(<AkboyTutorialRegistration />)} />
      <Route path="/akboy/tutorial-registration" element={akboy(<AkboyTutorialRegistration />)} />
      <Route path="/akboy/tutorials/register" element={akboy(<AkboyTutorialRegistration />)} />

      {/* AKBOY Mock Exam Routes */}
      <Route path="/akboy/mock" element={akboy(<AkboyMockPages />)} />
      <Route path="/akboy/mock-registration" element={akboy(<AkboyMockRegistration />)} />
      <Route path="/akboy/mock-login" element={akboy(<AkboyMockLogin />)} />
      <Route path="/akboy/mock-exam" element={akboy(<AkboyMockExam />)} />
      <Route path="/akboy/mock-submitted" element={akboy(<AkboyMockSubmitted />)} />
      <Route path="/akboy/mock-results" element={akboy(<AkboyMockResults />)} />


      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
    </Suspense>
  );
};

// Main Platform Router
export const PlatformRouter = () => {
  const { isAkboy, isCampusHub } = useDomainDetection();
  const { isInstalledApp } = useInstalledApp();

  // In preview/development we access Akboy pages under the /akboy prefix.
  // In that case we must keep EduraRoutes mounted so /akboy/* routes resolve.
  const hash = window.location.hash.toLowerCase();
  const normalizedHash = hash.replace(/^#!/, '#');
  const isAkboyPrefixedPath = window.location.pathname.startsWith('/akboy') || normalizedHash.startsWith('#/akboy');

  // If accessing from the Campus Hub standalone subdomain, show the standalone hub routes.
  if (isCampusHub && !isAkboyPrefixedPath) {
    return <CampusHubRoutes />;
  }

  // If accessing from the Akboy domain, show Akboy routes
  if (isAkboy && !isAkboyPrefixedPath) {
    return <AkboyRoutes />;
  }

  // Wrap with NativeAppWrapper for installed apps
  if (isInstalledApp) {
    return (
      <NativeAppWrapper>
        <EduraRoutes />
      </NativeAppWrapper>
    );
  }

  return <EduraRoutes />;
};

