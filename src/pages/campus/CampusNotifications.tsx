import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationList, { Notification } from "@/components/notifications/NotificationList";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";
import { useToast } from "@/hooks/use-toast";
import { getSpecificError } from "@/lib/errors";

export default function CampusNotifications() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchNotifications = async () => {
    if (!userProfile?.id) return;
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
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel("campus-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
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
    } catch (e) {
      toast({
        title: "Could not delete",
        description: getSpecificError(e, "notification"),
        variant: "destructive",
      });
    }
  };

  return (
    <CampusShell title="Notifications" subtitle="Stay on top of results, deadlines and updates.">
      <Helmet>
        <title>Notifications | Edura Campus</title>
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
          />
        </TabsContent>
        <TabsContent value="preferences" className="mt-0">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </CampusShell>
  );
}
