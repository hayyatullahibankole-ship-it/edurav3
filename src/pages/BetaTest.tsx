import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceFingerprint } from "@/utils/deviceFingerprint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Loader2, CheckCircle2, Upload, X, ShieldCheck, ClipboardList, LogOut,
} from "lucide-react";
import eduraLogo from "@/assets/edura-logo.png";

const CODE_KEY = "edura_beta_code";
const TOTAL_DAYS = 5;

type Report = {
  id: string;
  day_number: number;
  rating: number;
  what_worked: string | null;
  issues: string | null;
  suggestions: string | null;
  device_info: string | null;
  screenshots: string[];
  created_at: string;
};

type State = {
  tester: { id: string; code: string; name: string | null; email: string | null; phone: string | null };
  reports: Report[];
  focusNotes: { day_number: number; focus_note: string }[];
  currentDay: number;
  totalDays: number;
};

const call = async (payload: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("beta-portal", {
    body: { ...payload, device: getDeviceFingerprint() },
  });
  if (error) {
    let message = "Something went wrong.";
    try {
      const ctx = (error as any).context;
      if (ctx?.json) message = (await ctx.json())?.error || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as State;
};

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        aria-label={`${n} star`}
        onClick={() => onChange(n)}
        className="p-1"
      >
        <Star
          className={n <= value ? "h-7 w-7 fill-primary text-primary" : "h-7 w-7 text-muted-foreground"}
          strokeWidth={1.8}
        />
      </button>
    ))}
  </div>
);

