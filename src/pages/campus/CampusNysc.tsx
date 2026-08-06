import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Compass, ShieldCheck, Building2, CalendarClock, ExternalLink } from "lucide-react";
import { openExternal } from "@/lib/openExternal";

const PHASES = [
  { key: "pre_mobilisation", label: "Pre-mobilisation" },
  { key: "mobilisation", label: "Mobilisation" },
  { key: "camp", label: "Orientation camp" },
  { key: "ppa", label: "Place of Primary Assignment" },
  { key: "passing_out", label: "Passing out" },
];

const DEFAULT_TASKS: { label: string; phase: string }[] = [
  { label: "Confirm your name and date of birth match your JAMB/WAEC records", phase: "pre_mobilisation" },
  { label: "Get your statement of result / final year clearance", phase: "pre_mobilisation" },
  { label: "Create your NYSC portal account and verify your email", phase: "pre_mobilisation" },
  { label: "Upload passport photograph on white background", phase: "mobilisation" },
  { label: "Complete online registration and print green card", phase: "mobilisation" },
  { label: "Print call-up letter when mobilisation batch is released", phase: "mobilisation" },
  { label: "Pack camp kit: white shorts/T-shirts, waist pouch, meds, drugs receipt", phase: "camp" },
  { label: "Register at camp and collect kit, open NYSC bank account", phase: "camp" },
  { label: "Choose a skill acquisition (SAED) programme", phase: "camp" },
  { label: "Submit posting letter and get acceptance letter at your PPA", phase: "ppa" },
  { label: "Submit monthly clearance every month", phase: "ppa" },
  { label: "Start a Community Development Service (CDS) project", phase: "ppa" },
  { label: "Complete final clearance and collect certificate", phase: "passing_out" },
];

const CampusNysc = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [posting, setPosting] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [newTask, setNewTask] = useState("");

  useEffect(() => { document.title = "NYSC Hub | Edura Campus"; }, []);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [t, p] = await Promise.all([
      supabase.from("campus_nysc_tasks").select("*").eq("user_id", user.id).order("position", { ascending: true }),
      supabase.from("campus_placements").select("*").eq("user_id", user.id).eq("kind", "nysc").limit(1),
    ]);
    let rows = t.data ?? [];
    if (rows.length === 0) {
      const seed = DEFAULT_TASKS.map((d, i) => ({ ...d, user_id: user.id, position: i }));
      const { data } = await supabase.from("campus_nysc_tasks").insert(seed).select();
      rows = data ?? [];
    }
    setTasks(rows);
    setPosting(p.data?.[0] ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const done = tasks.filter((t) => t.is_done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const grouped = useMemo(
    () => PHASES.map((p) => ({ ...p, items: tasks.filter((t) => t.phase === p.key) })),
    [tasks],
  );

  const toggle = async (task: any) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_done: !t.is_done } : t)));
    const { error } = await supabase.from("campus_nysc_tasks").update({ is_done: !task.is_done }).eq("id", task.id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("campus_nysc_tasks").delete().eq("id", id);
  };

  const addTask = async (phase: string) => {
    if (!user || !newTask.trim()) return;
    const { data, error } = await supabase
      .from("campus_nysc_tasks")
      .insert({ user_id: user.id, label: newTask.trim(), phase, position: tasks.length })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setTasks((prev) => [...prev, data]);
    setNewTask("");
  };

  const savePosting = async () => {
    if (!user) return;
    if (!form.organisation?.trim()) return toast.error("Enter your PPA");
    const payload = { ...form, user_id: user.id, kind: "nysc" };
    const { error } = posting
      ? await supabase.from("campus_placements").update(payload).eq("id", posting.id)
      : await supabase.from("campus_placements").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Posting saved");
    setOpen(false);
    load();
  };

  return (
    <CampusShell
      title="NYSC Hub"
      subtitle="Everything from mobilisation to passing out — tracked in one checklist."
      action={
        <Button variant="outline" className="gap-2" onClick={() => openExternal("https://portal.nysc.org.ng")}>
          <ExternalLink className="h-4 w-4" /> NYSC portal
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> Service progress
              </div>
              <Badge variant="secondary">{done}/{tasks.length} done</Badge>
            </div>
            <Progress value={pct} className="mt-4 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">{pct}% of your NYSC journey checklist is complete.</p>
          </div>

          {/* Posting */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{posting?.organisation || "No PPA recorded"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {posting ? [posting.role_title, posting.location].filter(Boolean).join(" · ") || "Add your role and state" : "Add your place of primary assignment."}
                  </p>
                  {posting?.start_date && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      {new Date(posting.start_date).toLocaleDateString()} —{" "}
                      {posting.end_date ? new Date(posting.end_date).toLocaleDateString() : "ongoing"}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setForm(posting || {}); setOpen(true); }}>
                {posting ? "Edit posting" : "Add posting"}
              </Button>
            </div>
          </div>

          {/* Checklist */}
          {grouped.map((g) => (
            <div key={g.key} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Compass className="h-4 w-4 text-primary" /> {g.label}
              </div>
              <ul className="mt-3 space-y-2">
                {g.items.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 rounded-xl border p-3">
                    <Checkbox checked={t.is_done} onCheckedChange={() => toggle(t)} className="mt-0.5" />
                    <span className={`flex-1 text-sm ${t.is_done ? "line-through text-muted-foreground" : ""}`}>{t.label}</span>
                    <button onClick={() => remove(t.id)} aria-label="Remove task">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Add your own step"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask(g.key)}
                />
                <Button variant="outline" size="icon" onClick={() => addTask(g.key)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Place of Primary Assignment</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {[
              { k: "organisation", l: "Organisation" },
              { k: "role_title", l: "Your role" },
              { k: "location", l: "State / LGA" },
              { k: "supervisor_name", l: "Supervisor" },
            ].map((f) => (
              <div key={f.k} className="space-y-1.5">
                <Label className="text-xs">{f.l}</Label>
                <Input value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Resumption</Label>
                <Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Passing out</Label>
                <Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <Button onClick={savePosting}>Save posting</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CampusShell>
  );
};

export default CampusNysc;
