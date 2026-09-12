import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Calculator,
  ClipboardList,
  Compass,
  GraduationCap,
  LogOut,
  Settings,
  Wallet,
  CreditCard,
  Gift,
  Headphones,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { label: "Career & CV", description: "Build a CV and career roadmap", icon: Briefcase, to: "/campus/career" },
  { label: "SIWES / IT", description: "Keep a supervisor-ready logbook", icon: ClipboardList, to: "/campus/logbook?kind=siwes" },
  { label: "Teaching practice", description: "Plan and polish your entries", icon: GraduationCap, to: "/campus/logbook?kind=teaching_practice" },
  { label: "NYSC Hub", description: "Track each service-year step", icon: Compass, to: "/campus/nysc" },
  { label: "Study tools", description: "CGPA, timetable and deadlines", icon: Calculator, to: "/campus/tools" },
  { label: "Wallet", description: "Fund and manage your balance", icon: Wallet, to: "/wallet" },
  { label: "Subscription", description: "Plan, upgrade and billing", icon: CreditCard, to: "/payment?scope=campus" },
  { label: "Referrals", description: "Invite friends and earn", icon: Gift, to: "/referral-program" },
  { label: "Support", description: "Get help from our team", icon: Headphones, to: "/support" },
];

export const CampusMoreSheet = ({
  open,
  onOpenChange,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}) => {
  const navigate = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[1.5rem] p-0 pb-safe">
        <SheetHeader className="border-b px-5 py-5 text-left">
          <SheetTitle className="font-display text-xl">More tools</SheetTitle>
          <SheetDescription>Career, placement, money and account tools.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 p-4">
          {ITEMS.map((item) => (
            <Button
              key={item.to}
              type="button"
              variant="outline"
              onClick={() => go(item.to)}
              className="press h-auto min-h-28 flex-col items-start justify-start gap-2 whitespace-normal rounded-2xl p-4 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-0.5 block text-[10px] font-normal leading-snug text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Button>
          ))}
        </div>
        <div className="space-y-2 border-t p-4">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => go("/settings")}>
            <Settings className="h-4 w-4" /> Settings & profile
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};