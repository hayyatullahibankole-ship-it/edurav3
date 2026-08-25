import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAcademicStage } from "@/hooks/useAcademicStage";
import { ACADEMIC_STAGES, STUDY_LEVELS, isCampusStage, type AcademicStage } from "@/lib/academicStages";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, GraduationCap, School } from "lucide-react";
import { cn } from "@/lib/utils";
import eduraLogo from "@/assets/edura-logo.png";

const GROUPS = [
  {
    title: "Secondary school & exam candidates",
    note: "You'll get CBT practice and educational services",
    icon: GraduationCap,
    stages: ACADEMIC_STAGES.filter((s) => s.dashboard === "core"),
  },
  {
    title: "Higher institution",
    note: "You'll get Edura Campus",
    icon: School,
    stages: ACADEMIC_STAGES.filter((s) => s.dashboard === "campus"),
  },
];

const CampusJourney = () => {
  const navigate = useNavigate();
  const { stage, institution_name, faculty, department, study_level, matric_number, loading, updateProfile } =
    useAcademicStage();

  const [selected, setSelected] = useState<AcademicStage | null>(null);
  const [details, setDetails] = useState({
    institution_name: "",
    faculty: "",
    department: "",
    study_level: "",
    matric_number: "",
  });
  const [saving, setSaving] = useState(false);

  const firstTime = !loading && !stage;

  useEffect(() => {
    document.title = "Your academic journey | Edura";
  }, []);

  useEffect(() => {
    if (loading) return;
    let initialSelected = (stage as AcademicStage) ?? null;

    if (!initialSelected) {
      const preferred = localStorage.getItem("preferredJourney");
      if (preferred === "campus") initialSelected = "undergraduate";
      else if (preferred === "candidate") initialSelected = "jamb_candidate";
    }

    setSelected(initialSelected);
    setDetails({
      institution_name: institution_name ?? "",
      faculty: faculty ?? "",
      department: department ?? "",
      study_level: study_level ?? "",
      matric_number: matric_number ?? "",
    });
  }, [loading, stage, institution_name, faculty, department, study_level, matric_number]);

  const save = async () => {
    if (!selected) return toast.error("Pick your current stage");
    setSaving(true);
    const { error } = await updateProfile({
      academic_stage: selected,
      institution_name: details.institution_name.trim() || null,
      faculty: details.faculty.trim() || null,
      department: details.department.trim() || null,
      study_level: details.study_level || null,
      matric_number: details.matric_number.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Journey saved");
    navigate(isCampusStage(selected) ? "/campus" : "/choose", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <img src={eduraLogo} alt="Edura" className="h-8 w-auto" />
          {!firstTime && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Step 1 of 2</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          {firstTime ? "Welcome — where are you right now?" : "Your academic journey"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Edura is built for students from SS 3 all the way to graduate. Tell us your stage and we'll open the right
          experience — exam prep and services for candidates, Edura Campus for higher institution.
        </p>

        <div className="mt-8 space-y-8">
          {GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">{group.title}</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{group.note}</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.stages.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSelected(s.key)}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-colors",
                        selected === s.key ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{s.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                        </div>
                        {selected === s.key && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isCampusStage(selected) && (
          <Card className="mt-8">
            <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Institution</Label>
                <Input
                  value={details.institution_name}
                  onChange={(e) => setDetails({ ...details, institution_name: e.target.value })}
                  placeholder="University of Ibadan"
                />
              </div>
              <div>
                <Label>Faculty</Label>
                <Input value={details.faculty} onChange={(e) => setDetails({ ...details, faculty: e.target.value })} />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  value={details.department}
                  onChange={(e) => setDetails({ ...details, department: e.target.value })}
                />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={details.study_level} onValueChange={(v) => setDetails({ ...details, study_level: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {STUDY_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Matric number</Label>
                <Input
                  value={details.matric_number}
                  onChange={(e) => setDetails({ ...details, matric_number: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="mt-8 w-full sm:w-auto" size="lg" onClick={save} disabled={saving || !selected}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CampusJourney;
