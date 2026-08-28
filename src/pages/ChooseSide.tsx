import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, Briefcase, ArrowRight, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppSide, type AppSide } from "@/hooks/useAppSide";
import { useAcademicStage } from "@/hooks/useAcademicStage";
import { stageLabel } from "@/lib/academicStages";
import eduraLogo from "@/assets/edura-logo.png";

const SIDES: {
  key: AppSide;
  title: string;
  tagline: string;
  icon: typeof GraduationCap;
  points: string[];
}[] = [
  {
    key: "cbt",
    title: "CBT Practice",
    tagline: "Prepare and pass your exams",
    icon: GraduationCap,
    points: [
      "JAMB, WAEC, NECO & Post-UTME practice",
      "Study hub, lessons and past questions",
      "Performance reports and leaderboards",
    ],
  },
  {
    key: "services",
    title: "Educational Services",
    tagline: "Everything else students need",
    icon: Briefcase,
    points: [
      "e-PINs, registrations and result checking",
      "Admissions support and school finder",
      "Wallet, requests and scholarships",
    ],
  },
];

const ChooseSide = () => {
  const { chooseSide, side } = useAppSide();
  const { stage, isCampus, loading } = useAcademicStage();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Choose your Edura experience";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Never force Journey during account restoration; it remains an explicit
  // profile/settings action only.
  if (!stage) return <Navigate to="/dashboard" replace />;
  // Higher institution students belong on Campus
  if (isCampus) return <Navigate to="/campus" replace />;

  const select = (next: AppSide) => {
    chooseSide(next);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <img src={eduraLogo} alt="Edura" className="h-8 w-auto" />
          <Button variant="ghost" size="sm" onClick={() => navigate("/campus/journey")}>
            {stageLabel(stage)} · Change
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Where do you want to start?</h1>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            Based on your journey, these two are for you. You can switch anytime from your dashboard.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {SIDES.map((item) => {
            const Icon = item.icon;
            const active = side === item.key;
            return (
              <Card
                key={item.key}
                role="button"
                tabIndex={0}
                onClick={() => select(item.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(item.key);
                  }
                }}
                className={`group cursor-pointer p-6 border transition-colors hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring ${
                  active ? "border-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-muted border">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>

                <ul className="mt-5 space-y-2">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ChooseSide;
