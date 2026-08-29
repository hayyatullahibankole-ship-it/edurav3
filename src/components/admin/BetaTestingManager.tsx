import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Plus, Copy, Ban, Star, Download, RefreshCw, Trash2, ImageIcon,
} from "lucide-react";

const TOTAL_DAYS = 5;

type Tester = {
  id: string;
  code: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  redeemed_at: string | null;
  last_active_at: string | null;
  created_at: string;
};

type Report = {
  id: string;
  tester_id: string;
  day_number: number;
  rating: number;
  what_worked: string | null;
  issues: string | null;
  suggestions: string | null;
  device_info: string | null;
  screenshots: string[];
  created_at: string;
};

const makeCode = () =>
  "EDURA-" + Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 6).toUpperCase();

export default function BetaTestingManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [notes, setNotes] = useState<{ day_number: number; focus_note: string }[]>([]);
  const [batch, setBatch] = useState(1);
  const [creating, setCreating] = useState(false);
  const [filterTester, setFilterTester] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [t, r, s] = await Promise.all([
      supabase.from("beta_testers").select("*").order("created_at", { ascending: false }),
      supabase.from("beta_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("beta_settings").select("day_number, focus_note").order("day_number"),
    ]);
    setTesters((t.data as Tester[]) || []);
    setReports((r.data as Report[]) || []);
    setNotes(s.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byTester = useMemo(() => {
    const map = new Map<string, Report[]>();
    reports.forEach((r) => map.set(r.tester_id, [...(map.get(r.tester_id) || []), r]));
    return map;
  }, [reports]);

  const stats = useMemo(() => {
    const active = testers.filter((t) => t.status === "active");
    const expected = active.length * TOTAL_DAYS;
    const avg = reports.length
      ? (reports.reduce((a, r) => a + r.rating, 0) / reports.length).toFixed(1)
      : "—";
    const bugs = reports.filter((r) => (r.issues || "").trim().length > 0).length;
    return {
      testers: testers.length,
      active: active.length,
      participation: expected ? Math.round((reports.length / expected) * 100) : 0,
      avg,
      bugs,
    };
  }, [testers, reports]);

  const createCodes = async () => {
    setCreating(true);
    const rows = Array.from({ length: Math.min(Math.max(batch, 1), 50) }, () => ({ code: makeCode() }));
    const { error } = await supabase.from("beta_testers").insert(rows);
    setCreating(false);
    if (error) {
      toast({ title: "Could not create codes", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${rows.length} invite code${rows.length > 1 ? "s" : ""} created` });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("beta_testers").update({ status }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setTesters((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const removeTester = async (id: string) => {
    const { error } = await supabase.from("beta_testers").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setTesters((p) => p.filter((t) => t.id !== id));
    setReports((p) => p.filter((r) => r.tester_id !== id));
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/test/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Invite link copied", description: url });
  };

  const saveNote = async (day: number, note: string) => {
    const { error } = await supabase
      .from("beta_settings")
      .upsert({ day_number: day, focus_note: note }, { onConflict: "day_number" });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Day ${day} focus saved` });
  };

  const openShot = async (path: string) => {
    const { data, error } = await supabase.storage.from("beta-screenshots").createSignedUrl(path, 300);
    if (error || !data) return toast({ title: "Could not open image", variant: "destructive" });
    window.open(data.signedUrl, "_blank");
  };

  const exportCsv = () => {
    const head = ["Tester", "Email", "Day", "Rating", "What worked", "Issues", "Suggestions", "Device", "Submitted"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = reports.map((r) => {
      const t = testers.find((x) => x.id === r.tester_id);
      return [t?.name || t?.code, t?.email, r.day_number, r.rating, r.what_worked, r.issues, r.suggestions, r.device_info, new Date(r.created_at).toLocaleString()]
        .map(esc).join(",");
    });
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `edura-beta-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const visibleReports = filterTester === "all" ? reports : reports.filter((r) => r.tester_id === filterTester);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Beta Testing</h2>
          <p className="text-sm text-muted-foreground">5-day tester program and daily reports.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Testers", value: `${stats.active}/${stats.testers}` },
          { label: "Participation", value: `${stats.participation}%` },
          { label: "Avg rating", value: stats.avg },
          { label: "Reports with bugs", value: stats.bugs },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="testers">
        <TabsList>
          <TabsTrigger value="testers">Testers</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="focus">Daily focus</TabsTrigger>
        </TabsList>

        <TabsContent value="testers" className="space-y-4 pt-4">
          <Card className="flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="batch">How many codes</Label>
              <Input id="batch" type="number" min={1} max={50} value={batch}
                onChange={(e) => setBatch(Number(e.target.value))} className="w-28" />
            </div>
            <Button onClick={createCodes} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" /> Generate codes</>}
            </Button>
          </Card>

          <div className="space-y-2">
            {testers.map((t) => {
              const count = (byTester.get(t.id) || []).length;
              return (
                <Card key={t.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">{t.code}</code>
                        <Badge variant={t.status === "active" ? "default" : t.status === "revoked" ? "destructive" : "outline"}
                          className="text-[10px] capitalize">{t.status}</Badge>
                        <span className="text-xs text-muted-foreground">{count}/{TOTAL_DAYS} days</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium truncate">{t.name || "Not redeemed yet"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[t.email, t.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {t.last_active_at && (
                        <p className="text-[11px] text-muted-foreground">
                          Last active {new Date(t.last_active_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => copyLink(t.code)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Link
                      </Button>
                      {t.status === "revoked" ? (
                        <Button size="sm" variant="outline" onClick={() => setStatus(t.id, "active")}>Restore</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setStatus(t.id, "revoked")}>
                          <Ban className="h-3.5 w-3.5 mr-1" /> Revoke
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeTester(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {testers.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No testers yet. Generate an invite code above.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterTester}
              onChange={(e) => setFilterTester(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="all">All testers</option>
              {testers.map((t) => (
                <option key={t.id} value={t.id}>{t.name || t.code}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!reports.length}>
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
          </div>

          <div className="space-y-3">
            {visibleReports.map((r) => {
              const t = testers.find((x) => x.id === r.tester_id);
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Day {r.day_number}</Badge>
                      <span className="text-sm font-semibold">{t?.name || t?.code || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating }, (_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {r.what_worked && <p><span className="font-medium">Worked: </span>{r.what_worked}</p>}
                    {r.issues && <p><span className="font-medium">Issues: </span>{r.issues}</p>}
                    {r.suggestions && <p><span className="font-medium">Suggestions: </span>{r.suggestions}</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {r.screenshots?.map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => openShot(s)}>
                        <ImageIcon className="h-3.5 w-3.5 mr-1" /> Screenshot
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {r.device_info} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </Card>
              );
            })}
            {visibleReports.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No reports yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="focus" className="space-y-3 pt-4">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
            const note = notes.find((n) => n.day_number === day)?.focus_note || "";
            return (
              <Card key={day} className="space-y-2 p-4">
                <Label>Day {day} focus</Label>
                <Textarea
                  rows={2}
                  defaultValue={note}
                  onBlur={(e) => e.target.value !== note && saveNote(day, e.target.value)}
                />
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground">Changes save when you click away from the box.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
