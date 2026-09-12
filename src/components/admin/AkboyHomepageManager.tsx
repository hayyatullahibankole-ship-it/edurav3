import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Stat {
  label: string;
  value: string;
}

const TOGGLES: { key: string; label: string; help: string }[] = [
  { key: "show_products", label: "Products section", help: "Shows Edura, School OS and other published products." },
  { key: "show_featured_event", label: "Featured event", help: "Shows the event you select below." },
  { key: "show_community", label: "Community section", help: "Ambassadors and community highlights." },
  { key: "show_partner_strip", label: "Partner school logos", help: "Row of published partner school logos." },
  { key: "show_impact", label: "Verified impact numbers", help: "Only shows numbers you enter below." },
];

export function AkboyHomepageManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, e] = await Promise.all([
      supabase.from("akboy_homepage_settings").select("*").limit(1).maybeSingle(),
      supabase.from("akboy_events").select("id,title,event_date").order("event_date", { ascending: false }).limit(50),
    ]);
    let row = s.data;
    if (!row) {
      const { data, error } = await supabase.from("akboy_homepage_settings").insert({}).select("*").single();
      if (error) toast({ title: "Could not create homepage settings", description: error.message, variant: "destructive" });
      row = data || null;
    }
    setSettings(row);
    setStats(Array.isArray(row?.impact_stats) ? (row!.impact_stats as any) : []);
    setEvents(e.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("akboy_homepage_settings")
      .update({
        show_products: settings.show_products,
        show_featured_event: settings.show_featured_event,
        show_community: settings.show_community,
        show_partner_strip: settings.show_partner_strip,
        show_impact: settings.show_impact,
        featured_event_id: settings.featured_event_id || null,
        impact_stats: stats.filter((s) => s.label.trim() && s.value.trim()),
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    toast({ title: "Homepage settings saved" });
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading homepage settings…</div>;
  if (!settings) return <div className="p-8 text-center text-muted-foreground">Homepage settings unavailable.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Homepage</h2>
        <p className="text-sm text-muted-foreground">Control which sections appear on the AKBOY homepage.</p>
      </div>

      <Card className="space-y-5 p-5">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-start justify-between gap-6">
            <div>
              <Label className="text-base">{t.label}</Label>
              <p className="text-xs text-muted-foreground">{t.help}</p>
            </div>
            <Switch
              checked={!!settings[t.key]}
              onCheckedChange={(v) => setSettings({ ...settings, [t.key]: v })}
            />
          </div>
        ))}
      </Card>

      <Card className="space-y-3 p-5">
        <Label>Featured event</Label>
        <Select
          value={settings.featured_event_id || "none"}
          onValueChange={(v) => setSettings({ ...settings, featured_event_id: v === "none" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No featured event</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Verified impact numbers</Label>
            <p className="text-xs text-muted-foreground">Only add numbers you can verify. Leave empty to hide.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setStats([...stats, { label: "", value: "" }])}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add number
          </Button>
        </div>
        {stats.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Value (e.g. 12)"
              value={s.value}
              onChange={(e) => setStats(stats.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}
              className="w-40"
            />
            <Input
              placeholder="Label (e.g. Partner schools)"
              value={s.label}
              onChange={(e) => setStats(stats.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
            />
            <Button size="sm" variant="ghost" onClick={() => setStats(stats.filter((_, x) => x !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save homepage settings"}
      </Button>
    </div>
  );
}
