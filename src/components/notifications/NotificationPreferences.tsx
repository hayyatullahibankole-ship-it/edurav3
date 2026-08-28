import { useEffect, useState } from "react";
import { Bell, Mail, Loader2, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getSpecificError } from "@/lib/errors";
import { Capacitor } from "@capacitor/core";

interface Preferences {
  email_test_reminders: boolean;
  email_results: boolean;
  email_study_tips: boolean;
  email_subscription_updates: boolean;
  push_notifications: boolean;
}

const emailToggles: { key: keyof Preferences; label: string; description: string }[] = [
  {
    key: "email_test_reminders",
    label: "Test reminders",
    description: "Get reminded before scheduled tests and deadlines.",
  },
  {
    key: "email_results",
    label: "Result alerts",
    description: "Receive an email when your results are ready.",
  },
  {
    key: "email_study_tips",
    label: "Study tips",
    description: "Weekly tips and resources tailored to your stage.",
  },
  {
    key: "email_subscription_updates",
    label: "Subscription updates",
    description: "Billing receipts, renewals and plan changes.",
  },
];

export const NotificationPreferences = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { permissionStatus, requestPermission, isSupported } = usePushNotifications();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchPrefs = async () => {
    if (!userProfile?.id) {
      if (!authLoading) {
        setLoading(false);
        setError(new Error("profile_unavailable"));
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("email_test_reminders, email_results, email_study_tips, email_subscription_updates, push_notifications")
        .eq("user_id", userProfile.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("preferences_missing");
      setPrefs(data as Preferences);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, [userProfile?.id, authLoading]);

  const update = async (key: keyof Preferences, value: boolean) => {
    if (!userProfile?.id || !prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({ [key]: value })
        .eq("user_id", userProfile.id);
      if (error) throw error;
      toast({ title: "Preference saved" });
    } catch (e) {
      setPrefs(prefs);
      toast({
        title: "Could not save",
        description: getSpecificError(e, "preferences"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      const status = await requestPermission();
      if (status === "granted") {
        await update("push_notifications", true);
      } else {
        toast({
          title: "Permission required",
          description: "Enable notifications in your device settings to turn this on.",
          variant: "destructive",
        });
      }
    } else {
      await update("push_notifications", false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading preferences…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">
          {getSpecificError(error, "preferences", "Your notification preferences are not available yet. Refresh your profile and try again.")}
        </p>
        <Button variant="outline" size="sm" onClick={fetchPrefs}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Push notifications</h3>
            <p className="text-sm text-muted-foreground">
              Alerts on your device for results, deadlines and account updates.
            </p>
          </div>
        </div>
        {isSupported ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {permissionStatus === "granted"
                  ? "Notifications enabled on this device"
                  : permissionStatus === "denied"
                  ? "Notifications blocked"
                  : "Ask each time"}
              </span>
            </div>
            <Switch
              checked={!!prefs?.push_notifications && permissionStatus === "granted"}
              onCheckedChange={handlePushToggle}
              disabled={saving || permissionStatus === "denied"}
            />
          </div>
        ) : (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            Push notifications are only available in the installed Edura app.
          </p>
        )}
        {permissionStatus === "denied" && isSupported && (
          <p className="text-xs text-destructive">
            Notifications are blocked. Open your device Settings → Apps → Edura → Notifications to
            re-enable them.
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky/20 text-sky-foreground">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Email updates</h3>
            <p className="text-sm text-muted-foreground">Choose which emails you want from Edura.</p>
          </div>
        </div>
        <div className="space-y-4 pt-1">
          {emailToggles.map((t) => (
            <div key={t.key} className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t.label}</Label>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <Switch
                checked={!!prefs?.[t.key]}
                onCheckedChange={(v) => update(t.key, v)}
                disabled={saving}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default NotificationPreferences;
