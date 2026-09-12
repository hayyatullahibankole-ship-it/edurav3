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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

const TYPES = [
  { value: "technology", label: "Technology Partner" },
  { value: "programme", label: "Programme Partner" },
  { value: "strategic", label: "Strategic / Institutional Partner" },
];

const emptyForm = {
  name: "",
  logo_url: "",
  location: "",
  website_url: "",
  partnership_type: "programme",
  description: "",
  partnership_start_date: "",
  is_featured: false,
  is_active: true,
  is_published: false,
  display_order: 0,
};

export function AkboyPartnerSchoolsManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("akboy_partner_schools")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast({ title: "Could not load schools", description: error.message, variant: "destructive" });
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

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      logo_url: s.logo_url || "",
      location: s.location || "",
      website_url: s.website_url || "",
      partnership_type: s.partnership_type || "programme",
      description: s.description || "",
      partnership_start_date: s.partnership_start_date || "",
      is_featured: !!s.is_featured,
      is_active: s.is_active !== false,
      is_published: !!s.is_published,
      display_order: s.display_order ?? 0,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        logo_url: form.logo_url || null,
        location: form.location || null,
        website_url: form.website_url || null,
        description: form.description || null,
        partnership_start_date: form.partnership_start_date || null,
      };
      const { error } = editingId
        ? await supabase.from("akboy_partner_schools").update(payload).eq("id", editingId)
        : await supabase.from("akboy_partner_schools").insert(payload);
      if (error) throw error;
      toast({ title: editingId ? "School updated" : "School added" });
      setOpen(false);
      reset();
      load();
    } catch (err: any) {
      toast({ title: "Could not save school", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (s: any) => {
    const { error } = await supabase
      .from("akboy_partner_schools")
      .update({ is_published: !s.is_published })
      .eq("id", s.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this school? It will also be removed from any events it is linked to.")) return;
    const { error } = await supabase.from("akboy_partner_schools").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading schools…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Partner Schools</h2>
          <p className="text-sm text-muted-foreground">
            One record per school. The same record is reused on events and the homepage.
          </p>
        </div>
        <Button
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add School
        </Button>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">No partner schools added yet.</Card>
        )}
        {rows.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-4">
              {s.logo_url ? (
                <img src={s.logo_url} alt="" className="h-12 w-12 rounded object-contain" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs font-semibold">
                  {s.name?.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{s.name}</h3>
                  <Badge variant={s.is_published ? "default" : "secondary"}>
                    {s.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline">
                    {TYPES.find((t) => t.value === s.partnership_type)?.label || s.partnership_type}
                  </Badge>
                </div>
                {s.location && <p className="text-xs text-muted-foreground">{s.location}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => togglePublish(s)}>
                {s.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
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
            <DialogTitle>{editingId ? "Edit school" : "Add school"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>School name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Logo</Label>
              <ImageUpload
                value={form.logo_url}
                onChange={(url) => setForm({ ...form, logo_url: url })}
                folder="partner-schools"
                label="School logo"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <div>
                <Label>Partnership type</Label>
                <Select
                  value={form.partnership_type}
                  onValueChange={(v) => setForm({ ...form, partnership_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Partnership start date</Label>
                <Input
                  type="date"
                  value={form.partnership_start_date}
                  onChange={(e) => setForm({ ...form, partnership_start_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Explain the relationship — what the school does with AKBOY."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Display order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_published}
                    onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                  />
                  <Label>Published</Label>
                </div>
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
