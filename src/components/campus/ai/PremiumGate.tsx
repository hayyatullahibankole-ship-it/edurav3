import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Check } from "lucide-react";

const PERKS = [
  "Explain any topic in your own courses",
  "Generate & save practice past questions",
  "Summarise your uploaded materials",
  "Exam predictions and revision plans",
  "Full project assistant: topics, outlines, chapters, abstracts",
];

/** Shown to students without an active Edura subscription. */
export const PremiumGate = ({ title = "Campus AI is a Premium feature" }: { title?: string }) => (
  <Card>
    <CardContent className="p-6 sm:p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Subscribe to Edura Premium to unlock the AI Course Companion and Project Assistant, grounded in your
        own courses, materials and final-year project.
      </p>

      <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{p}</span>
          </li>
        ))}
      </ul>

      <Button asChild className="mt-6 gap-2">
        <Link to="/payment">
          <Crown className="h-4 w-4" /> Upgrade to Premium
        </Link>
      </Button>
    </CardContent>
  </Card>
);

export default PremiumGate;
