import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Registration {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  responses: Record<string, string> | null;
  status: string;
  created_at: string;
}

interface Props {
  eventId: string | null;
  eventTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationsDialog({ eventId, eventTitle, open, onOpenChange }: Props) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !eventId) return;
    setLoading(true);
    supabase
      .from("akboy_event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
        setRows((data as any as Registration[]) || []);
        setLoading(false);
      });
  }, [open, eventId, toast]);

  const remove = async (id: string) => {
    if (!confirm("Delete this registration?")) return;
    const { error } = await supabase.from("akboy_event_registrations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const exportCsv = () => {
    const extraKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r.responses || {}))));
    const header = ["Name", "Email", "Phone", "Registered", ...extraKeys];
    const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [
        r.full_name,
        r.email || "",
        r.phone || "",
        format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
        ...extraKeys.map((k) => r.responses?.[k] || ""),
      ]
        .map(escape)
        .join(",")
    );
    const blob = new Blob([[header.map(escape).join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(eventTitle || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrations — {eventTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <Badge variant="secondary">{rows.length} registered</Badge>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading registrations...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No registrations yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground break-all">
                      {[r.email, r.phone].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "MMM d, HH:mm")}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {r.responses && Object.keys(r.responses).length > 0 && (
                  <div className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {Object.entries(r.responses).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-muted-foreground">{k}: </span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
