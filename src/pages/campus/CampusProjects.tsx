import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";
import ProjectAssistant from "@/components/campus/ai/ProjectAssistant";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, CalendarClock, MessageSquare } from "lucide-react";

const STAGES = ["proposal", "chapter_1", "chapter_2", "chapter_3", "chapter_4", "chapter_5", "defence", "completed"];
const DEFAULT_MILESTONES = ["Proposal approval", "Chapter One", "Chapter Two", "Chapter Three", "Chapter Four", "Chapter Five", "Defence"];

const CampusProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", topic: "", supervisor: "", deadline: "" });
  const [newMilestone, setNewMilestone] = useState("");

  useEffect(() => { document.title = "Project Hub | Edura Campus"; }, []);

  const load = async (preferId?: string) => {
    if (!user) return;
    const { data } = await supabase.from("campus_projects").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setProjects(list);
    const p = list.find((x: any) => x.id === (preferId ?? project?.id)) ?? list[0] ?? null;
    setProject(p);
    if (p) {
      const { data: ms } = await supabase.from("campus_project_milestones").select("*")
        .eq("project_id", p.id).order("position");
      setMilestones(ms ?? []);
    } else {
      setMilestones([]);
    }
  };

  const selectProject = async (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setProject(p);
    const { data: ms } = await supabase.from("campus_project_milestones").select("*")
      .eq("project_id", id).order("position");
    setMilestones(ms ?? []);
  };

  const deleteProject = async () => {
    if (!project) return;
    if (!window.confirm(`Delete "${project.title}" and all its milestones?`)) return;
    await supabase.from("campus_project_milestones").delete().eq("project_id", project.id);
    const { error } = await supabase.from("campus_projects").delete().eq("id", project.id);
    if (error) return toast.error(error.message);
    toast.success("Project deleted");
    setProject(null);
    load();
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const createProject = async () => {
    if (!user || !form.title.trim()) return toast.error("Give your project a title");
    setSaving(true);
    const { data, error } = await supabase.from("campus_projects").insert({
      user_id: user.id,
      title: form.title.trim(),
      topic: form.topic.trim() || null,
      supervisor: form.supervisor.trim() || null,
      deadline: form.deadline || null,
    }).select().single();
    if (error) { setSaving(false); return toast.error(error.message); }
    await supabase.from("campus_project_milestones").insert(
      DEFAULT_MILESTONES.map((title, i) => ({ user_id: user.id, project_id: data.id, title, position: i }))
    );
    setSaving(false);
    setOpen(false);
    setForm({ title: "", topic: "", supervisor: "", deadline: "" });
    toast.success("Project created");
    load(data.id);
  };

  const toggleMilestone = async (m: any) => {
    const { error } = await supabase.from("campus_project_milestones").update({ is_done: !m.is_done }).eq("id", m.id);
    if (error) return toast.error(error.message);
    setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_done: !x.is_done } : x)));
  };

  const addMilestone = async () => {
    if (!user || !project || !newMilestone.trim()) return;
    const { data, error } = await supabase.from("campus_project_milestones").insert({
      user_id: user.id, project_id: project.id, title: newMilestone.trim(), position: milestones.length,
    }).select().single();
    if (error) return toast.error(error.message);
    setMilestones((prev) => [...prev, data]);
    setNewMilestone("");
  };

  const removeMilestone = async (id: string) => {
    await supabase.from("campus_project_milestones").delete().eq("id", id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const updateStage = async (stage: string) => {
    if (!project) return;
    await supabase.from("campus_projects").update({ stage }).eq("id", project.id);
    setProject({ ...project, stage });
  };

  const saveNotes = async (notes: string) => {
    if (!project) return;
    setProject({ ...project, notes });
    await supabase.from("campus_projects").update({ notes }).eq("id", project.id);
  };

  const done = milestones.filter((m) => m.is_done).length;
  const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;

  return (
    <CampusShell
      title="Project Hub"
      subtitle="Plan your final year project from proposal to defence."
      action={
        (
          <div className="flex items-center gap-2">
          {projects.length > 1 && (
            <Select value={project?.id} onValueChange={selectProject}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Switch project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> New project</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader><DialogTitle>Start your project</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Project title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Topic area</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
                <div><Label>Supervisor</Label><Input value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} /></div>
                <div><Label>Submission deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button onClick={createProject} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        )
      }
    >
      {!project ? (
        <Card><CardContent className="p-10 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No project yet. Create one and Edura will set up your chapter milestones automatically so you always know what's next.
          </p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-12">
          <Card className="md:col-span-7">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">{project.title}</h2>
                  {project.topic && <p className="text-sm text-muted-foreground">{project.topic}</p>}
                </div>
                <Select value={project.stage} onValueChange={updateStage}>
                  <SelectTrigger className="w-[150px] shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{done} of {milestones.length} milestones done</span><span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>

              <ul className="mt-5 space-y-2">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    <Checkbox checked={m.is_done} onCheckedChange={() => toggleMilestone(m)} />
                    <span className={`text-sm flex-1 min-w-0 truncate ${m.is_done ? "line-through text-muted-foreground" : ""}`}>{m.title}</span>
                    {m.due_date && (
                      <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />{new Date(m.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => removeMilestone(m.id)} aria-label="Remove milestone">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-2">
                <Input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} placeholder="Add a milestone" />
                <Button variant="outline" onClick={addMilestone}>Add</Button>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-5 grid gap-4 content-start">
            <Card><CardContent className="p-5">
              <p className="text-sm font-medium">Supervision</p>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Supervisor:</span> {project.supervisor || "—"}</p>
                <p><span className="text-muted-foreground">Deadline:</span> {project.deadline ? new Date(project.deadline).toLocaleDateString() : "—"}</p>
                <Badge variant="secondary" className="capitalize">{String(project.stage).replace("_", " ")}</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full text-destructive" onClick={deleteProject}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete project
              </Button>
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <p className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Supervisor notes</p>
              <Textarea
                rows={6}
                className="mt-3"
                placeholder="Record corrections and feedback after each meeting…"
                value={project.notes ?? ""}
                onChange={(e) => setProject({ ...project, notes: e.target.value })}
                onBlur={(e) => saveNotes(e.target.value)}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">Saved automatically when you click away.</p>
            </CardContent></Card>
          </div>

          <ProjectAssistant project={project} onMilestonesChanged={load} />
        </div>

      )}
    </CampusShell>
  );
};

export default CampusProjects;
