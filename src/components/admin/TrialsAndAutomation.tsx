import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Bell, Play, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Rule {
  id: string;
  rule_key: string;
  label: string;
  category: string;
  description: string | null;
  enabled: boolean;
  run_window: string;
  last_run_at: string | null;
  last_sent_count: number;
  total_sent_count: number;
}

export default function TrialsAndAutomation() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [trialDays, setTrialDays] = useState("30");
  const [masterOn, setMasterOn] = useState(true);
  const [stats, setStats] = useState({ active: 0, endingSoon: 0, expired: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantDays, setGrantDays] = useState("30");
  const [granting, setGranting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [rulesRes, settingsRes] = await Promise.all([
      supabase.from("notification_rules").select("*").order("category").order("priority"),
      supabase.from("system_settings").select("key, value").in("key", ["trial_days", "notifications_enabled"]),
    ]);
    setRules((rulesRes.data as Rule[]) || []);
    const s = Object.fromEntries((settingsRes.data || []).map((r: any) => [r.key, r.value]));
    setTrialDays(s.trial_days || "30");
    setMasterOn(s.notifications_enabled !== "false");

    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const [active, endingSoon, expired, paid] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true })
        .not("trial_started_at", "is", null).gte("free_access_expiry_date", today),
      supabase.from("users").select("id", { count: "exact", head: true })
        .not("trial_started_at", "is", null).gte("free_access_expiry_date", today).lte("free_access_expiry_date", soon),
      supabase.from("users").select("id", { count: "exact", head: true })
        .not("trial_started_at", "is", null).lt("free_access_expiry_date", today),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    ]);
    setStats({
      active: active.count || 0,
      endingSoon: endingSoon.count || 0,
      expired: expired.count || 0,
      paid: paid.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("system_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) return toast.error("Could not save setting");
    toast.success("Saved");
  };

  const toggleRule = async (rule: Rule, enabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled } : r)));
    const { error } = await supabase.from("notification_rules").update({ enabled }).eq("id", rule.id);
    if (error) {
      toast.error("Could not update rule");
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !enabled } : r)));
    }
  };

  const runEngine = async (window: "evening" | "morning", dryRun: boolean) => {
    setRunning(`${window}-${dryRun}`);
    const { data, error } = await supabase.functions.invoke("notification-engine", {
      body: { window, dryRun },
    });
    setRunning(null);
    if (error) return toast.error("Run failed", { description: error.message });
    if (dryRun) toast.success(`Dry run: ${data?.would_send ?? 0} notifications would be sent`);
    else {
      toast.success(`Sent ${data?.sent ?? 0} notifications`);
      load();
    }
  };

  const grantTrial = async () => {
    if (!grantEmail.trim()) return;
    setGranting(true);
    const days = parseInt(grantDays) || 30;
    const expiry = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const { error, count } = await supabase
      .from("users")
      .update({
        free_practice_access: true,
        free_access_expiry_date: expiry,
        trial_started_at: new Date().toISOString(),
        trial_source: "admin",
      }, { count: "exact" })
      .eq("email", grantEmail.trim().toLowerCase());
    setGranting(false);
    if (error) return toast.error("Could not grant trial", { description: error.message });
    if (!count) return toast.error("No user found with that email");
    toast.success(`${days}-day access granted to ${grantEmail}`);
    setGrantEmail("");
    load();
  };

  const grouped = rules.reduce<Record<string, Rule[]>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trials">
        <TabsList>
          <TabsTrigger value="trials"><Gift className="mr-2 h-4 w-4" />Free trials</TabsTrigger>
          <TabsTrigger value="automation"><Bell className="mr-2 h-4 w-4" />Automated</TabsTrigger>
        </TabsList>

        <TabsContent value="trials" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Active trials", value: stats.active },
              { label: "Ending in 7 days", value: stats.endingSoon },
              { label: "Expired trials", value: stats.expired },
              { label: "Paid subscriptions", value: stats.paid },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{loading ? "—" : s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trial length</CardTitle>
              <CardDescription>Applies to every new account from now on.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trial-days">Days</Label>
                <Input
                  id="trial-days"
                  type="number"
                  min={0}
                  max={365}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="w-28"
                />
              </div>
              <Button onClick={() => saveSetting("trial_days", String(parseInt(trialDays) || 30))}>
                Save
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grant or extend access</CardTitle>
              <CardDescription>Give a specific student free access by email.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1 space-y-1.5">
                <Label htmlFor="grant-email">Student email</Label>
                <Input
                  id="grant-email"
                  type="email"
                  placeholder="student@example.com"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grant-days">Days</Label>
                <Input
                  id="grant-days"
                  type="number"
                  min={1}
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  className="w-24"
                />
              </div>
              <Button onClick={grantTrial} disabled={granting}>
                {granting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Grant
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Automated notifications</CardTitle>
                <CardDescription>
                  Runs daily at 7:00 PM and 7:30 AM (Lagos). Max one scheduled message per student per day.
                </CardDescription>
              </div>
              <Switch
                checked={masterOn}
                onCheckedChange={(v) => {
                  setMasterOn(v);
                  saveSetting("notifications_enabled", v ? "true" : "false");
                }}
              />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => runEngine("evening", true)} disabled={!!running}>
                {running === "evening-true" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Preview evening run
              </Button>
              <Button size="sm" onClick={() => runEngine("evening", false)} disabled={!!running}>
                {running === "evening-false" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run evening now
              </Button>
              <Button variant="outline" size="sm" onClick={() => runEngine("morning", false)} disabled={!!running}>
                Run morning now
              </Button>
            </CardContent>
          </Card>

          {Object.entries(grouped).map(([category, list]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">{category}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {list.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{rule.label}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{rule.run_window}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{rule.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {rule.last_run_at
                          ? `Last run ${formatDistanceToNow(new Date(rule.last_run_at), { addSuffix: true })} · ${rule.last_sent_count} sent`
                          : "Not run yet"}
                        {rule.total_sent_count > 0 && ` · ${rule.total_sent_count} total`}
                      </p>
                    </div>
                    <Switch checked={rule.enabled} onCheckedChange={(v) => toggleRule(rule, v)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
