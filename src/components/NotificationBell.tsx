import { useState, useEffect } from 'react';
import { Bell, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Card, CardContent } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDistanceToNow } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

const NotificationBell = () => {
  const { userProfile } = useAuth();
  const { hasFreePromoAccess, freeAccessExpiry, freeAccessExpired } = useSubscription();
  const [showSheet, setShowSheet] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile?.id) {
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userProfile.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile?.id]);

  const fetchNotifications = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userProfile?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleBellClick = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    setShowSheet(true);
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleBellClick}
        className="h-8 w-8 p-0 relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-white text-[10px]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="space-y-2 overflow-y-auto h-[calc(85vh-100px)]">
            {hasFreePromoAccess && freeAccessExpiry && (
              <Card className="border-0 shadow-md bg-primary/5 border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" /> Complimentary access active
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have full Edura access until{" "}
                    {new Date(freeAccessExpiry).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    .
                  </p>
                </CardContent>
              </Card>
            )}
            {freeAccessExpired && freeAccessExpiry && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1">Complimentary access ended</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to keep practising with all subjects and mocks.
                  </p>
                </CardContent>
              </Card>
            )}
            {notifications.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (

              notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`border-0 shadow-md cursor-pointer transition-all ${
                    !notification.is_read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default NotificationBell;
