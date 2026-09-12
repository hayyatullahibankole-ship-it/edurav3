import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { EventFormBuilder } from "@/components/admin/EventFormBuilder";
import { EventRegistrationsDialog } from "@/components/admin/EventRegistrationsDialog";
import { EventFormField, parseFormFields } from "@/lib/eventForm";
import { AkboyEventContentDialog } from "@/components/admin/AkboyEventContentDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");


interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  location: string;
  event_type: string;
  registration_url: string;
  image_url: string;
  max_participants: number;
  current_participants: number;
  price: number;
  is_active: boolean;
  form_fields?: any;
  slug?: string;
  theme?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  status?: string;
  is_featured?: boolean;
  is_published?: boolean;
  why_we_do_this?: string;
  who_its_for?: string;
  outcomes?: string;
  attendance_count?: number;
  highlights?: any;
  schedule?: any;
}

export function AkboyEventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [regEvent, setRegEvent] = useState<Event | null>(null);
  const [contentEvent, setContentEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    end_date: "",
    location: "",
    event_type: "",
    registration_url: "",
    image_url: "",
    max_participants: 0,
    price: 0,
    is_active: true,
    form_fields: [] as EventFormField[],
    slug: "",
    theme: "",
    start_time: "",
    end_time: "",
    venue: "",
    status: "upcoming",
    is_featured: false,
    is_published: true,
    why_we_do_this: "",
    who_its_for: "",
    outcomes: "",
    attendance_count: 0,
    highlights: [] as { title: string; description: string }[],
    schedule: [] as { time: string; title: string; description: string }[],
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("akboy_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
      end_date: formData.end_date || null,
      highlights: formData.highlights.filter((h) => (h.title || "").trim()),
      schedule: formData.schedule.filter((s) => (s.title || "").trim()),
    };

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from("akboy_events")
          .update(payload as any)
          .eq("id", editingEvent.id);

        if (error) throw error;
        toast({ title: "Event updated successfully" });
      } else {
        const { error } = await supabase
          .from("akboy_events")
          .insert([payload as any]);

        if (error) throw error;
        toast({ title: "Event created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : "",
      end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : "",
      location: event.location || "",
      event_type: event.event_type || "",
      registration_url: event.registration_url || "",
      image_url: event.image_url || "",
      max_participants: event.max_participants || 0,
      price: event.price || 0,
      is_active: event.is_active,
      form_fields: parseFormFields(event.form_fields),
      slug: event.slug || "",
      theme: event.theme || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      venue: event.venue || "",
      status: event.status || "upcoming",
      is_featured: !!event.is_featured,
      is_published: event.is_published !== false,
      why_we_do_this: event.why_we_do_this || "",
      who_its_for: event.who_its_for || "",
      outcomes: event.outcomes || "",
      attendance_count: event.attendance_count || 0,
      highlights: Array.isArray(event.highlights) ? event.highlights : [],
      schedule: Array.isArray(event.schedule) ? event.schedule : [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("akboy_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Event deleted successfully" });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_date: "",
      end_date: "",
      location: "",
      event_type: "",
      registration_url: "",
      image_url: "",
      max_participants: 0,
      price: 0,
      is_active: true,
      form_fields: [],
      slug: "",
      theme: "",
      start_time: "",
      end_time: "",
      venue: "",
      status: "upcoming",
      is_featured: false,
      is_published: true,
      why_we_do_this: "",
      who_its_for: "",
      outcomes: "",
      attendance_count: 0,
      highlights: [],
      schedule: [],
    });
    setEditingEvent(null);
  };

  if (loading) return <div className="text-center p-8">Loading events...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AKBOY Events & Programs Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Date *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Physical location or 'Online'"
                />
              </div>
              <div>
                <Label>Event Type</Label>
                <Input
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  placeholder="e.g., Workshop, Webinar, Training, Seminar"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Page address (slug)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from title"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Theme / subtitle</Label>
                <Input
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start time</Label>
                  <Input
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    placeholder="10:00 AM"
                  />
                </div>
                <div>
                  <Label>End time</Label>
                  <Input
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    placeholder="2:00 PM"
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Why we are doing this</Label>
                <Textarea
                  rows={3}
                  value={formData.why_we_do_this}
                  onChange={(e) => setFormData({ ...formData, why_we_do_this: e.target.value })}
                />
              </div>
              <div>
                <Label>Who it is for</Label>
                <Textarea
                  rows={3}
                  value={formData.who_its_for}
                  onChange={(e) => setFormData({ ...formData, who_its_for: e.target.value })}
                />
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>Programme highlights</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormData({ ...formData, highlights: [...formData.highlights, { title: "", description: "" }] })
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add highlight
                  </Button>
                </div>
                {formData.highlights.map((h, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Highlight title"
                        value={h.title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            highlights: formData.highlights.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)),
                          })
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setFormData({ ...formData, highlights: formData.highlights.filter((_, x) => x !== i) })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Description"
                      value={h.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          highlights: formData.highlights.map((x, xi) =>
                            xi === i ? { ...x, description: e.target.value } : x
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>Schedule</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        schedule: [...formData.schedule, { time: "", title: "", description: "" }],
                      })
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add item
                  </Button>
                </div>
                {formData.schedule.map((sItem, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <div className="flex gap-2">
                      <Input
                        className="w-32"
                        placeholder="10:00 AM"
                        value={sItem.time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            schedule: formData.schedule.map((x, xi) => (xi === i ? { ...x, time: e.target.value } : x)),
                          })
                        }
                      />
                      <Input
                        placeholder="Session title"
                        value={sItem.title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            schedule: formData.schedule.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)),
                          })
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setFormData({ ...formData, schedule: formData.schedule.filter((_, x) => x !== i) })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Description"
                      value={sItem.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: formData.schedule.map((x, xi) =>
                            xi === i ? { ...x, description: e.target.value } : x
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Event Image</Label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="events"
                  label="Event image"
                />
              </div>

              <div>
                <Label>Registration URL</Label>
                <Input
                  value={formData.registration_url}
                  onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Participants</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <EventFormBuilder
                value={formData.form_fields}
                onChange={(fields) => setFormData({ ...formData, form_fields: fields })}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Attendance (after the event)</Label>
                  <Input
                    type="number"
                    value={formData.attendance_count}
                    onChange={(e) => setFormData({ ...formData, attendance_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Outcomes / impact summary</Label>
                  <Textarea
                    rows={2}
                    value={formData.outcomes}
                    onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label>Published on website</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label>Featured</Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex gap-4">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-32 h-32 object-cover rounded" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <Badge variant={event.is_published === false ? "secondary" : "default"}>
                        {event.is_published === false ? "Draft" : "Published"}
                      </Badge>
                      {event.status && <Badge variant="outline">{event.status}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.event_date && format(new Date(event.event_date), "MMM dd, yyyy")}
                      </span>
                      <span>{event.location}</span>
                      <span>{event.event_type}</span>
                      {event.price > 0 && <span>₦{event.price.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setContentEvent(event)}>
                      Content
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRegEvent(event)}>
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AkboyEventContentDialog
        open={!!contentEvent}
        onOpenChange={(o) => !o && setContentEvent(null)}
        eventId={contentEvent?.id || null}
        eventTitle={contentEvent?.title}
      />

      <EventRegistrationsDialog
        open={!!regEvent}
        onOpenChange={(o) => !o && setRegEvent(null)}
        eventId={regEvent?.id || null}
        eventTitle={regEvent?.title}
      />
    </div>
  );
}
