import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";
import AIOutput from "@/components/campus/ai/AIOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Building2, CalendarClock, Sparkles, Loader2, Trash2, Printer, ClipboardList, Wand2,
} from "lucide-react";
import { runCampusAI, CampusAIError } from "@/lib/campusAI";

type Kind = "siwes" | "teaching_practice";

const KIND_META: Record<Kind, { title: string; subtitle: string; org: string }> = {
  siwes: {
    title: "SIWES / IT Logbook",
    subtitle: "Record your industrial training daily, keep it supervisor-ready and export the weekly report.",
    org: "Company / organisation",
  },
  teaching_practice: {
    title: "Teaching Practice Diary",
    subtitle: "Log your lessons, classes taught and reflections through your teaching practice.",
    org: "School",
  },
};

const weekOf = (start?: string | null, date?: string) => {
  if (!start || !date) return null;
  const diff = (new Date(date).getTime() - new Date(start).getTime()) / 86400000;
  return diff < 0 ? 1 : Math.floor(diff / 7) + 1;
};

const CampusLogbook = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const kind = ((params.get("kind") as Kind) || "siwes") as Kind;

  const [loading, setLoading] = useState(true);
  const [placement, setPlacement] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);

  // placement form
  const [pOpen, setPOpen] = useState(false);
  const [pForm, setPForm] = useState<any>({});

  // entry form
  const [eOpen, setEOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [hours, setHours] = useState("8");
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // weekly report
  const [report, setReport] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    document.title = `${KIND_META[kind].title} | Edura Campus`;
  }, [kind]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: p } = await supabase
      .from("campus_placements")
      .select("*")
      .eq("user_id", user.id)
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(1);
    const current = p?.[0] ?? null;
    setPlacement(current);
    const { data: e } = await supabase
      .from("campus_logbook_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("kind", kind)
      .order("entry_date", { ascending: false });
    setEntries(e ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, kind]);

  const totalHours = useMemo(
    () => entries.reduce((s, e) => s + Number(e.hours || 0), 0),
    [entries],
  );
  const weeks = useMemo(() => {
    const set = new Set(entries.map((e) => e.week_number).filter(Boolean));
    return set.size;
  }, [entries]);

  const savePlacement = async () => {
    if (!user) return;
    if (!pForm.organisation?.trim()) return toast.error(`Enter the ${KIND_META[kind].org.toLowerCase()}`);
    const payload = { ...pForm, user_id: user.id, kind };
    const { error } = placement
      ? await supabase.from("campus_placements").update(payload).eq("id", placement.id)
      : await supabase.from("campus_placements").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Placement saved");
    setPOpen(false);
    load();
  };

  const polish = async () => {
    if (!notes.trim()) return toast.error("Write a few rough notes first");
    setAiBusy(true);
    setAiText("");
    try {
      await runCampusAI(
        "logbook",
        { kind, notes, date, organisation: placement?.organisation, role: placement?.role_title },
        setAiText,
      );
    } catch (e) {
      toast.error((e as CampusAIError).message);
    } finally {
      setAiBusy(false);
    }
  };

  const saveEntry = async () => {
    if (!user) return;
    const body = (aiText || notes).trim();
    if (!body) return toast.error("Nothing to save yet");
    setSaving(true);
    const titleMatch = aiText.match(/##\s*Title\s*\n+(.+)/);
    const { error } = await supabase.from("campus_logbook_entries").insert({
      user_id: user.id,
      placement_id: placement?.id ?? null,
      kind,
      entry_date: date,
      week_number: weekOf(placement?.start_date, date),
      title: titleMatch?.[1]?.trim() || notes.slice(0, 60),
      activities: body,
      hours: Number(hours) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Entry saved");
    setNotes(""); setAiText(""); setEOpen(false);
    load();
  };

  const removeEntry = async (id: string) => {
    const { error } = await supabase.from("campus_logbook_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const buildWeekly = async () => {
    if (entries.length === 0) return toast.error("Add some entries first");
    const latestWeek = entries[0]?.week_number ?? 1;
    const text = entries
      .filter((e) => (e.week_number ?? 1) === latestWeek)
      .map((e) => `${e.entry_date}: ${e.activities}`)
      .join("\n\n");
    setReportBusy(true);
    setReport("");
    try {
      await runCampusAI("weekly_report", { kind, week: latestWeek, entries: text }, setReport);
    } catch (e) {
      toast.error((e as CampusAIError).message);
    } finally {
      setReportBusy(false);
    }
  };

  const meta = KIND_META[kind];

  return (
    <CampusShell
      title={meta.title}
      subtitle={meta.subtitle}
      action={
        <Button onClick={() => setEOpen(true)} className="gap-2" disabled={!placement}>
          <Plus className="h-4 w-4" /> New entry
        </Button>
      }
    >
      <Tabs
        value={kind}
        onValueChange={(v) => setParams({ kind: v })}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="siwes">SIWES / IT</TabsTrigger>
          <TabsTrigger value="teaching_practice">Teaching Practice</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Placement */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{placement?.organisation || `No ${meta.org.toLowerCase()} yet`}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {placement
                      ? [placement.role_title, placement.location, placement.supervisor_name].filter(Boolean).join(" · ") || "Add your supervisor details"
                      : "Add your placement to start logging."}
                  </p>
                  {placement?.start_date && (
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {new Date(placement.start_date).toLocaleDateString()} —{" "}
                      {placement.end_date ? new Date(placement.end_date).toLocaleDateString() : "ongoing"}
                    </p>
                  )}
                </div>
              </div>
              <Dialog open={pOpen} onOpenChange={(o) => { setPOpen(o); if (o) setPForm(placement || {}); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">{placement ? "Edit placement" : "Add placement"}</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{placement ? "Edit" : "Add"} placement</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    {[
                      { k: "organisation", l: meta.org },
                      { k: "role_title", l: kind === "siwes" ? "Your role / unit" : "Subject & class taught" },
                      { k: "location", l: "Location" },
                      { k: "supervisor_name", l: "Industry / school supervisor" },
                      { k: "supervisor_email", l: "Supervisor email" },
                      { k: "school_supervisor", l: "Institution supervisor" },
                    ].map((f) => (
                      <div key={f.k} className="space-y-1.5">
                        <Label className="text-xs">{f.l}</Label>
                        <Input
                          value={pForm[f.k] || ""}
                          onChange={(e) => setPForm({ ...pForm, [f.k]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Start date</Label>
                        <Input type="date" value={pForm.start_date || ""} onChange={(e) => setPForm({ ...pForm, start_date: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">End date</Label>
                        <Input type="date" value={pForm.end_date || ""} onChange={(e) => setPForm({ ...pForm, end_date: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={savePlacement}>Save placement</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { l: "Entries", v: entries.length },
                { l: "Weeks", v: weeks || (entries.length ? 1 : 0) },
                { l: "Hours", v: totalHours },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                  <p className="mt-1 text-2xl font-bold">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly report */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-primary" /> Weekly report
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={buildWeekly} disabled={reportBusy} className="gap-1.5">
                  {reportBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate
                </Button>
                {!!report && (
                  <Button size="sm" variant="ghost" onClick={() => window.print()} className="gap-1.5">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3">
              <AIOutput text={report} loading={reportBusy} placeholder="Generate a supervisor-ready summary of your latest week." />
            </div>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center">
                <ClipboardList className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No entries yet. Log what you did today — AI will turn your rough notes into a proper entry.
                </p>
              </div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[11px]">
                          {new Date(e.entry_date).toLocaleDateString()}
                        </Badge>
                        {e.week_number && <Badge variant="outline" className="text-[11px]">Week {e.week_number}</Badge>}
                        {!!Number(e.hours) && <Badge variant="outline" className="text-[11px]">{e.hours}h</Badge>}
                      </div>
                      {e.title && <p className="mt-2 font-semibold text-sm">{e.title}</p>}
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeEntry(e.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{e.activities}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New entry dialog */}
      <Dialog open={eOpen} onOpenChange={setEOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New logbook entry</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hours</Label>
                <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">What did you do? (rough notes are fine)</Label>
              <Textarea
                rows={5}
                placeholder={kind === "siwes"
                  ? "helped install network cables, watched them configure the router, learnt about IP addressing..."
                  : "taught JSS2 maths — fractions, marked 32 exercise books, observed a colleague's lesson..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={polish} disabled={aiBusy} className="gap-2">
              {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Polish with AI
            </Button>
            {(aiText || aiBusy) && <AIOutput text={aiText} loading={aiBusy} />}
            <Button onClick={saveEntry} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CampusShell>
  );
};

export default CampusLogbook;
