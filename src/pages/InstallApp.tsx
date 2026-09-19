import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Smartphone,
  Zap,
  Wifi,
  Bell,
  Shield,
  Clock,
  Star,
  CheckCircle,
  Share,
  PlusSquare,
} from "lucide-react";
import eduraLogo from "@/assets/edura-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// TODO: replace with the live Play Store listing URL once shared
const PLAY_STORE_URL = "";

export default function InstallApp() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const platform = useMemo(() => {
    if (typeof navigator === "undefined") return "other";
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
  }, []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const iosSteps = [
    { icon: Share, text: "Tap the Share button in Safari" },
    { icon: PlusSquare, text: 'Choose "Add to Home Screen"' },
    { icon: CheckCircle, text: "Tap Add — Edura appears on your home screen" },
  ];

  const androidSteps = [
    { icon: Download, text: "Tap Install app below (or browser menu → Install app)" },
    { icon: CheckCircle, text: "Confirm the install prompt" },
    { icon: Zap, text: "Open Edura from your home screen and start practising" },
  ];

  const steps = platform === "ios" ? iosSteps : androidSteps;

  const features = [
    { icon: Zap, text: "Lightning fast performance" },
    { icon: Wifi, text: "Practice offline anytime" },
    { icon: Bell, text: "Get exam reminders" },
    { icon: Shield, text: "Secure & private" },
    { icon: Clock, text: "Accurate exam timing" },
    { icon: Star, text: "Full CBT experience" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Get the App</h1>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
        {/* App Card */}
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/10 border">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center p-2 shrink-0">
            <img src={eduraLogo} alt="Edura" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-xl">Edura CBT</h2>
            <p className="text-muted-foreground text-sm">Your Gateway to Exam Success</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">Free to start</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                NIGERIA ED-TECH
              </span>
            </div>
          </div>
        </div>

        {/* Primary install */}
        {installed ? (
          <div className="p-5 rounded-2xl border bg-emerald-50 text-emerald-900 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-sm">You already have the app installed</p>
              <p className="text-xs mt-1 text-emerald-800">
                Launch Edura from your home screen — it always stays on the latest version.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              size="lg"
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="w-full font-bold text-base py-6 rounded-xl gap-2"
            >
              <Download className="h-5 w-5" />
              {deferredPrompt ? "Install app" : platform === "ios" ? "Add to Home Screen" : "Install from your browser menu"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Installs the latest version instantly — no app store, no APK file, and it updates itself.
            </p>
          </div>
        )}

        {/* How to install */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            {platform === "ios" ? "How to install on iPhone" : "How to install"}
          </h3>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <step.icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Why use the app?</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50">
                <feature.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Play Store note */}
        <div className="p-4 rounded-xl bg-muted/50 border">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Google Play listing coming soon</p>
              <p className="text-xs text-muted-foreground">
                The Play Store version is going through review. Until it’s live, install from your browser — it’s the
                same app and updates automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-4">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>Safe & Secure • Always the latest version</span>
        </div>
      </div>
    </div>
  );
}
