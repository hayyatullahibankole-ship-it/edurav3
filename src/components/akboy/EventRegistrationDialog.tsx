import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CORE_EVENT_FIELDS, EventFormField, parseFormFields } from "@/lib/eventForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    date?: string;
    location?: string;
    form_fields?: unknown;
    seatsLeft?: number | null;
  } | null;
}

export function EventRegistrationDialog({ open, onOpenChange, event }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const extraFields = useMemo<EventFormField[]>(
    () => parseFormFields(event?.form_fields).filter((f) => !CORE_EVENT_FIELDS.some((c) => c.key === f.key)),
    [event?.form_fields]
  );

  const allFields = [...CORE_EVENT_FIELDS, ...extraFields];
  const isFull = typeof event?.seatsLeft === "number" && event.seatsLeft <= 0;

  const setValue = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => {
    setValues({});
    setDone(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    for (const field of allFields) {
      if (field.required && !(values[field.key] || "").trim()) {
        toast.error(`${field.label} is required.`);
        return;
      }
    }
    const email = (values.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const responses: Record<string, string> = {};
      extraFields.forEach((f) => {
        const v = (values[f.key] || "").trim();
        if (v) responses[f.label] = v;
      });

      const { error } = await supabase.from("akboy_event_registrations").insert({
        event_id: event.id,
        full_name: (values.full_name || "").trim(),
        email: email || null,
        phone: (values.phone || "").trim() || null,
        responses,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Could not submit your registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-xl font-bold">You're registered</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We've received your details for {event?.title}. We'll reach out with the next steps.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register for {event?.title}</DialogTitle>
              <DialogDescription>
                {[event?.date, event?.location].filter(Boolean).join(" · ") || "Fill in your details below."}
              </DialogDescription>
            </DialogHeader>

            {isFull ? (
              <p className="text-sm text-muted-foreground py-4">
                This event is fully booked. Please contact us to join the waiting list.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {allFields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`evt-${field.key}`}>
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>

                    {field.type === "textarea" ? (
                      <Textarea
                        id={`evt-${field.key}`}
                        rows={3}
                        maxLength={1000}
                        placeholder={field.placeholder}
                        value={values[field.key] || ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                      />
                    ) : field.type === "select" ? (
                      <Select value={values[field.key] || ""} onValueChange={(v) => setValue(field.key, v)}>
                        <SelectTrigger id={`evt-${field.key}`}>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.options || []).map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`evt-${field.key}`}
                        type={field.type}
                        maxLength={255}
                        placeholder={field.placeholder}
                        value={values[field.key] || ""}
                        onChange={(e) => setValue(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit registration
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
