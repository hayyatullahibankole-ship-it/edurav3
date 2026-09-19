import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Smartphone, X } from "lucide-react";
import { useInstalledApp } from "@/hooks/useInstalledApp";
import { PLAY_STORE_URL } from "@/lib/playStore";

const DISMISS_KEY = "edura_playstore_banner_dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // hide for 7 days after dismissal

type Platform = "ios" | "android" | "desktop";

const usePlatform = (): Platform => {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "desktop";
    const userAgent = navigator.userAgent;
    const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (/iPad|iPhone|iPod/.test(userAgent) || isIPadOS) return "ios";
    if (/Android/i.test(userAgent)) return "android";
    return "desktop";
  }, []);
};

export const PlayStoreBanner = () => {
  const navigate = useNavigate();
  const { isInstalledApp } = useInstalledApp();
  const platform = usePlatform();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalledApp) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (!Number.isNaN(dismissedTime) && Date.now() - dismissedTime < DISMISS_DURATION_MS) return;
    }
    setVisible(true);
  }, [isInstalledApp]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleCta = () => {
    if (platform === "android") {
      window.location.assign(PLAY_STORE_URL);
      return;
    }
    navigate("/install-app");
  };

  if (!visible) return null;

  return (
    <div className="relative z-40 bg-ink text-ink-foreground border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5 sm:py-3">
          <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Smartphone className="h-4 w-4 text-primary" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">
              Edura is now on Google Play
            </p>
            <p className="hidden sm:block truncate text-xs text-ink-foreground/60">
              Offline CBT, instant result PINs and your wallet — now in your pocket.
            </p>
          </div>

          <button
            onClick={handleCta}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-ink transition-colors hover:bg-primary-hover"
          >
            <Download className="h-3.5 w-3.5" />
            {platform === "android" ? "Get it on Google Play" : "Get the app"}
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="shrink-0 rounded-md p-1.5 text-ink-foreground/50 transition-colors hover:bg-white/5 hover:text-ink-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayStoreBanner;
