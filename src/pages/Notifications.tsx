import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/edura/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationList, { Notification } from "@/components/notifications/NotificationList";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import { useToast } from "@/hooks/use-toast";
import { getSpecificError } from "@/lib/errors";
import { useNavigate } from "react-router-dom";
import { resolveNotificationRoute } from "@/lib/notificationRoutes";

export default function Notifications() {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchNotifications = async () => {
    // Once auth has settled without a profile there is nothing to wait for —
    // otherwise the inbox would spin forever.
    if (!userProfile?.id) {
      if (!authLoading) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (e) {
      setError(new Error(getSpecificError(e, "notification", "We couldn't load your notifications. Check your connection and try again.")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userProfile?.id, authLoading]);

  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel("candidate-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) => prev.map((item) => item.id === (payload.new as Notification).id ? payload.new as Notification : item));
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((item) => item.id !== (payload.old as Notification).id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      window.dispatchEvent(new Event("edura:notifications-change"));
    } catch (e) {
      toast({
        title: "Could not mark as read",
        description: getSpecificError(e, "notification"),
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!userProfile?.id) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userProfile.id)
        .eq("is_read", false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event("edura:notifications-change"));
    } catch (e) {
      toast({
        title: "Could not mark all as read",
        description: getSpecificError(e, "notification"),
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("edura:notifications-change"));
    } catch (e) {
      toast({
        title: "Could not delete",
        description: getSpecificError(e, "notification"),
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell side="cbt" title="Notifications" subtitle="Your alerts and preferences in one place.">
      <Helmet>
        <title>Notifications | Edura</title>
        <meta name="description" content="Your Edura notification inbox and preferences." />
      </Helmet>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-0">
          <NotificationList
            notifications={notifications}
            loading={loading}
            error={error}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
            onDelete={deleteNotification}
            onRetry={fetchNotifications}
            onOpen={(n) => navigate(resolveNotificationRoute(n, { campus: false }))}
          />
        </TabsContent>
        <TabsContent value="preferences" className="mt-0">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
