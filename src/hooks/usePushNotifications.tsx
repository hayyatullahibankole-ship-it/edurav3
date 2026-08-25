import { useCallback, useEffect, useRef, useState } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Firebase is configured (android/app/google-services.json is present), so native
// push registration is enabled. Web builds are skipped automatically.
const PUSH_ENABLED = true;
const DEVICE_ID_KEY = 'edura_push_device_id';
const ASKED_KEY = 'edura_push_asked';
const CHANNEL_ID = 'edura_default';

export type PushPermission = 'prompt' | 'granted' | 'denied';

const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

const isSafeRoute = (route: unknown): route is string =>
  typeof route === 'string' && route.startsWith('/') && !route.startsWith('//');

export const usePushNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<PushPermission>('prompt');
  const { userProfile } = useAuth();
  const userIdRef = useRef<string | undefined>(userProfile?.id);
  userIdRef.current = userProfile?.id;

  const saveToken = useCallback(async (value: string) => {
    const userId = userIdRef.current;
    if (!userId) return;
    const { error } = await supabase.from('push_devices').upsert(
      {
        user_id: userId,
        token: value,
        platform: Capacitor.getPlatform(),
        device_id: getDeviceId(),
        enabled: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_id' },
    );
    if (error) console.error('Failed to store push token:', error);
  }, []);

  const ensureChannel = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      await PushNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Edura updates',
        description: 'Study reminders, results and account updates',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
      });
    } catch (error) {
      console.log('Notification channel setup skipped:', error);
    }
  }, []);

  // Register listeners once per session.
  useEffect(() => {
    if (!PUSH_ENABLED || !Capacitor.isNativePlatform()) return;
    let handles: { remove: () => void }[] = [];
    let cancelled = false;

    (async () => {
      try {
        const registered = await Promise.all([
          PushNotifications.addListener('registration', (token: Token) => {
            void saveToken(token.value);
          }),
          PushNotifications.addListener('registrationError', (err) => {
            console.error('Push registration error:', err);
          }),
          PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
            // Foreground pushes are not shown by the OS on Android, so mirror
            // them into the device notification panel.
            try {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    id: Math.floor(Math.random() * 100000),
                    title: notification.title || 'Edura',
                    body: notification.body || '',
                    channelId: CHANNEL_ID,
                    extra: notification.data ?? {},
                  },
                ],
              });
            } catch {
              toast.success(notification.title || 'New notification', { description: notification.body });
            }
          }),
          PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            const route = notification.notification.data?.route;
            window.location.hash = isSafeRoute(route) ? `#${route}` : '#/dashboard';
          }),
        ]);
        if (cancelled) {
          registered.forEach((h) => void h.remove());
          return;
        }
        handles = registered;

        try {
          const localTap = await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
            const route = (event.notification.extra as Record<string, unknown> | undefined)?.route;
            if (isSafeRoute(route)) window.location.hash = `#${route}`;
          });
          if (cancelled) void localTap.remove();
          else handles.push(localTap);
        } catch {
          /* local notifications unavailable */
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    })();

    return () => {
      cancelled = true;
      handles.forEach((handle) => void handle.remove());
    };
  }, [saveToken]);

  const enable = useCallback(
    async (interactive: boolean) => {
      if (!PUSH_ENABLED || !Capacitor.isNativePlatform()) {
        if (interactive) toast.error('Push notifications are only available in the installed app');
        return 'denied' as PushPermission;
      }

      await ensureChannel();
      let status = await PushNotifications.checkPermissions();
      if (status.receive === 'prompt' || status.receive === 'prompt-with-rationale') {
        localStorage.setItem(ASKED_KEY, '1');
        status = await PushNotifications.requestPermissions();
      }

      if (status.receive === 'granted') {
        try {
          await LocalNotifications.requestPermissions();
        } catch {
          /* optional */
        }
        setPermissionStatus('granted');
        await PushNotifications.register();
        if (interactive) toast.success('Notifications enabled');
        return 'granted' as PushPermission;
      }

      setPermissionStatus('denied');
      if (interactive) toast.error('Notifications are blocked. Enable them in your device settings.');
      return 'denied' as PushPermission;
    },
    [ensureChannel],
  );

  // First launch: ask once. Later launches: silently re-register to refresh the token.
  useEffect(() => {
    if (!PUSH_ENABLED || !Capacitor.isNativePlatform()) return;
    let cancelled = false;

    (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        if (cancelled) return;

        if (current.receive === 'granted') {
          setPermissionStatus('granted');
          await ensureChannel();
          await PushNotifications.register();
          return;
        }

        if (current.receive === 'denied') {
          setPermissionStatus('denied');
          return;
        }

        if (!localStorage.getItem(ASKED_KEY)) {
          await enable(false);
        }
      } catch (error) {
        console.error('Push permission check failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enable, ensureChannel]);

  const requestPermission = () => enable(true);

  const openSystemSettings = async () => {
    toast.info('Open your device Settings > Apps > Edura > Notifications to re-enable them.');
  };

  const disableNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      if (userProfile?.id) {
        const { error } = await supabase
          .from('push_devices')
          .update({ enabled: false })
          .eq('user_id', userProfile.id)
          .eq('device_id', getDeviceId());
        if (error) throw error;
      }
      setPermissionStatus('denied');
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    }
  };

  // Store the token as soon as the profile becomes available after a cold start.
  useEffect(() => {
    if (!PUSH_ENABLED || !Capacitor.isNativePlatform() || !userProfile?.id) return;
    if (permissionStatus !== 'granted') return;
    void PushNotifications.register();
  }, [userProfile?.id, permissionStatus]);

  return {
    permissionStatus,
    requestPermission,
    disableNotifications,
    openSystemSettings,
    isSupported: Capacitor.isNativePlatform(),
  };
};
