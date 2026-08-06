import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useAcademicStage } from "@/hooks/useAcademicStage";
import CampusShell from "@/components/campus/CampusShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  FolderKanban,
  Compass,
  Wallet as WalletIcon,
  CalendarClock,
  Plus,
  ArrowRight,
  Briefcase,
  GraduationCap,
  ClipboardList,
  Lock,
  Calculator,

  Sparkles,
} from "lucide-react";


const naira = (v: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(v || 0);

const JOURNEY_TILES = [
  { label: "SIWES / IT logbook", icon: ClipboardList, to: "/campus/logbook?kind=siwes" },
  { label: "Teaching Practice", icon: GraduationCap, to: "/campus/logbook?kind=teaching_practice" },
  { label: "NYSC Hub", icon: Compass, to: "/campus/nysc" },
  { label: "Career & CV", icon: Briefcase, to: "/campus/career" },
];

const CampusHome = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { balance } = useWallet();
  const { department, study_level, institution_name } = useAcademicStage();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [project, setProject] = useState<any | null>(null);
  const [nextMilestone, setNextMilestone] = useState<any | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Edura Campus | Your academic workspace";
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      const [c, p, o] = await Promise.all([
        supabase.from("campus_courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("campus_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase
          .from("campus_opportunities")
          .select("id, title, category, organisation, deadline, external_url")
          .eq("is_published", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      setCourses(c.data ?? []);
      const proj = p.data?.[0] ?? null;
      setProject(proj);
      setOpportunities(o.data ?? []);
      if (proj) {
        const { data: ms } = await supabase
          .from("campus_project_milestones")
          .select("*")
          .eq("project_id", proj.id)
          .eq("is_done", false)
          .order("position", { ascending: true })
          .limit(1);
        setNextMilestone(ms?.[0] ?? null);
      }
      setLoading(false);
    };
    run();
  }, [user]);

  const firstName = userProfile?.first_name || "there";
  const totalUnits = courses.reduce((sum, c) => sum + (c.units || 0), 0);

  return (
    <CampusShell
      title={`Welcome back, ${firstName}`}
      subtitle={institution_name ? `${institution_name}${department ? ` · ${department}` : ""}` : "Your university workspace — courses, projects and opportunities in one place."}
      action={
        <Button onClick={() => navigate("/campus/academics")} className="gap-2">
          <Plus className="h-4 w-4" /> Add course
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 auto-rows-min">
          {/* Row 1: Stats — same bento tiles as the CBT dashboard */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-1 md:col-span-3">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Courses</span>
            <h3 className="mt-2 text-3xl font-bold">{courses.length}</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 col-span-1 md:col-span-3">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Units</span>
            <h3 className="mt-2 text-3xl font-bold">{totalUnits}</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 col-span-1 md:col-span-3">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Level</span>
            <h3 className="mt-2 text-3xl font-bold text-primary">{study_level || "—"}</h3>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 col-span-1 md:col-span-3">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Wallet</span>
            <h3 className="mt-2 text-2xl font-bold">{naira(balance)}</h3>
          </div>

          {/* Courses */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" /> My courses
              </div>
              <Badge variant="secondary">{totalUnits} units</Badge>
            </div>
            {courses.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No courses yet. Add the courses you're taking this semester to organise your materials.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {courses.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.code}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[11px] shrink-0">{c.units}u</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="sm" className="mt-3 gap-1 px-0" onClick={() => navigate("/campus/academics")}>
              Open academics <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* AI Course Companion */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-8">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> AI Course Companion
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Explain any topic from your own courses, generate practice past questions with answers,
              summarise your uploaded materials and predict what's likely to come out.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate("/campus/companion")} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Open companion
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/campus/companion")}>
                Generate questions
              </Button>
            </div>
          </div>

          {/* Wallet action */}

          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <WalletIcon className="h-4 w-4 text-primary" /> Wallet
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight">{naira(balance)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Same wallet across all of Edura.</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate("/wallet")}>
              Fund wallet
            </Button>
          </div>

          {/* Project */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderKanban className="h-4 w-4 text-primary" /> Project
            </div>
            {project ? (
              <>
                <p className="mt-3 text-sm font-semibold line-clamp-2">{project.title}</p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">Stage: {project.stage}</p>
                {nextMilestone ? (
                  <div className="mt-3 rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Next milestone</p>
                    <p className="text-sm font-medium">{nextMilestone.title}</p>
                    {nextMilestone.due_date && (
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> Due {new Date(nextMilestone.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">All milestones done. Add the next chapter.</p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Track your project from proposal to defence — chapters, deadlines and supervisor feedback.
              </p>
            )}
            <Button variant="ghost" size="sm" className="mt-3 gap-1 px-0" onClick={() => navigate("/campus/projects")}>
              {project ? "Open project hub" : "Start a project"} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Study tools */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-7">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-primary" /> Study tools
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Track your CGPA, build your class timetable and never miss an assignment deadline.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "CGPA", icon: Calculator },
                { label: "Timetable", icon: CalendarClock },
                { label: "Deadlines", icon: ClipboardList },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-3 gap-1 px-0" onClick={() => navigate("/campus/tools")}>
              Open study tools <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Placement, service & career */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-12">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 text-primary" /> Placement, service & career
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Keep your logbook supervisor-ready, tick off every NYSC step, and build a CV that gets replies.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {JOURNEY_TILES.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className="flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-medium transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-card border border-border rounded-2xl p-5 col-span-2 md:col-span-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Compass className="h-4 w-4 text-primary" /> Opportunities
              </div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/campus/opportunities")}>
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            {opportunities.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No opportunities posted yet. Check back soon.</p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {opportunities.map((o) => (
                  <li key={o.id} className="rounded-xl border p-3">
                    <Badge variant="secondary" className="text-[10px] capitalize">{o.category}</Badge>
                    <p className="mt-2 text-sm font-medium line-clamp-2">{o.title}</p>
                    {o.deadline && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Closes {new Date(o.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      )}
    </CampusShell>
  );
};

export default CampusHome;
