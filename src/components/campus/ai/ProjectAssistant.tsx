import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AIOutput from "@/components/campus/ai/AIOutput";
import PremiumGate from "@/components/campus/ai/PremiumGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, Crown, Lightbulb, ListTree, PenLine, FileText, MessageSquare, Quote } from "lucide-react";
import {
  runCampusAI,
  fetchCampusAIQuota,
  CampusAIError,
  type CampusAIQuota,
  type CampusAITask,
} from "@/lib/campusAI";

const CHAPTERS = ["Chapter One", "Chapter Two", "Chapter Three", "Chapter Four", "Chapter Five"];

interface ProjectAssistantProps {
  project: any;
  onMilestonesChanged?: () => void;
}

/** AI layer over the student's own final-year project record. */
export const ProjectAssistant = ({ project, onMilestonesChanged }: ProjectAssistantProps) => {
  const { user } = useAuth();
  const [quota, setQuota] = useState<CampusAIQuota | null>(null);
  const [busy, setBusy] = useState<CampusAITask | null>(null);
  const [output, setOutput] = useState("");
  const [lastTask, setLastTask] = useState<CampusAITask | null>(null);
  const [lastTitle, setLastTitle] = useState("");

  const [interest, setInterest] = useState("");
  const [department, setDepartment] = useState(project?.department || "");
  const [chapter, setChapter] = useState("Chapter One");
  const [kind, setKind] = useState("abstract");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sources, setSources] = useState("");
  const [style, setStyle] = useState("APA");

  useEffect(() => { fetchCampusAIQuota().then(setQuota); }, [user]);

  const run = async (task: CampusAITask, input: Record<string, unknown>, title: string) => {
    setBusy(task);
    setOutput("");
    setLastTask(task);
    setLastTitle(title);
    try {
      const { quota: q } = await runCampusAI(task, input, setOutput);
      if (q) setQuota(q);
    } catch (e) {
      const err = e as CampusAIError;
      toast.error(err.message);
      if (err.limitReached) fetchCampusAIQuota().then(setQuota);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!user || !output || !lastTask) return;
    const { error } = await supabase.from("campus_ai_sessions").insert({
      user_id: user.id,
      project_id: project?.id ?? null,
      kind: lastTask,
      title: lastTitle || "Project note",
      content: output,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved to your project");
  };

  /** Turn supervisor feedback into milestone rows the student can tick off. */
  const addFeedbackTasks = async () => {
    if (!user || !project || !output) return;
    const items = output
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^\s*(\*{0,2}\d+[\.\)]|[-•])\s+/.test(l))
      .map((l) => l.replace(/^\s*(\*{0,2}\d+[\.\)]|[-•])\s+/, "").replace(/\*\*/g, "").trim())
      .filter((l) => l.length > 4)
      .slice(0, 12);
    if (!items.length) return toast.error("No action items found in that answer");

    const { count } = await supabase
      .from("campus_project_milestones")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    const { error } = await supabase.from("campus_project_milestones").insert(
      items.map((title, i) => ({
        user_id: user.id,
        project_id: project.id,
        title,
        position: (count ?? 0) + i,
      })),
    );
    if (error) return toast.error(error.message);
    toast.success(`Added ${items.length} action items`);
    onMilestonesChanged?.();
  };

  if (quota && !quota.isPremium) {
    return (
      <div className="md:col-span-12">
        <PremiumGate title="Project Assistant is a Premium feature" />
      </div>
    );
  }

  return (
    <Card className="md:col-span-12">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Project Assistant
          </h3>
          {quota && (
            <Badge variant={quota.remaining > 0 ? "secondary" : "destructive"} className="text-[11px]">
              <Crown className="mr-1 h-3 w-3" />
              {quota.remaining} left today
            </Badge>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <Tabs defaultValue="topics">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="topics" className="text-xs">Topic</TabsTrigger>
                <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
                <TabsTrigger value="polish" className="text-xs">Polish</TabsTrigger>
              </TabsList>

              <TabsContent value="topics" className="space-y-3 pt-3">
                <div>
                  <Label>Department</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Microbiology" />
                </div>
                <div>
                  <Label>Area of interest</Label>
                  <Input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="e.g. water quality, fintech adoption" />
                </div>
                <Button className="w-full gap-2" disabled={busy !== null}
                  onClick={() => run("topics", { department, interest }, "Project topic ideas")}>
                  {busy === "topics" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                  Find project topics
                </Button>
                <Button variant="outline" className="w-full gap-2" disabled={busy !== null}
                  onClick={() => run("outline", {}, "Chapter outline")}>
                  {busy === "outline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListTree className="h-4 w-4" />}
                  Generate chapter outline
                </Button>
              </TabsContent>

              <TabsContent value="write" className="space-y-3 pt-3">
                <div>
                  <Label>Chapter</Label>
                  <Select value={chapter} onValueChange={setChapter}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHAPTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full gap-2" disabled={busy !== null}
                  onClick={() => run("chapter", { chapter }, `${chapter} guidance`)}>
                  {busy === "chapter" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                  Coach me through {chapter}
                </Button>

                <div className="rounded-xl border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Abstract / proposal</Label>
                    <Select value={kind} onValueChange={setKind}>
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea rows={2} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Objectives" />
                  <Textarea rows={2} value={methodology} onChange={(e) => setMethodology(e.target.value)} placeholder="Methodology" />
                  <Button variant="outline" className="w-full gap-2" disabled={busy !== null}
                    onClick={() => run("abstract", { kind, objectives, methodology }, kind === "proposal" ? "Proposal draft" : "Abstract draft")}>
                    {busy === "abstract" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Draft {kind}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="polish" className="space-y-3 pt-3">
                <div>
                  <Label>Supervisor feedback</Label>
                  <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Paste what your supervisor said…" />
                </div>
                <Button className="w-full gap-2" disabled={busy !== null || !feedback.trim()}
                  onClick={() => run("feedback", { feedback }, "Supervisor action list")}>
                  {busy === "feedback" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  Turn into action list
                </Button>

                <div className="rounded-xl border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">References</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["APA", "MLA", "Harvard"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea rows={3} value={sources} onChange={(e) => setSources(e.target.value)} placeholder="Paste your sources, one per line" />
                  <Button variant="outline" className="w-full gap-2" disabled={busy !== null || !sources.trim()}
                    onClick={() => run("references", { sources, style }, `${style} references`)}>
                    {busy === "references" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Quote className="h-4 w-4" />}
                    Format references
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="md:col-span-7">
            <AIOutput
              text={output}
              loading={busy !== null}
              placeholder="Pick a tool on the left — every answer is based on your saved project."
              actions={
                !!output && !busy && (
                  <>
                    {lastTask === "feedback" && (
                      <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2" onClick={addFeedbackTasks}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Add as tasks</span>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2" onClick={save}>
                      <Save className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs">Save</span>
                    </Button>
                  </>
                )
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectAssistant;
