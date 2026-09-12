import { ReactNode, useEffect } from "react";
import Navbar from "./Navbar";
import WhatsAppButton from "./WhatsAppButton";
import { MobileTabBar } from "@/components/edura/AppShell";
import { useNavigate, useLocation } from "react-router-dom";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { useNativeApp } from "@/hooks/useNativeApp";
import { StatusBar, Style } from "@capacitor/status-bar";

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showWhatsAppButton?: boolean;
  showMobileNav?: boolean;
}

const Layout = ({
  children,
  showNavbar = true,
  showWhatsAppButton = true,
  showMobileNav = true,
}: LayoutProps) => {
  const { isInstalledApp } = useInstalledApp();
  const { isNative } = useNativeApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Configure status bar for native apps (edge-to-edge: only set icon style)
  useEffect(() => {
    if (isNative) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    }
  }, [isNative]);

  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname === "/dashboard" || location.pathname === "/mobile-home") return "dashboard";
    if (location.pathname === "/study-hub" || location.pathname === "/dashboard") return "cbt";
    if (location.pathname === "/services" || location.pathname === "/wallet") return "services";
    if (
      location.pathname.includes("profile") ||
      location.search.includes("tab=profile") ||
      location.search.includes("tab=settings")
    )
      return "profile";
    return "dashboard";
  };

  const handleTabChange = (tab: string) => {
    if (tab === "dashboard") {
      navigate(isInstalledApp || isNative ? "/mobile-home" : "/dashboard");
    } else if (tab === "cbt") {
      navigate("/dashboard");
    } else if (tab === "services") {
      navigate("/services");
    } else if (tab === "profile") {
      navigate("/dashboard?tab=profile");
    }
  };

  // ✅ Mobile Navigation: show ONLY for the app (installed PWA OR native app)
  const isAuthRoute = location.pathname === "/auth";
  const shouldShowMobileNav = showMobileNav && !isAuthRoute && (isInstalledApp || isNative);

  return (
    <div className="min-h-screen bg-background">
      {showNavbar && !(isInstalledApp || isNative) && <Navbar />}

      <main className={showNavbar ? "" : "min-h-screen"}>{children}</main>

      {showWhatsAppButton && !(isInstalledApp || isNative) && <WhatsAppButton />}

      {/* Mobile Navigation - Show ONLY for installed apps / native app */}
      {shouldShowMobileNav && (
        <>
          <MobileTabBar />
          {/* Add padding to bottom to prevent content being hidden by nav */}
          <div className="h-20" />
        </>
      )}
    </div>
  );
};

export default Layout;
