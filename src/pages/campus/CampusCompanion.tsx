import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CampusShell from "@/components/campus/CampusShell";
import AIOutput from "@/components/campus/ai/AIOutput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, BookOpen, ListChecks, FileText, Target, History, Crown, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
  runCampusAI,
  fetchCampusAIQuota,
  parseQuestions,
  CampusAIError,
  type CampusAIQuota,
  type CampusAITask,
} from "@/lib/campusAI";

const CampusCompanion = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [quota, setQuota] = useState<CampusAIQuota | null>(null);

  const [busy, setBusy] = useState<CampusAITask | null>(null);
  const [output, setOutput] = useState("");
  const [lastTask, setLastTask] = useState<CampusAITask | null>(null);
  const [lastTitle, setLastTitle] = useState("");

  // form state
  const [topic, setTopic] = useState("");
  const [qTopic, setQTopic] = useState("");
  const [qType, setQType] = useState("objective");
  const [qCount, setQCount] = useState("10");
  const [qDifficulty, setQDifficulty] = useState("medium");
  const [materialId, setMaterialId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "AI Course Companion | Edura Campus";
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const [c, m, s] = await Promise.all([
      supabase.from("campus_courses").select("*").eq("user_id", user.id).order("code"),
      supabase.from("campus_materials").select("id, title, kind, course_id").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("campus_ai_sessions").select("id, kind, title, content, course_id, created_at").eq("user_id", user.id).is("project_id", null).order("created_at", { ascending: false }).limit(20),
    ]);
    setCourses(c.data ?? []);
    setMaterials(m.data ?? []);
    setSessions(s.data ?? []);
    if (!courseId && c.data?.length) setCourseId(c.data[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchCampusAIQuota().then(setQuota); }, [user]);

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const courseMaterials = useMemo(
    () => materials.filter((m) => !courseId || m.course_id === courseId),
    [materials, courseId],
  );

  const run = async (task: CampusAITask, input: Record<string, unknown>, title: string) => {
    if (!courseId) return toast.error("Add a course first, then pick it above");
    setBusy(task);
    setOutput("");
    setLastTask(task);
    setLastTitle(title);
    try {
      const { quota: q } = await runCampusAI(task, { courseId, ...input }, setOutput);
      if (q) setQuota(q);
    } catch (e) {
      const err = e as CampusAIError;
      toast.error(err.message);
      if (err.limitReached) fetchCampusAIQuota().then(setQuota);
    } finally {
      setBusy(null);
    }
  };

  const saveSession = async () => {
    if (!user || !output || !lastTask) return;
    const { error } = await supabase.from("campus_ai_sessions").insert({
      user_id: user.id,
      course_id: courseId || null,
      kind: lastTask,
      title: lastTitle || "Saved answer",
      content: output,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved to this course");
    load();
  };

  const saveQuestionSet = async () => {
    if (!user || !output) return;
    const parsed = parseQuestions(output);
    if (!parsed.length) return toast.error("Couldn't read the questions — save as a note instead");
    const { data, error } = await supabase.from("campus_question_sets").insert({
      user_id: user.id,
      course_id: courseId || null,
      title: qTopic.trim() || `${course?.code || "Course"} practice set`,
      topic: qTopic.trim() || null,
      question_type: qType,
      difficulty: qDifficulty,
      question_count: parsed.length,
    }).select().single();
    if (error) return toast.error(error.message);
    const { error: qErr } = await supabase.from("campus_generated_questions").insert(
      parsed.map((q, i) => ({
        set_id: data.id,
        user_id: user.id,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        position: i,
      })),
    );
    if (qErr) return toast.error(qErr.message);
    toast.success(`Saved ${parsed.length} questions`);
  };

  const deleteSession = async (id: string) => {
    await supabase.from("campus_ai_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const outOfCredits = quota ? quota.remaining <= 0 : false;

  const quotaBadge = quota && (
    <div className="flex items-center gap-2">
      <Badge variant={quota.remaining > 0 ? "secondary" : "destructive"} className="text-[11px]">
        <Zap className="mr-1 h-3 w-3" />
        {quota.remaining} / {quota.limit} credits left today
      </Badge>
      {!quota.isPremium && (
        <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-[11px]">
          <Link to="/payment?scope=campus"><Crown className="h-3 w-3" /> Get more</Link>
        </Button>
      )}
    </div>
  );

  return (
    <CampusShell
      title="AI Course Companion"
      subtitle="Explanations, practice questions and exam predictions — grounded in your own courses."
      action={quotaBadge}
    >
      {outOfCredits ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">You've used today's {quota?.limit} credits</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your free credits reset at midnight. Upgrade to Edura Campus Premium for a much larger daily
              allowance across the Course Companion and Project Assistant.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link to="/payment?scope=campus"><Crown className="h-4 w-4" /> View Campus plans</Link>
            </Button>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Add your courses in Academics first — the companion only works from the courses you're actually taking.
          </p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <Card>
              <CardContent className="p-4">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Working course</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Pick a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {course && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {course.units || 0} units{course.semester ? ` · ${course.semester}` : ""}{course.lecturer ? ` · ${course.lecturer}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="explain">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="explain" className="text-xs">Explain</TabsTrigger>
                <TabsTrigger value="questions" className="text-xs">Questions</TabsTrigger>
                <TabsTrigger value="material" className="text-xs">Material</TabsTrigger>
                <TabsTrigger value="predict" className="text-xs">Predict</TabsTrigger>
              </TabsList>

              <TabsContent value="explain">
                <Card><CardContent className="space-y-3 p-4">
                  <div>
                    <Label>Topic</Label>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Kirchhoff's laws" />
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={busy !== null || !topic.trim()}
                    onClick={() => run("explain", { topic: topic.trim() }, `Explain: ${topic.trim()}`)}
                  >
                    {busy === "explain" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Explain this topic
                  </Button>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="questions">
                <Card><CardContent className="space-y-3 p-4">
                  <div>
                    <Label>Topic (optional)</Label>
                    <Input value={qTopic} onChange={(e) => setQTopic(e.target.value)} placeholder="Leave blank for the whole course" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={qType} onValueChange={setQType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="objective">Objective</SelectItem>
                          <SelectItem value="theory">Theory</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Count</Label>
                      <Select value={qCount} onValueChange={setQCount}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["5", "10", "15", "20"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Level</Label>
                      <Select value={qDifficulty} onValueChange={setQDifficulty}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={busy !== null}
                    onClick={() =>
                      run(
                        "questions",
                        { topic: qTopic.trim(), questionType: qType, count: Number(qCount), difficulty: qDifficulty },
                        `${qCount} ${qType} questions${qTopic ? ` — ${qTopic}` : ""}`,
                      )
                    }
                  >
                    {busy === "questions" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
                    Generate practice questions
                  </Button>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="material">
                <Card><CardContent className="space-y-3 p-4">
                  {courseMaterials.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No materials on this course yet. Upload one in Academics.
                    </p>
                  ) : (
                    <>
                      <div>
                        <Label>Material</Label>
                        <Select value={materialId} onValueChange={setMaterialId}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a material" /></SelectTrigger>
                          <SelectContent>
                            {courseMaterials.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Anything specific?</Label>
                        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. focus on chapter 3" />
                      </div>
                      <Button
                        className="w-full gap-2"
                        disabled={busy !== null || !materialId}
                        onClick={() => run("summarise", { materialId, notes }, "Material summary")}
                      >
                        {busy === "summarise" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Summarise this material
                      </Button>
                    </>
                  )}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="predict">
                <Card><CardContent className="space-y-3 p-4">
                  <p className="text-sm text-muted-foreground">
                    Get the topics most likely to come out in this course's exam, plus a one-week revision plan.
                  </p>
                  <Button
                    className="w-full gap-2"
                    disabled={busy !== null}
                    onClick={() => run("predict", {}, `Exam prediction — ${course?.code || "course"}`)}
                  >
                    {busy === "predict" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                    Predict my exam
                  </Button>
                </CardContent></Card>
              </TabsContent>
            </Tabs>

            {sessions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Saved answers</h3>
                  <ul className="mt-3 space-y-1.5">
                    {sessions.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => { setOutput(s.content); setLastTask(s.kind); setLastTitle(s.title); }}
                        >
                          <span className="block truncate text-sm">{s.title}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => deleteSession(s.id)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-7">
            <AIOutput
              text={output}
              loading={busy !== null}
              placeholder="Pick a course, choose a tool and your answer appears here."
              actions={
                !!output && !busy && (
                  <>
                    {lastTask === "questions" && (
                      <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2" onClick={saveQuestionSet}>
                        <ListChecks className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Save set</span>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2" onClick={saveSession}>
                      <Save className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs">Save</span>
                    </Button>
                  </>
                )
              }
            />
            {quota?.isPremium && quota.remaining <= 5 && (
              <p className="mt-3 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
                {quota.remaining} Campus AI actions left today — your allowance resets tomorrow.
              </p>
            )}
          </div>
        </div>
      )}
    </CampusShell>
  );
};

export default CampusCompanion;
