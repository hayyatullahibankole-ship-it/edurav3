import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  eventTitle?: string;
}

interface Speaker {
  full_name: string;
  position_title: string;
  organization: string;
  bio: string;
  photo_url: string;
}
interface Media {
  url: string;
  caption: string;
  media_type: string;
}

export function AkboyEventContentDialog({ open, onOpenChange, eventId, eventTitle }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [allAmbassadors, setAllAmbassadors] = useState<any[]>([]);
  const [schoolIds, setSchoolIds] = useState<string[]>([]);
  const [ambassadorIds, setAmbassadorIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !eventId) return;
    const load = async () => {
      setLoading(true);
      const [sp, md, sc, am, schools, ambs] = await Promise.all([
        supabase.from("akboy_event_speakers").select("*").eq("event_id", eventId).order("display_order"),
        supabase.from("akboy_event_media").select("*").eq("event_id", eventId).order("display_order"),
        supabase.from("akboy_event_schools").select("school_id").eq("event_id", eventId),
        supabase.from("akboy_event_ambassadors").select("ambassador_id").eq("event_id", eventId),
        supabase.from("akboy_partner_schools").select("id,name").order("name"),
        supabase.from("akboy_ambassadors").select("id,full_name,school").order("full_name"),
      ]);
      setSpeakers(
        ((sp.data as any[]) || []).map((s) => ({
          full_name: s.full_name || "",
          position_title: s.position_title || "",
          organization: s.organization || "",
          bio: s.bio || "",
          photo_url: s.photo_url || "",
        }))
      );
      setMedia(
        ((md.data as any[]) || []).map((m) => ({
          url: m.url || "",
          caption: m.caption || "",
          media_type: m.media_type || "image",
        }))
      );
      setSchoolIds(((sc.data as any[]) || []).map((r) => r.school_id));
      setAmbassadorIds(((am.data as any[]) || []).map((r) => r.ambassador_id));
      setAllSchools(schools.data || []);
      setAllAmbassadors(ambs.data || []);
      setLoading(false);
    };
    load();
  }, [open, eventId]);

  const save = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      await supabase.from("akboy_event_speakers").delete().eq("event_id", eventId);
      const cleanSpeakers = speakers.filter((s) => s.full_name.trim());
      if (cleanSpeakers.length) {
        const { error } = await supabase.from("akboy_event_speakers").insert(
          cleanSpeakers.map((s, i) => ({
            event_id: eventId,
            full_name: s.full_name,
            position_title: s.position_title || null,
            organization: s.organization || null,
            bio: s.bio || null,
            photo_url: s.photo_url || null,
            display_order: i,
          }))
        );
        if (error) throw error;
      }

      await supabase.from("akboy_event_media").delete().eq("event_id", eventId);
      const cleanMedia = media.filter((m) => m.url.trim());
      if (cleanMedia.length) {
        const { error } = await supabase.from("akboy_event_media").insert(
          cleanMedia.map((m, i) => ({
            event_id: eventId,
            url: m.url,
            caption: m.caption || null,
            media_type: m.media_type || "image",
            display_order: i,
          }))
        );
        if (error) throw error;
      }

      await supabase.from("akboy_event_schools").delete().eq("event_id", eventId);
      if (schoolIds.length) {
        const { error } = await supabase
          .from("akboy_event_schools")
          .insert(schoolIds.map((id) => ({ event_id: eventId, school_id: id })));
        if (error) throw error;
      }

      await supabase.from("akboy_event_ambassadors").delete().eq("event_id", eventId);
      if (ambassadorIds.length) {
        const { error } = await supabase
          .from("akboy_event_ambassadors")
          .insert(ambassadorIds.map((id) => ({ event_id: eventId, ambassador_id: id })));
        if (error) throw error;
      }

      toast({ title: "Event content saved" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Speakers, schools & gallery{eventTitle ? ` — ${eventTitle}` : ""}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label>Speakers</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSpeakers([
                      ...speakers,
                      { full_name: "", position_title: "", organization: "", bio: "", photo_url: "" },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add speaker
                </Button>
              </div>
              {speakers.map((s, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Full name"
                      value={s.full_name}
                      onChange={(e) =>
                        setSpeakers(speakers.map((x, xi) => (xi === i ? { ...x, full_name: e.target.value } : x)))
                      }
                    />
                    <Button size="sm" variant="ghost" onClick={() => setSpeakers(speakers.filter((_, x) => x !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Position / title"
                      value={s.position_title}
                      onChange={(e) =>
                        setSpeakers(speakers.map((x, xi) => (xi === i ? { ...x, position_title: e.target.value } : x)))
                      }
                    />
                    <Input
                      placeholder="Organization"
                      value={s.organization}
                      onChange={(e) =>
                        setSpeakers(speakers.map((x, xi) => (xi === i ? { ...x, organization: e.target.value } : x)))
                      }
                    />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Short bio"
                    value={s.bio}
                    onChange={(e) => setSpeakers(speakers.map((x, xi) => (xi === i ? { ...x, bio: e.target.value } : x)))}
                  />
                  <ImageUpload
                    value={s.photo_url}
                    onChange={(url) => setSpeakers(speakers.map((x, xi) => (xi === i ? { ...x, photo_url: url } : x)))}
                    folder="event-speakers"
                    label="Speaker photo"
                  />
                </div>
              ))}
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <Label>Participating schools</Label>
              {allSchools.length === 0 && (
                <p className="text-xs text-muted-foreground">Add schools under Partner Schools first.</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {allSchools.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={schoolIds.includes(s.id)}
                      onCheckedChange={() => toggle(schoolIds, setSchoolIds, s.id)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <Label>Ambassadors involved</Label>
              {allAmbassadors.length === 0 && (
                <p className="text-xs text-muted-foreground">Add ambassadors under Ambassadors first.</p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {allAmbassadors.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={ambassadorIds.includes(a.id)}
                      onCheckedChange={() => toggle(ambassadorIds, setAmbassadorIds, a.id)}
                    />
                    {a.full_name}
                    {a.school ? ` — ${a.school}` : ""}
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label>Photo gallery</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMedia([...media, { url: "", caption: "", media_type: "image" }])}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add photo
                </Button>
              </div>
              {media.map((m, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setMedia(media.filter((_, x) => x !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <ImageUpload
                    value={m.url}
                    onChange={(url) => setMedia(media.map((x, xi) => (xi === i ? { ...x, url } : x)))}
                    folder="event-gallery"
                    label="Event photo"
                  />
                  <Input
                    placeholder="Caption (optional)"
                    value={m.caption}
                    onChange={(e) => setMedia(media.map((x, xi) => (xi === i ? { ...x, caption: e.target.value } : x)))}
                  />
                </div>
              ))}
            </section>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save content"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
