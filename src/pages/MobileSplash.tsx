import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import eduraLogo from '@/assets/edura-logo.png';

const MobileSplash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number;

    const go = () => {
      const seen = localStorage.getItem('hasSeenMobileOnboarding');
      navigate(seen ? '/auth' : '/mobile-onboarding', { replace: true });
    };

    const init = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setOverlaysWebView({ overlay: true });
          await SplashScreen.hide();
        }
      } catch {
        /* non-native, ignore */
      }
      timer = window.setTimeout(go, 450);
    };

    init();
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-8">
      <div className="flex flex-col items-center animate-scale-in">
        <div className="rounded-[28px] bg-primary-foreground p-6 shadow-2xl">
          <img src={eduraLogo} alt="Edura" className="h-16 w-auto" />
        </div>

        <h1 className="mt-7 font-display text-4xl font-extrabold tracking-tight text-primary-foreground">
          Edura
        </h1>
        <p className="mt-2 text-sm font-medium text-primary-foreground/75">
          Practice. Apply. Get admitted.
        </p>
      </div>

      {/* Minimal determinate loading bar */}
      <div className="absolute bottom-16 h-1 w-40 overflow-hidden rounded-full bg-primary-foreground/20">
        <div className="h-full w-1/2 animate-loading-sweep rounded-full bg-primary-foreground/80" />
      </div>
    </div>
  );
};

export default MobileSplash;
