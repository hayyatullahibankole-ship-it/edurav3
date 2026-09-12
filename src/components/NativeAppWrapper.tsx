import { ReactNode, useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { useNativeApp } from '@/hooks/useNativeApp';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import eduraLogo from '@/assets/edura-logo.png';

interface NativeAppWrapperProps {
  children: ReactNode;
}

export const NativeAppWrapper = ({ children }: NativeAppWrapperProps) => {
  const { isNative, platform } = useNativeApp();

  // Register for push notifications once, app-wide (no-op on web)
  usePushNotifications();


  useEffect(() => {
    if (!isNative) return;

    const initNativeApp = async () => {
      try {
        // Configure status bar for edge-to-edge (only set icon style)
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setOverlaysWebView({ overlay: true });

        // Hide splash screen after app loads
        await SplashScreen.hide();
      } catch (error) {
        console.log('Native setup error:', error);
      }
    };

    initNativeApp();
  }, [isNative]);

  // Add safe area padding for native apps
  if (isNative) {
    return (
      <div className="min-h-screen bg-background" style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}>
        {/* Native app header with logo - only show on specific screens */}
        {children}
      </div>
    );
  }

  return <>{children}</>;
};