export default function BetaTest() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booting, setBooting] = useState(true);
  const [state, setState] = useState<State | null>(null);

  // unlock form
  const [code, setCode] = useState(codeParam?.toUpperCase() || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  // report form
  const [rating, setRating] = useState(5);
  const [whatWorked, setWhatWorked] = useState("");
  const [issues, setIssues] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const savedCode = useMemo(() => localStorage.getItem(CODE_KEY) || "", []);

  const hydrateForm = useCallback((s: State, day: number) => {
    const report = s.reports.find((r) => r.day_number === day);
    setRating(report?.rating ?? 5);
    setWhatWorked(report?.what_worked ?? "");
    setIssues(report?.issues ?? "");
    setSuggestions(report?.suggestions ?? "");
    setDeviceInfo(report?.device_info ?? navigator.userAgent.slice(0, 120));
    setShots(report?.screenshots ?? []);
  }, []);

  const selectDay = useCallback((day: number) => {
    setSelectedDay(day);
    setState((s) => {
      if (s) hydrateForm(s, day);
      return s;
    });
  }, [hydrateForm]);

  useEffect(() => {
    const boot = async () => {
      const existing = savedCode || codeParam?.toUpperCase();
      if (!existing) { setBooting(false); return; }
      try {
        const s = await call({ action: "state", code: existing });
        localStorage.setItem(CODE_KEY, existing);
        setState(s);
        setSelectedDay(s.currentDay);
        hydrateForm(s, s.currentDay);
      } catch {
        localStorage.removeItem(CODE_KEY);
        setCode(codeParam?.toUpperCase() || "");
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, [savedCode, codeParam, hydrateForm]);

  // Keep state fresh when the tester comes back to the tab / app
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const existing = localStorage.getItem(CODE_KEY);
      if (!existing) return;
      try {
        const s = await call({ action: "state", code: existing });
        setState(s);
      } catch { /* ignore */ }
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const s = await call({
        action: "redeem",
        code: code.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      localStorage.setItem(CODE_KEY, s.tester.code);
      setState(s);
      setSelectedDay(s.currentDay);
      hydrateForm(s, s.currentDay);
    } catch (err: any) {
      setUnlockError(err.message || "Could not verify that code.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !state) return;
    const remaining = 3 - shots.length;
    if (remaining <= 0) {
      toast({ title: "Limit reached", description: "You can attach up to 3 screenshots." });
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "Too large", description: `${file.name} is over 5MB.`, variant: "destructive" });
          continue;
        }
        const ext = file.name.split(".").pop() || "png";
        const path = `${state.tester.id}/day-${state.currentDay}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("beta-screenshots").upload(path, file, {
          contentType: file.type || "image/png",
        });
        if (error) throw error;
        uploaded.push(path);
      }
      setShots((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) return;
    if (!issues.trim() && !whatWorked.trim()) {
      toast({ title: "Add some detail", description: "Tell us what worked or what broke.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const s = await call({
        action: "submit",
        code: state.tester.code,
        rating,
        what_worked: whatWorked,
        issues,
        suggestions,
        device_info: deviceInfo,
        screenshots: shots,
      });
      setState(s);
      toast({ title: "Report sent", description: `Day ${s.currentDay} report saved. Thank you!` });
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const exit = () => {
    localStorage.removeItem(CODE_KEY);
    setState(null);
    setCode("");
  };

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <img src={eduraLogo} alt="Edura" className="h-8 w-auto" />
            <Badge variant="outline" className="text-[10px] font-semibold">Beta testing</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Welcome, tester</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter the invite code you were given. You will report on the app once a day for 5 days.
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EDURA-XXXXXX"
                autoCapitalize="characters"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>

            {unlockError && <p className="text-sm text-destructive">{unlockError}</p>}

            <Button type="submit" className="w-full" disabled={unlocking}>
              {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start testing"}
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Your code locks to this device once used.
            </p>
          </form>
        </div>
      </div>
    );
  }

  const submittedDays = new Set(state.reports.map((r) => r.day_number));
  const todaySubmitted = submittedDays.has(state.currentDay);
  const focus = state.focusNotes.find((f) => f.day_number === state.currentDay)?.focus_note;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <img src={eduraLogo} alt="Edura" className="h-7 w-auto" />
            <Badge variant="outline" className="text-[10px] font-semibold">Beta</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={exit} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-1.5" /> Exit
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-6 space-y-5">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight">
            Hi {state.tester.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Day {state.currentDay} of {TOTAL_DAYS} &middot; {state.reports.length} report
            {state.reports.length === 1 ? "" : "s"} submitted
          </p>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
            const done = submittedDays.has(d);
            const isToday = d === state.currentDay;
            return (
              <div
                key={d}
                className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
                  done
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : isToday
                    ? "border-foreground/30 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="mx-auto h-4 w-4" /> : `D${d}`}
              </div>
            );
          })}
        </div>

        {focus && (
          <Card className="border-l-4 border-l-primary p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Focus for day {state.currentDay}
            </p>
            <p className="mt-1 text-sm">{focus}</p>
          </Card>
        )}

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">
              Day {state.currentDay} report {todaySubmitted && <span className="text-muted-foreground font-medium">(editing)</span>}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Overall rating today</Label>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="worked">What worked well?</Label>
              <Textarea id="worked" rows={3} value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} maxLength={4000} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issues">Bugs or issues you found</Label>
              <Textarea id="issues" rows={4} value={issues} onChange={(e) => setIssues(e.target.value)} maxLength={4000}
                placeholder="Where did it happen, and what did you expect?" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sugg">Suggestions</Label>
              <Textarea id="sugg" rows={3} value={suggestions} onChange={(e) => setSuggestions(e.target.value)} maxLength={4000} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="device">Device and OS</Label>
              <Input id="device" value={deviceInfo} onChange={(e) => setDeviceInfo(e.target.value)} maxLength={200}
                placeholder="e.g. Infinix Note 12, Android 13" />
            </div>

            <div className="space-y-2">
              <Label>Screenshots (optional, max 3)</Label>
              <div className="flex flex-wrap gap-2">
                {shots.map((s) => (
                  <div key={s} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                    <span className="max-w-[140px] truncate">{s.split("/").pop()}</span>
                    <button type="button" onClick={() => setShots((p) => p.filter((x) => x !== s))}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => handleUpload(e.target.files)} />
              <Button type="button" variant="outline" size="sm" disabled={uploading || shots.length >= 3}
                onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-1.5" /> Add screenshot</>}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : todaySubmitted ? "Update today's report" : "Submit report"}
            </Button>
          </form>
        </Card>

        {state.reports.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold">Your past reports</h2>
            {state.reports
              .filter((r) => r.day_number !== state.currentDay)
              .sort((a, b) => b.day_number - a.day_number)
              .map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Day {r.day_number}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating }, (_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  {r.issues && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.issues}</p>}
                </Card>
              ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-center text-xs text-muted-foreground underline"
        >
          Back to Edura
        </button>
      </main>
    </div>
  );
}
