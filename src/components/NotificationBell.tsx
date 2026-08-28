import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useNavigate } from "react-router-dom";

interface NotificationBellProps {
  campus?: boolean;
}

const NotificationBell = ({ campus }: NotificationBellProps) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile?.id) {
      fetchUnreadCount();

      const channel = supabase
        .channel("notification-badge")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userProfile.id}`,
          },
          (payload) => {
            if (!(payload.new as any).is_read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userProfile.id}`,
          },
          (payload) => {
            if ((payload.new as any).is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile?.id]);

  const fetchUnreadCount = async () => {
    if (!userProfile?.id) return;
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userProfile.id)
        .eq("is_read", false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleBellClick = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    navigate(campus ? "/campus/notifications" : "/notifications");
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleBellClick}
      className="relative h-8 w-8 p-0"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-destructive p-0 text-[10px] text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBell;
