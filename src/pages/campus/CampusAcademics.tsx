import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAcademicStage } from "@/hooks/useAcademicStage";
import CampusShell from "@/components/campus/CampusShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Upload, FileText, Download, BookOpen, Loader2 } from "lucide-react";

const SEMESTERS = ["First", "Second"];
const KINDS = ["note", "past_question", "handout", "slide", "textbook", "other"];

const CampusAcademics = () => {
  const { user } = useAuth();
  const { department, study_level } = useAcademicStage();
  const [courses, setCourses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", units: "3", semester: "First", lecturer: "" });
  const [upload, setUpload] = useState({ title: "", kind: "note", course_id: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [contribute, setContribute] = useState({ title: "", kind: "note", course_code: "", description: "" });
  const [contributeFile, setContributeFile] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Academics | Edura Campus";
  }, []);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [c, m, l, sub] = await Promise.all([
      supabase.from("campus_courses").select("*").eq("user_id", user.id).order("code"),
      supabase.from("campus_materials").select("*").eq("user_id", user.id).eq("is_library", false)
        .order("created_at", { ascending: false }),
      supabase.from("campus_materials").select("*").eq("is_library", true).eq("is_published", true)
        .order("created_at", { ascending: false }).limit(50),
      supabase.from("campus_materials").select("*").eq("submitted_by", user.id).eq("is_library", true)
        .order("created_at", { ascending: false }).limit(20),
    ]);
    setCourses(c.data ?? []);
    setMaterials(m.data ?? []);
    setLibrary(l.data ?? []);
    setSubmissions(sub.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  const addCourse = async () => {
    if (!user || !form.code.trim() || !form.title.trim()) {
      toast.error("Course code and title are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("campus_courses").insert({
      user_id: user.id,
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      units: Number(form.units) || 0,
      semester: form.semester,
      lecturer: form.lecturer.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Course added");
    setForm({ code: "", title: "", units: "3", semester: "First", lecturer: "" });
    setCourseOpen(false);
    load();
  };

  const removeCourse = async (id: string) => {
    const { error } = await supabase.from("campus_courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const uploadMaterial = async () => {
    if (!user || !file || !upload.title.trim()) {
      toast.error("Pick a file and give it a title");
      return;
    }
    setSaving(true);
    const path = `${user.id}/materials/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: upErr } = await supabase.storage.from("campus-files").upload(path, file);
    if (upErr) {
      setSaving(false);
      return toast.error(upErr.message);
    }
    const { error } = await supabase.from("campus_materials").insert({
      user_id: user.id,
      title: upload.title.trim(),
      kind: upload.kind,
      course_id: upload.course_id || null,
      course_code: courses.find((c) => c.id === upload.course_id)?.code ?? null,
      description: upload.description.trim() || null,
      file_url: path,
      file_name: file.name,
      file_size: file.size,
      department,
      level: study_level,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Material saved");
    setUpload({ title: "", kind: "note", course_id: "", description: "" });
    setFile(null);
    setUploadOpen(false);
    load();
  };

  const saveToMine = async (item: any) => {
    if (!user) return;
    const { error } = await supabase.from("campus_materials").insert({
      user_id: user.id,
      title: item.title,
      kind: item.kind,
      description: item.description,
      course_code: item.course_code,
      file_url: item.file_url,
      file_name: item.file_name,
      file_size: item.file_size,
      department: item.department ?? department,
      level: item.level ?? study_level,
      is_library: false,
      is_published: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved to your materials");
    load();
  };

  const submitToLibrary = async () => {
    if (!user || !contributeFile || !contribute.title.trim()) {
      toast.error("Pick a file and give it a title");
      return;
    }
    setSaving(true);
    const path = `${user.id}/library-submissions/${Date.now()}-${contributeFile.name.replace(/\s+/g, "-")}`;
    const { error: upErr } = await supabase.storage.from("campus-files").upload(path, contributeFile);
    if (upErr) {
      setSaving(false);
      return toast.error(upErr.message);
    }
    const { error } = await supabase.from("campus_materials").insert({
      user_id: user.id,
      title: contribute.title.trim(),
      kind: contribute.kind,
      course_code: contribute.course_code.trim().toUpperCase() || null,
      description: contribute.description.trim() || null,
      file_url: path,
      file_name: contributeFile.name,
      file_size: contributeFile.size,
      department,
      level: study_level,
      is_library: true,
      is_published: false,
      review_status: "pending",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for review", { description: "An admin will approve it before it appears in the Library." });
    setContribute({ title: "", kind: "note", course_code: "", description: "" });
    setContributeFile(null);
    setContributeOpen(false);
    load();
  };

  const openFile = async (path?: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("campus-files").createSignedUrl(path, 60 * 10);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <CampusShell
      title="Academics"
      subtitle="Your semester courses, lecture notes and past questions."
      action={
        <div className="flex gap-2">
          <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Course</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader><DialogTitle>Add course</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CSC 201" /></div>
                  <div><Label>Units</Label><Input type="number" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} /></div>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Computer Programming II" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Semester</Label>
                    <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SEMESTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Lecturer</Label><Input value={form.lecturer} onChange={(e) => setForm({ ...form, lecturer: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addCourse} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Upload className="h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader><DialogTitle>Upload material</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Title</Label><Input value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={upload.kind} onValueChange={(v) => setUpload({ ...upload, kind: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Course</Label>
                    <Select value={upload.course_id} onValueChange={(v) => setUpload({ ...upload, course_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Notes</Label><Textarea rows={2} value={upload.description} onChange={(e) => setUpload({ ...upload, description: e.target.value })} /></div>
                <div><Label>File</Label><Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
              </div>
              <DialogFooter>
                <Button onClick={uploadMaterial} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="materials">My materials</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          {courses.length === 0 && !loading ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
              <BookOpen className="h-6 w-6 mx-auto mb-2" /> No courses yet. Add your first course above.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{c.code}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{c.title}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeCourse(c.id)} aria-label="Delete course">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[11px]">{c.units} units</Badge>
                      <Badge variant="outline" className="text-[11px]">{c.semester} semester</Badge>
                      {c.lecturer && <Badge variant="outline" className="text-[11px] truncate max-w-[160px]">{c.lecturer}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <MaterialList items={materials} onOpen={openFile} empty="Upload your notes, handouts and past questions to keep them in one place." />
        </TabsContent>

        <TabsContent value="library" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-sm font-medium">What is the Library?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The Library holds materials published by Edura for every campus student &mdash; lecture notes,
              past questions, project templates and guides. They are read-only and shared with everyone, unlike
              &ldquo;My materials&rdquo;, which only you can see. Tap any item to open it.
            </p>
          </div>
          <MaterialList items={library} onOpen={openFile} empty="No shared library materials published yet. Check back soon." />
        </TabsContent>
      </Tabs>
    </CampusShell>
  );
};

const MaterialList = ({ items, onOpen, empty }: { items: any[]; onOpen: (p?: string | null) => void; empty: string }) => {
  if (items.length === 0) {
    return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{empty}</CardContent></Card>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((m) => (
        <Card key={m.id}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-lg border p-2"><FileText className="h-4 w-4 text-primary" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{m.title}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {String(m.kind).replace("_", " ")}{m.course_code ? ` · ${m.course_code}` : ""}
              </p>
              {m.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
            </div>
            <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => onOpen(m.file_url)}>
              <Download className="h-3.5 w-3.5" /> Open
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CampusAcademics;
