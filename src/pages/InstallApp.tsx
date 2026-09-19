import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Play,
  PlusSquare,
  Share,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import eduraLogo from "@/assets/edura-logo.png";
import dashboardPreview from "@/assets/edura-dashboard-mockup.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop";


const benefits = [
  { icon: Zap, title: "Built for speed", copy: "Open practice, lessons and results without waiting." },
  { icon: WifiOff, title: "Offline-ready", copy: "Keep studying when your connection is unreliable." },
  { icon: Bell, title: "Stay on track", copy: "Receive useful reminders for exams and study plans." },
  { icon: ShieldCheck, title: "Safe and current", copy: "Secure sign-in with automatic app updates." },
];

const iphoneSteps = [
  { icon: Share, title: "Tap Share", copy: "In Safari, tap the Share icon at the bottom of your screen." },
  { icon: PlusSquare, title: "Add to Home Screen", copy: "Scroll through the menu and choose Add to Home Screen." },
  { icon: CheckCircle2, title: "Tap Add", copy: "Edura will appear on your Home Screen like your other apps." },
];

export default function InstallApp() {
  const navigate = useNavigate();
  const iphoneSectionRef = useRef<HTMLElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const device = useMemo(() => {
    if (typeof navigator === "undefined") {
      return { platform: "desktop" as Platform, isSafari: false };
    }

    const userAgent = navigator.userAgent;
    const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const platform: Platform = /iPad|iPhone|iPod/.test(userAgent) || isIPadOS
      ? "ios"
      : /Android/i.test(userAgent)
        ? "android"
        : "desktop";
    const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

    return { platform, isSafari };
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const showIphoneGuide = () => {
    iphoneSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const promptBrowserInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const primaryAction = () => {
    if (installed) {
      navigate("/dashboard");
      return;
    }
    if (device.platform === "android") {
      window.location.assign(PLAY_STORE_URL);
      return;
    }
    if (device.platform === "ios") {
      showIphoneGuide();
      return;
    }
    if (deferredPrompt) {
      void promptBrowserInstall();
      return;
    }
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
  };

  const primaryLabel = installed
    ? "Open Edura"
    : device.platform === "android"
      ? "Get it on Google Play"
      : device.platform === "ios"
        ? "Install on this iPhone"
        : deferredPrompt
          ? "Install Edura"
          : "Get it on Google Play";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main>
        <section className="border-b bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-16">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                NOW LIVE ON GOOGLE PLAY
              </div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Take Edura wherever you study.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Practise CBT exams, study your materials and track your progress in one focused student app.
              </p>

              <div className="mt-7 max-w-md space-y-3">
                <Button size="lg" onClick={primaryAction} className="h-14 w-full justify-center gap-3 text-base font-bold sm:w-auto sm:min-w-72">
                  {installed ? <CheckCircle2 className="h-5 w-5" /> : device.platform === "android" || device.platform === "desktop" ? <Play className="h-5 w-5 fill-current" /> : <Download className="h-5 w-5" />}
                  {primaryLabel}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {installed
                    ? "Edura is installed and ready on this device."
                    : device.platform === "android"
                      ? "We recognised your Android device. This opens our official Play Store listing."
                      : device.platform === "ios"
                        ? "We recognised your Apple device. We’ll show you the quick Safari installation steps."
                        : "On Android? This opens our official Google Play listing."}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                {["Free to install", "Automatic updates", "No APK download"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-md border bg-card">
              <img
                src={dashboardPreview}
                alt="Edura app shown on a mobile phone"
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-md border bg-background/95 p-3 shadow-card backdrop-blur">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border bg-card p-1.5">
                  <img src={eduraLogo} alt="" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Edura: Learn & Practise</p>
                  <p className="truncate text-xs text-muted-foreground">CBT • Campus • Study tools</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">FREE</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-background py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-bold text-primary">THE FULL STUDENT EXPERIENCE</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Everything important stays within reach.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="bg-card p-5 sm:p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section ref={iphoneSectionRef} id="iphone-install" className="scroll-mt-20 bg-ink py-12 text-ink-foreground sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Smartphone className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-primary-glow">FOR IPHONE & IPAD</p>
                <h2 className="mt-2 text-3xl font-bold">Install Edura from Safari.</h2>
                <p className="mt-4 leading-7 text-ink-foreground/70">
                  Our App Store release is coming. For now, add the full Edura web app to your Home Screen—complete with its own icon, full-screen view and automatic updates.
                </p>
                {device.platform === "ios" && !device.isSafari && (
                  <div className="mt-5 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm leading-6">
                    You’re using another browser. Open this page in Safari first, then follow the steps.
                  </div>
                )}
              </div>

              <ol className="grid gap-3 sm:grid-cols-3">
                {iphoneSteps.map(({ icon: Icon, title, copy }, index) => (
                  <li key={title} className="relative rounded-md border border-ink-foreground/15 bg-ink-soft p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-glow">STEP {index + 1}</span>
                      <Icon className="h-5 w-5 text-primary-glow" />
                    </div>
                    <h3 className="mt-6 font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-foreground/65">{copy}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-7 border-t border-ink-foreground/15 pt-5 text-sm text-ink-foreground/60">
              Apple does not let websites open the Home Screen confirmation automatically. These three Safari taps are the secure installation process.
            </p>
          </div>
        </section>

        <section className="bg-background py-12 sm:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-primary">ANDROID</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Download the official Play Store app.</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Get verified installation, automatic updates and the Edura experience optimised for your Android phone.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-14 gap-3 font-bold">
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <Play className="h-5 w-5 fill-current" />
                  Get it on Google Play
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              {deferredPrompt && !installed && (
                <Button size="lg" variant="outline" onClick={() => void promptBrowserInstall()} className="h-14 gap-2 font-semibold">
                  Install from browser
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}