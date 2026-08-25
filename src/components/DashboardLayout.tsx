import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import AppShell from "@/components/edura/AppShell";

interface DashboardLayoutProps {
  children: ReactNode;
  schoolInfo?: {
    name: string;
    logo_url: string;
    school_code: string;
  } | null;
}

export const DashboardLayout = ({ children, schoolInfo }: DashboardLayoutProps) => {
  const { pathname } = useLocation();
  const title = pathname.startsWith("/forum")
    ? "Student Forum"
    : pathname.startsWith("/study-hub")
      ? "Study Hub"
      : pathname.startsWith("/challenge")
        ? "Challenge Arena"
        : pathname.startsWith("/resources")
          ? "Resources"
          : pathname.startsWith("/study-planner")
            ? "Study Planner"
            : pathname.startsWith("/performance")
              ? "Performance"
              : pathname.startsWith("/referral")
                ? "Referrals"
                : schoolInfo?.name ?? "Edura";

  return <AppShell side="cbt" title={title}>{children}</AppShell>;
};
