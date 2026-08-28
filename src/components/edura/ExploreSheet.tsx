import { useNavigate } from "react-router-dom";
import ScheduleTestModal from "@/components/ScheduleTestModal";
import ExamBadge from "@/components/edura/ExamBadge";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  GraduationCap,
  Wallet,
  Building2,
  Trophy,
  Bot,
  FolderOpen,
  BookOpen,
  MessageSquare,
  Sword,
  Newspaper,
  Library,
  Calendar,
  FileCheck,
  Award,
  Zap,
} from "lucide-react";

const tests: { examType: "jamb" | "waec" | "neco" | "post-utme"; label: string; icon: React.ElementType }[] = [
  { examType: "jamb", label: "JAMB", icon: GraduationCap },
  { examType: "waec", label: "WAEC", icon: FileCheck },
  { examType: "neco", label: "NECO", icon: Award },
  { examType: "post-utme", label: "Post-UTME", icon: Zap },
];

interface ExploreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const groups: {
  title: string;
  items: { label: string; description: string; icon: React.ElementType; path: string }[];
}[] = [
  {
    title: "Services",
    items: [
      {
        label: "Educational Services",
        description: "e-PINs, registrations, results",
        icon: GraduationCap,
        path: "/services",
      },
      {
        label: "Admissions",
        description: "Post-UTME & admission support",
        icon: Building2,
        path: "/services",
      },
      {
        label: "Wallet",
        description: "Fund, pay & track transactions",
        icon: Wallet,
        path: "/wallet",
      },
      {
        label: "Referrals",
        description: "Invite friends & earn rewards",
        icon: Gift,
        path: "/referral-program",
      },
      {
        label: "Subscription",
        description: "Plans, upgrade & billing",
        icon: CreditCard,
        path: "/payment",
      },
    ],
  },
  {
    title: "Learn",
    items: [
      { label: "Study Hub", description: "Lessons & topics", icon: BookOpen, path: "/study-hub" },
      { label: "Resources", description: "Past questions & books", icon: FolderOpen, path: "/resources" },
      { label: "Ebook Library", description: "Read exclusive books", icon: Library, path: "/ebooks" },
      { label: "AI Tutor", description: "Ask anything, get answers", icon: Bot, path: "/ai-tutor" },
    ],
  },
  {
    title: "Community & Growth",
    items: [
      { label: "Challenge Arena", description: "Compete with students", icon: Sword, path: "/challenge-arena" },
      { label: "Forum", description: "Ask & discuss", icon: MessageSquare, path: "/forum" },
      { label: "Campus Hub", description: "News & opportunities", icon: Newspaper, path: "/campus-hub" },
      { label: "Events", description: "Workshops & seminars", icon: Calendar, path: "/akboy/events" },
      { label: "Performance", description: "Your analytics report", icon: Trophy, path: "/performance-report" },
    ],
  },
];

export const ExploreSheet = ({ open, onOpenChange }: ExploreSheetProps) => {
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="border-b p-6 text-left">
          <SheetTitle className="text-2xl font-bold">Explore</SheetTitle>
          <SheetDescription>Everything EDURA offers, in one place</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-6">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Start a practice test
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {tests.map((test) => (
                <ScheduleTestModal key={test.examType} defaultExamType={test.examType}>
                  <button className="press flex flex-col items-center gap-2 rounded-2xl border bg-card p-3">
                    <ExamBadge exam={test.examType} size="sm" />
                    <span className="text-[11px] font-bold leading-tight">{test.label}</span>
                  </button>
                </ScheduleTestModal>
              ))}
            </div>
          </section>

          {groups.map((group, gi) => (
            <section key={group.title} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {group.items.map((item, i) => {
                  const tones = ["bg-mint text-mint-foreground", "bg-sky text-sky-foreground", "bg-butter text-butter-foreground", "bg-lilac text-lilac-foreground", "bg-peach text-peach-foreground"];
                  const tone = tones[(gi + i) % tones.length];
                  return (
                    <button
                      key={item.label}
                      onClick={() => go(item.path)}
                      className={`press flex min-h-32 flex-col rounded-[1.25rem] p-4 text-left ${tone}`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/50">
                        <item.icon className="h-5 w-5" strokeWidth={2.2} />
                      </span>
                      <span className="mt-auto pt-3 font-display text-sm font-extrabold leading-tight">{item.label}</span>
                      <span className="mt-1 text-[11px] font-medium leading-snug opacity-75">
                        {item.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

      </SheetContent>
    </Sheet>
  );
};

export default ExploreSheet;
