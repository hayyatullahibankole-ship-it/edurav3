import { ThemeProvider } from "next-themes";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { offlineStorage } from "./utils/offlineStorage";
import { useEffect } from "react";
import { PlatformRouter } from "./components/PlatformRouter";
import { AppDownloadPopup } from "./components/AppDownloadPopup";
import { ThemeScope } from "./components/ThemeScope";

// ✅ ADD THIS IMPORT
import { useAndroidBackButton } from "./hooks/useAndroidBackButton";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useOfflineSync(); // Enable offline sync

  // ✅ HANDLE ANDROID BACK BUTTON HERE
  useAndroidBackButton(["/"]); // change "/" if your home route is different

  // Initialize offline storage and cleanup on mount
  useEffect(() => {
    offlineStorage.init().then(() => {
      offlineStorage.cleanupExpiredData();
    });
  }, []);

  return (
    <>
      <ThemeScope />
      <OfflineIndicator />
      <AppDownloadPopup />
      <PlatformRouter />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          {/* shadcn toast system */}
          <ShadcnToaster />

          {/* sonner toast system (used across many pages) */}
          <SonnerToaster />

          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
