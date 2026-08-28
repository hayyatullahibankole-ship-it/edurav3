import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, FileText, Users } from "lucide-react";

const CATEGORIES = ["scholarship", "internship", "job", "conference", "grant", "training"];
const KINDS = ["note", "past_question", "handout", "slide", "textbook", "other"];

const emptyOpp = {
  title: "", category: "scholarship", organisation: "", summary: "", body: "",
  location: "", amount: "", field: "", level: "", deadline: "", external_url: "",
  is_published: true, is_featured: false,
};

const CampusManager = () => {
  const [opps, setOpps] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [oppOpen, setOppOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyOpp);
  const [matOpen, setMatOpen] = useState(false);
  const [mat, setMat] = useState({ title: "", kind: "note", course_code: "", department: "", level: "", description: "" });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const [o, m, s] = await Promise.all([
      supabase.from("campus_opportunities").select("*").order("created_at", { ascending: false }),
      supabase.from("campus_materials").select("*").eq("is_library", true).order("created_at", { ascending: false }),
      supabase.from("users").select("id, first_name, last_name, email, academic_stage, institution_name, department, study_level")
        .in("academic_stage", ["undergraduate", "graduate"]).limit(200),
    ]);
    setOpps(o.data ?? []);
    setLibrary(m.data ?? []);
    setStudents(s.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = library.filter((m) => m.review_status === "pending" && !m.is_published);

  const openAdminFile = async (path?: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("campus-files").createSignedUrl(path, 600);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const saveOpp = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const payload = { ...form, deadline: form.deadline || null };
    const { error } = form.id
      ? await supabase.from("campus_opportunities").update(payload).eq("id", form.id)
      : await supabase.from("campus_opportunities").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Opportunity saved");
    setForm(emptyOpp);
    setOppOpen(false);
    load();
  };

  const removeOpp = async (id: string) => {
    const { error } = await supabase.from("campus_opportunities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setOpps((prev) => prev.filter((o) => o.id !== id));
  };

  const togglePublished = async (o: any) => {
    await supabase.from("campus_opportunities").update({ is_published: !o.is_published }).eq("id", o.id);
    setOpps((prev) => prev.map((x) => (x.id === o.id ? { ...x, is_published: !x.is_published } : x)));
  };

  const uploadLibrary = async () => {
    if (!file || !mat.title.trim()) return toast.error("Pick a file and title");
    setSaving(true);
    const path = `library/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: upErr } = await supabase.storage.from("campus-files").upload(path, file);
    if (upErr) { setSaving(false); return toast.error(upErr.message); }
    const { error } = await supabase.from("campus_materials").insert({
      ...mat,
      title: mat.title.trim(),
      is_library: true,
      is_published: true,
      file_url: path,
      file_name: file.name,
      file_size: file.size,
      course_code: mat.course_code || null,
      department: mat.department || null,
      level: mat.level || null,
      description: mat.description || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Material published to library");
    setMat({ title: "", kind: "note", course_code: "", department: "", level: "", description: "" });
    setFile(null);
    setMatOpen(false);
    load();
  };

  const removeMaterial = async (id: string) => {
    await supabase.from("campus_materials").delete().eq("id", id);
    setLibrary((prev) => prev.filter((m) => m.id !== id));
  };

  const reviewSubmission = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from("campus_materials")
      .update({
        review_status: approve ? "approved" : "rejected",
        is_published: approve,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approve ? "Published to the library" : "Submission rejected");
    load();
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="opportunities">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions{pending.length > 0 ? ` (${pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="students">Campus students</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="mt-4 space-y-3">
          <Dialog open={oppOpen} onOpenChange={(v) => { setOppOpen(v); if (!v) setForm(emptyOpp); }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> New opportunity</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} opportunity</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Organisation</Label><Input value={form.organisation ?? ""} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></div>
                </div>
                <div><Label>Summary</Label><Textarea rows={2} value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
                <div><Label>Details</Label><Textarea rows={4} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Location</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                  <div><Label>Value / amount</Label><Input value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Field</Label><Input value={form.field ?? ""} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div>
                  <div><Label>Level</Label><Input value={form.level ?? ""} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
                  <div><Label>Deadline</Label><Input type="date" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
                  <div><Label>Apply link</Label><Input value={form.external_url ?? ""} onChange={(e) => setForm({ ...form, external_url: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /> Published
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Featured
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveOpp} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {opps.map((o) => (
                <Card key={o.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{o.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{o.category}{o.organisation ? ` · ${o.organisation}` : ""}</p>
                      </div>
                      <Badge variant={o.is_published ? "default" : "secondary"} className="shrink-0 text-[11px]">
                        {o.is_published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setForm({ ...o, deadline: o.deadline ?? "" }); setOppOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => togglePublished(o)}>{o.is_published ? "Unpublish" : "Publish"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => removeOpp(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {opps.length === 0 && <p className="text-sm text-muted-foreground">No opportunities yet.</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="mt-4 space-y-3">
          <Dialog open={matOpen} onOpenChange={setMatOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Upload className="h-4 w-4" /> Publish material</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader><DialogTitle>Publish to campus library</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Title</Label><Input value={mat.title} onChange={(e) => setMat({ ...mat, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={mat.kind} onValueChange={(v) => setMat({ ...mat, kind: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Course code</Label><Input value={mat.course_code} onChange={(e) => setMat({ ...mat, course_code: e.target.value })} /></div>
                  <div><Label>Department</Label><Input value={mat.department} onChange={(e) => setMat({ ...mat, department: e.target.value })} /></div>
                  <div><Label>Level</Label><Input value={mat.level} onChange={(e) => setMat({ ...mat, level: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Textarea rows={2} value={mat.description} onChange={(e) => setMat({ ...mat, description: e.target.value })} /></div>
                <div><Label>File</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={uploadLibrary} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Publish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid gap-3 md:grid-cols-2">
            {library.filter((m) => m.is_published).map((m) => (
              <Card key={m.id}><CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {String(m.kind).replace("_", " ")}{m.course_code ? ` · ${m.course_code}` : ""}{m.level ? ` · ${m.level}L` : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeMaterial(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent></Card>
            ))}
            {library.filter((m) => m.is_published).length === 0 && <p className="text-sm text-muted-foreground">No library materials yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4 space-y-3">
          {pending.length === 0 && <p className="text-sm text-muted-foreground">No student submissions waiting for review.</p>}
          {pending.map((m) => (
            <Card key={m.id}><CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {String(m.kind).replace("_", " ")}{m.course_code ? ` · ${m.course_code}` : ""}{m.department ? ` · ${m.department}` : ""}
                  </p>
                  {m.description && <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openAdminFile(m.file_url)}>Preview file</Button>
                <Button size="sm" onClick={() => reviewSubmission(m.id, true)}>Approve &amp; publish</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => reviewSubmission(m.id, false)}>Reject</Button>
              </div>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card><CardContent className="p-4">
            <p className="flex items-center gap-2 text-sm font-medium mb-3"><Users className="h-4 w-4" /> {students.length} campus students</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Institution</th><th className="py-2 pr-3">Dept</th><th className="py-2">Level</th>
                </tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">{s.first_name} {s.last_name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.email}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.institution_name || "—"}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.department || "—"}</td>
                      <td className="py-2 whitespace-nowrap">{s.study_level || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <p className="text-sm text-muted-foreground py-4">No campus students yet.</p>}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampusManager;
