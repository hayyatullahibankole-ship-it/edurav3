import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { INSTITUTION_REGISTRY, logoUrlForDomain } from "@/lib/institutionLogos";

interface Row {
  id: string;
  name: string;
  short_name: string | null;
  aliases: string[];
  domain: string | null;
  logo_url: string | null;
  institution_type: string | null;
  is_active: boolean;
}

const TYPES = ["university", "polytechnic", "college", "exam-body", "agency", "other"];

const emptyForm = {
  id: "",
  name: "",
  short_name: "",
  aliases: "",
  domain: "",
  logo_url: "",
  institution_type: "university",
  is_active: true,
};

export function InstitutionLogosManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("institution_logos")
      .select("*")
      .order("name");
    if (error) {
      toast({ title: "Could not load institution logos", description: error.message, variant: "destructive" });
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...emptyForm }); setOpen(true); };

  const openEdit = (row: Row) => {
    setForm({
      id: row.id,
      name: row.name,
      short_name: row.short_name || "",
      aliases: (row.aliases || []).join(", "),
      domain: row.domain || "",
      logo_url: row.logo_url || "",
      institution_type: row.institution_type || "university",
      is_active: row.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Institution name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      short_name: form.short_name.trim() || null,
      aliases: form.aliases.split(",").map(a => a.trim()).filter(Boolean),
      domain: form.domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null,
      logo_url: form.logo_url.trim() || null,
      institution_type: form.institution_type,
      is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from("institution_logos").update(payload).eq("id", form.id)
      : await supabase.from("institution_logos").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: form.id ? "Institution updated" : "Institution added" });
    setOpen(false);
    load();
  };

  const remove = async (row: Row) => {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    const { error } = await supabase.from("institution_logos").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows(prev => prev.filter(r => r.id !== row.id));
  };

  const toggleActive = async (row: Row) => {
    const { error } = await supabase
      .from("institution_logos")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, is_active: !r.is_active } : r)));
  };

  const filtered = rows.filter(r =>
    !search || `${r.name} ${r.short_name} ${(r.aliases || []).join(" ")}`.toLowerCase().includes(search.toLowerCase())
  );

  const preview = form.logo_url || (form.domain ? logoUrlForDomain(form.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "")) : "");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Institution Logos</h2>
          <p className="text-sm text-slate-500">
            Logos shown on Campus Hub posts. {INSTITUTION_REGISTRY.length} institutions are already built in —
            add a row here only to override one or add a missing school.
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add institution
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions" className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          No custom institutions yet. Campus Hub is using the built-in logo registry.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(row => {
            const src = row.logo_url || (row.domain ? logoUrlForDomain(row.domain) : "");
            return (
              <Card key={row.id} className="flex items-center gap-3 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {src ? (
                    <img src={src} alt={row.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">{row.short_name || "—"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{row.name}</p>
                  <p className="truncate text-xs text-slate-500">{row.short_name} · {row.institution_type}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Switch checked={row.is_active} onCheckedChange={() => toggleActive(row)} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(row)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit institution" : "Add institution"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="University of Lagos" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Short name / code</Label>
                <Input value={form.short_name} onChange={e => setForm({ ...form, short_name: e.target.value })} placeholder="UNILAG" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.institution_type} onValueChange={v => setForm({ ...form, institution_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Other names used in posts (comma separated)</Label>
              <Input value={form.aliases} onChange={e => setForm({ ...form, aliases: e.target.value })} placeholder="unilag, university of lagos, akoka" />
            </div>
            <div>
              <Label>Official website domain</Label>
              <Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="unilag.edu.ng" />
              <p className="mt-1 text-xs text-slate-500">Used to fetch the logo automatically when no image is uploaded.</p>
            </div>
            <div>
              <Label>Upload logo (overrides the automatic one)</Label>
              <ImageUpload
                value={form.logo_url}
                onChange={url => setForm({ ...form, logo_url: url })}
                folder="institution-logos"
                label="Logo"
              />
            </div>
            {preview && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <img src={preview} alt="Preview" className="h-12 w-12 object-contain" />
                <span className="text-xs text-slate-500">Preview</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span className="text-sm font-medium text-slate-700">Active</span>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstitutionLogosManager;
