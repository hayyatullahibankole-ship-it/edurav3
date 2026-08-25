import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Check, Layers, Sparkles, Wallet, X } from "lucide-react";

const KEY = "edura_get_started_dismissed";

type Step = {
  to: string;
  icon: typeof BookOpen;
  title: string;
  detail: string;
};

const STEPS: Step[] = [
  {
    to: "/cbt",
    icon: BookOpen,
    title: "Take a practice test",
    detail: "Pick your exam and subjects, then answer in a real CBT screen.",
  },
  {
    to: "/decks",
    icon: Layers,
    title: "Turn your notes into quizzes",
    detail: "Upload a PDF and study it section by section with a quiz gate.",
  },
  {
    to: "/ai-tutor",
    icon: Sparkles,
    title: "Ask the AI tutor",
    detail: "Stuck on a question? Get a step-by-step explanation instantly.",
  },
  {
    to: "/services",
    icon: Wallet,
    title: "Check results & buy e-PINs",
    detail: "WAEC, NECO and JAMB services paid from your Edura wallet.",
  },
];

/**
 * First-run explainer for new candidates so the app is not a wall of tiles.
 * Dismissed permanently once the student closes it.
 */
export default function GetStartedGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem(KEY) !== "true");
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "true");
    setShow(false);
  };

  return (
    <section className="rounded-2xl border border-info/15 bg-info/5 p-4 animate-screen-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-extrabold">Your first steps</h2>
          <p className="text-xs text-muted-foreground">
            Four things students do first. Tap any one to try it.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss getting started guide"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="mt-3 grid grid-cols-2 gap-2">
        {STEPS.slice(0, 4).map((step, i) => (
          <li key={step.to}>
            <Link
              to={step.to}
              className="press flex min-h-20 items-start gap-2 rounded-xl border border-info/10 bg-card p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <step.icon className="h-4 w-4 text-primary" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold leading-snug">
                  {i + 1}. {step.title}
                </span>
                <span className="mt-1 block text-[10px] leading-snug text-muted-foreground">{step.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <button
        onClick={dismiss}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground"
      >
        <Check className="h-3.5 w-3.5" /> Got it, hide this
      </button>
    </section>
  );
}
