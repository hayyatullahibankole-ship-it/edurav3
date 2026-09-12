import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

const emptyForm = {
  full_name: "",
  photo_url: "",
  school: "",
  role_title: "Student Ambassador",
  cohort: "",
  bio: "",
  instagram: "",
  x_url: "",
  linkedin: "",
  display_order: 0,
  is_featured: false,
  is_active: true,
  is_published: false,
};

export function AkboyAmbassadorsManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("akboy_ambassadors")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast({ title: "Could not load ambassadors", description: error.message, variant: "destructive" });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const startEdit = (a: any) => {
    const links = a.social_links || {};
    setEditingId(a.id);
    setForm({
      full_name: a.full_name || "",
      photo_url: a.photo_url || "",
      school: a.school || "",
      role_title: a.role_title || "Student Ambassador",
      cohort: a.cohort || "",
      bio: a.bio || "",
      instagram: links.instagram || "",
      x_url: links.x || "",
      linkedin: links.linkedin || "",
      display_order: a.display_order ?? 0,
      is_featured: !!a.is_featured,
      is_active: a.is_active !== false,
      is_published: !!a.is_published,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        photo_url: form.photo_url || null,
        school: form.school || null,
        role_title: form.role_title || null,
        cohort: form.cohort || null,
        bio: form.bio || null,
        social_links: { instagram: form.instagram, x: form.x_url, linkedin: form.linkedin },
        display_order: form.display_order,
        is_featured: form.is_featured,
        is_active: form.is_active,
        is_published: form.is_published,
      };
      const { error } = editingId
        ? await supabase.from("akboy_ambassadors").update(payload).eq("id", editingId)
        : await supabase.from("akboy_ambassadors").insert(payload);
      if (error) throw error;
      toast({ title: editingId ? "Ambassador updated" : "Ambassador added" });
      setOpen(false);
      reset();
      load();
    } catch (err: any) {
      toast({ title: "Could not save ambassador", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (a: any) => {
    const { error } = await supabase.from("akboy_ambassadors").update({ is_published: !a.is_published }).eq("id", a.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this ambassador?")) return;
    const { error } = await supabase.from("akboy_ambassadors").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading ambassadors…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Student Ambassadors</h2>
          <p className="text-sm text-muted-foreground">Published ambassadors appear on the Community pages.</p>
        </div>
        <Button
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Ambassador
        </Button>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No ambassadors added yet.</Card>
        )}
        {rows.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-4">
              {a.photo_url ? (
                <img src={a.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-semibold">
                  {a.full_name?.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.full_name}</h3>
                  <Badge variant={a.is_published ? "default" : "secondary"}>
                    {a.is_published ? "Published" : "Draft"}
                  </Badge>
                  {!a.is_active && <Badge variant="outline">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[a.role_title, a.school, a.cohort].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>
                {a.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit ambassador" : "Add ambassador"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Full name *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Photo</Label>
              <ImageUpload
                value={form.photo_url}
                onChange={(url) => setForm({ ...form, photo_url: url })}
                folder="ambassadors"
                label="Ambassador photo"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>School</Label>
                <Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
              </div>
              <div>
                <Label>Role / title</Label>
                <Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
              </div>
              <div>
                <Label>Cohort</Label>
                <Input
                  value={form.cohort}
                  onChange={(e) => setForm({ ...form, cohort: e.target.value })}
                  placeholder="2026 Cohort"
                />
              </div>
              <div>
                <Label>Display order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Short bio</Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Instagram</Label>
                <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <div>
                <Label>X (Twitter)</Label>
                <Input value={form.x_url} onChange={(e) => setForm({ ...form, x_url: e.target.value })} />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
