import { useEffect, useMemo, useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  Bell,
  CheckCheck,
  Inbox,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getSpecificError } from "@/lib/errors";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface Props {
  notifications: Notification[];
  loading: boolean;
  error: unknown;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onRetry?: () => void;
  /** Called when a row is tapped, after it is marked read. */
  onOpen?: (notification: Notification) => void;
}

type Filter = "all" | "unread";

const groupLabel = (date: string) => {
  const d = parseISO(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMMM yyyy");
};

export const NotificationList = ({
  notifications,
  loading,
  error,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onRetry,
}: Props) => {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const list = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
    return list;
  }, [notifications, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    filtered.forEach((n) => {
      const label = groupLabel(n.created_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading notifications…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          {getSpecificError(error, "notification")}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Bell className="h-7 w-7" />
        </div>
        <p className="text-base font-semibold text-foreground">No notifications yet</p>
        <p className="max-w-xs text-sm">
          Results, deadlines, subscription updates and account alerts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={onMarkAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">No unread notifications</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([label, items]) => (
            <section key={label} className="space-y-2">
              <h4 className="sticky top-0 z-10 bg-background/95 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground backdrop-blur">
                {label}
              </h4>
              <div className="space-y-2">
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onMarkRead={onMarkRead}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationRow = ({
  notification: n,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const time = useMemo(() => {
    try {
      return format(parseISO(n.created_at), "h:mm a");
    } catch {
      return "";
    }
  }, [n.created_at]);

  const handleClick = () => {
    if (!n.is_read) onMarkRead(n.id);
    const route = n.metadata?.route;
    if (typeof route === "string" && route.startsWith("/")) {
      window.location.hash = `#${route}`;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50",
        n.is_read ? "bg-background" : "bg-primary/5 border-primary/20"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          n.is_read ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        <Bell className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold", !n.is_read && "text-foreground")}>{n.title}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{time}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.message}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(n.id);
        }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete notification"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </button>
      {!n.is_read && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" aria-hidden />
      )}
    </div>
  );
};

export default NotificationList;
