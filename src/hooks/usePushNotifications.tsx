import { useCallback, useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Firebase is configured (android/app/google-services.json is present), so native
// push registration is enabled. Web builds are skipped automatically.
const PUSH_ENABLED = true;
const DEVICE_ID_KEY = 'edura_push_device_id';

const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
};

export const usePushNotifications = () => {
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const { userProfile } = useAuth();

  const initializePushNotifications = useCallback(async () => {
    try {
      const handles = await Promise.all([
        PushNotifications.addListener('registration', async (token: Token) => {
          if (!userProfile?.id) return;
          const { error } = await supabase.from('push_devices').upsert({
            user_id: userProfile.id,
            token: token.value,
            platform: Capacitor.getPlatform(),
            device_id: getDeviceId(),
            enabled: true,
            last_seen_at: new Date().toISOString(),
          }, { onConflict: 'user_id,device_id' });
          if (error) toast.error('Could not save this device for notifications');
        }),
        PushNotifications.addListener('registrationError', () => {
          toast.error('Failed to register for push notifications');
        }),
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          toast.success(notification.title || 'New notification', { description: notification.body });
        }),
        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          const route = typeof notification.notification.data?.route === 'string'
            ? notification.notification.data.route
            : '';
          if (route.startsWith('/') && !route.startsWith('//')) window.location.hash = `#${route}`;
        }),
      ]);
      return () => handles.forEach((handle) => void handle.remove());
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return undefined;
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (!PUSH_ENABLED || !Capacitor.isNativePlatform()) return;
    let cleanup: (() => void) | undefined;
    void initializePushNotifications().then((removeListeners) => {
      cleanup = removeListeners;
    });
    return () => cleanup?.();
  }, [initializePushNotifications]);

  const requestPermission = async () => {
    if (!PUSH_ENABLED || !Capacitor.isNativePlatform()) {
      toast.error('Push notifications are only available in the installed app');
      return;
    }



    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      setPermissionStatus('granted');
      await PushNotifications.register();
      toast.success('Notifications enabled!');
    } else {
      setPermissionStatus('denied');
      toast.error('Notification permission denied');
    }
  };

  const disableNotifications = async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      if (userProfile?.id) {
        const { error } = await supabase
          .from('push_devices')
          .update({ enabled: false })
          .eq('user_id', userProfile.id)
          .eq('device_id', getDeviceId());
        if (error) throw error;
        setPermissionStatus('denied');
      }
      
      toast.success('Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    }
  };

  return {
    permissionStatus,
    requestPermission,
    disableNotifications
  };
};
