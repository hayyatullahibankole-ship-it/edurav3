import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";
import AIOutput from "@/components/campus/ai/AIOutput";
import PremiumGate from "@/components/campus/ai/PremiumGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, FileText, Route, MessagesSquare, UserRound, Printer } from "lucide-react";
import { runCampusAI, fetchCampusAIQuota, CampusAIError, type CampusAIQuota, type CampusAITask } from "@/lib/campusAI";

const CampusCareer = () => {
  const { user } = useAuth();
  const [quota, setQuota] = useState<CampusAIQuota | null>(null);
  const [busy, setBusy] = useState<CampusAITask | null>(null);
  const [output, setOutput] = useState("");
  const [lastTask, setLastTask] = useState<CampusAITask | null>(null);
  const [lastTitle, setLastTitle] = useState("");

  const [profile, setProfile] = useState<any>({
    full_name: "", headline: "", target_role: "", email: "", phone: "",
    education: "", experience: "", skills: "", summary: "",
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [expRole, setExpRole] = useState("");
  const [expOrg, setExpOrg] = useState("");
  const [expNotes, setExpNotes] = useState("");
  const [goal, setGoal] = useState("");
  const [months, setMonths] = useState("6");

  useEffect(() => { document.title = "Career Centre | Edura Campus"; }, []);

  useEffect(() => {
    if (!user) return;
    fetchCampusAIQuota().then(setQuota);
    supabase
      .from("campus_cv_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) { setProfileId(data[0].id); setProfile({ ...profile, ...data[0] }); }
      });
    // eslint-disable-next-line
  }, [user]);

  const profileText = () =>
    [
      profile.full_name && `Name: ${profile.full_name}`,
      profile.headline && `Headline: ${profile.headline}`,
      profile.education && `Education: ${profile.education}`,
      profile.experience && `Experience: ${profile.experience}`,
      profile.skills && `Skills: ${profile.skills}`,
    ].filter(Boolean).join("\n");

  const run = async (task: CampusAITask, input: Record<string, unknown>, title: string) => {
    setBusy(task); setOutput(""); setLastTask(task); setLastTitle(title);
    try {
      const { quota: q } = await runCampusAI(task, input, setOutput);
      if (q) setQuota(q);
    } catch (e) {
      toast.error((e as CampusAIError).message);
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const payload = { ...profile, user_id: user.id };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const { data, error } = profileId
      ? await supabase.from("campus_cv_profiles").update(payload).eq("id", profileId).select().single()
      : await supabase.from("campus_cv_profiles").insert(payload).select().single();
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    setProfileId(data.id);
    toast.success("CV profile saved");
  };

  const saveOutput = async () => {
    if (!user || !output || !lastTask) return;
    const { error } = await supabase.from("campus_ai_sessions").insert({
      user_id: user.id, kind: lastTask, title: lastTitle || "Career note", content: output,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const field = (k: string, l: string, textarea = false, ph = "") => (
    <div className="space-y-1.5">
      <Label className="text-xs">{l}</Label>
      {textarea ? (
        <Textarea rows={4} placeholder={ph} value={profile[k] || ""} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
      ) : (
        <Input placeholder={ph} value={profile[k] || ""} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
      )}
    </div>
  );

  if (quota && !quota.isPremium) {
    return (
      <CampusShell title="Career Centre" subtitle="CV builder, skills roadmap and interview prep.">
        <PremiumGate title="The Career Centre is a Premium feature" />
      </CampusShell>
    );
  }

  return (
    <CampusShell
      title="Career Centre"
      subtitle="Build a CV that gets replies, plan the skills to get there, and rehearse the interview."
      action={quota ? <Badge variant="secondary">{quota.remaining} AI actions left today</Badge> : undefined}
    >
      <Tabs defaultValue="cv">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="cv" className="gap-1.5"><FileText className="h-3.5 w-3.5" />CV builder</TabsTrigger>
            <TabsTrigger value="bullets" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Experience</TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-1.5"><Route className="h-3.5 w-3.5" />Skills roadmap</TabsTrigger>
            <TabsTrigger value="interview" className="gap-1.5"><MessagesSquare className="h-3.5 w-3.5" />Interview prep</TabsTrigger>
          </TabsList>

          {/* CV builder */}
          <TabsContent value="cv" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <UserRound className="h-4 w-4 text-primary" /> Your details
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {field("full_name", "Full name")}
                {field("headline", "Headline", false, "Final year Computer Science student")}
                {field("email", "Email")}
                {field("phone", "Phone")}
                {field("target_role", "Target role", false, "Graduate data analyst")}
                {field("skills", "Skills", false, "Excel, SQL, Python, teamwork")}
              </div>
              <div className="mt-3 grid gap-3">
                {field("education", "Education", true, "BSc Computer Science, University of Ibadan, 2021–2025 (Second Class Upper)")}
                {field("experience", "Experience", true, "SIWES at XYZ Ltd — network support, 2023...")}
                {field("summary", "Professional summary", true, "Generate one below, or write your own")}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={busy === "cv_summary"}
                  onClick={() => run("cv_summary", { profile: profileText(), target: profile.target_role }, "CV summary")}
                >
                  {busy === "cv_summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate summary
                </Button>
                <Button variant="ghost" className="gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print CV
                </Button>
              </div>
            </div>
            {(output || busy) && lastTask === "cv_summary" && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <AIOutput text={output} loading={busy === "cv_summary"} />
                {!!output && !busy && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => setProfile({ ...profile, summary: output.trim() })}>Use as summary</Button>
                    <Button size="sm" variant="outline" onClick={saveOutput}>Save</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Bullets */}
          <TabsContent value="bullets" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Input value={expRole} onChange={(e) => setExpRole(e.target.value)} placeholder="IT intern" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Organisation</Label>
                  <Input value={expOrg} onChange={(e) => setExpOrg(e.target.value)} placeholder="XYZ Limited" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">What you actually did</Label>
                <Textarea rows={5} value={expNotes} onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="fixed staff computers, set up the new office network, trained 12 staff on the new system..." />
              </div>
              <Button
                className="gap-2"
                disabled={busy === "cv_bullets" || !expNotes.trim()}
                onClick={() => run("cv_bullets", { role: expRole, organisation: expOrg, notes: expNotes }, "CV bullets")}
              >
                {busy === "cv_bullets" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Turn into CV bullets
              </Button>
            </div>
            {(output || busy) && lastTask === "cv_bullets" && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <AIOutput text={output} loading={busy === "cv_bullets"} />
                {!!output && !busy && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => setProfile({ ...profile, experience: `${profile.experience || ""}\n${output}`.trim() })}>
                      Add to experience
                    </Button>
                    <Button size="sm" variant="outline" onClick={saveOutput}>Save</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Roadmap */}
          <TabsContent value="roadmap" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                <div className="space-y-1.5">
                  <Label className="text-xs">What do you want to become?</Label>
                  <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Product designer at a fintech" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Months</Label>
                  <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} />
                </div>
              </div>
              <Button
                className="gap-2"
                disabled={busy === "roadmap" || !goal.trim()}
                onClick={() => run("roadmap", { goal, months: Number(months) || 6 }, `Roadmap: ${goal}`)}
              >
                {busy === "roadmap" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
                Build my roadmap
              </Button>
            </div>
            {(output || busy) && lastTask === "roadmap" && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <AIOutput text={output} loading={busy === "roadmap"} />
                {!!output && !busy && <Button size="sm" variant="outline" className="mt-3" onClick={saveOutput}>Save</Button>}
              </div>
            )}
          </TabsContent>

          {/* Interview */}
          <TabsContent value="interview" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 grid gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role you're interviewing for</Label>
                <Input value={profile.target_role || ""} onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                  placeholder="Graduate trainee, operations" />
              </div>
              <Button
                className="gap-2"
                disabled={busy === "interview"}
                onClick={() => run("interview", { target: profile.target_role, profile: profileText() }, "Interview prep")}
              >
                {busy === "interview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
                Prepare me
              </Button>
              <p className="text-xs text-muted-foreground">Uses the details from your CV profile to ground the answers.</p>
            </div>
            {(output || busy) && lastTask === "interview" && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <AIOutput text={output} loading={busy === "interview"} />
                {!!output && !busy && <Button size="sm" variant="outline" className="mt-3" onClick={saveOutput}>Save</Button>}
              </div>
            )}
          </TabsContent>
      </Tabs>
    </CampusShell>
  );
};

export default CampusCareer;
