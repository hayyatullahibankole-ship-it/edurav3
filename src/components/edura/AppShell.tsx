import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BookOpen,
  FolderKanban,
  Compass,
  Wallet as WalletIcon,
  UserCog,
  GraduationCap,
  Briefcase,
  Calculator,
  Sparkles,
  MoreHorizontal,

  Settings as SettingsIcon,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/NotificationBell";
import { DashboardThemeMenu } from "@/components/DashboardThemeMenu";
import { ExploreSheet } from "@/components/edura/ExploreSheet";
import { CampusMoreSheet } from "@/components/edura/CampusMoreSheet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import eduraLogo from "@/assets/edura-logo.png";

export type ShellSide = "cbt" | "services" | "campus";

export type ShellNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

/**
 * Four labelled tabs for every candidate surface. The raised centre action sits
 * between CBT and Services and is rendered separately.
 */
const CANDIDATE_NAV: ShellNavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutGrid, end: true },
  { to: "/cbt", label: "CBT", icon: GraduationCap },
  { to: "/services", label: "Services", icon: Briefcase },
  { to: "/wallet", label: "Wallet", icon: WalletIcon },
];

const CAMPUS_NAV: ShellNavItem[] = [
  { to: "/campus", label: "Home", icon: LayoutGrid, end: true },
  { to: "/campus/academics", label: "Academics", icon: BookOpen },
  { to: "/campus/companion", label: "AI", icon: Sparkles },
  { to: "/campus/projects", label: "Projects", icon: FolderKanban },
];

/** Extra destinations that only appear in the desktop rail. */
const DESKTOP_EXTRAS: Record<ShellSide, ShellNavItem[]> = {
  cbt: [{ to: "/study-hub", label: "Study hub", icon: BookOpen }],
  services: [{ to: "/study-hub", label: "Study hub", icon: BookOpen }],
  campus: [
    { to: "/campus/tools", label: "Study tools", icon: Calculator },
    { to: "/campus/opportunities", label: "Opportunities", icon: Compass },
    { to: "/wallet", label: "Wallet", icon: WalletIcon },
  ],
};


const NAV: Record<ShellSide, ShellNavItem[]> = {
  cbt: CANDIDATE_NAV,
  services: CANDIDATE_NAV,
  campus: CAMPUS_NAV,
};

const SIDE_META: Record<ShellSide, { label: string }> = {
  cbt: { label: "Edura" },
  services: { label: "Edura" },
  campus: { label: "Campus" },
};

type CenterAction = { icon: LucideIcon; onClick: () => void; label: string };

/**
 * Shared native-style bottom tab bar: four labelled tabs with one central action.
 */
export const MobileTabBar = ({
  items = CANDIDATE_NAV,
  center,
}: {
  items?: ShellNavItem[];
  center?: CenterAction;
}) => {
  const [exploreOpen, setExploreOpen] = useState(false);
  const action: CenterAction =
    center ?? { icon: Compass, label: "Explore", onClick: () => setExploreOpen(true) };
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  const tab = (item: ShellNavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className="press flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5"
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "flex h-7 w-10 items-center justify-center rounded-xl transition-colors duration-200",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon
              className={cn("h-[18px] w-[18px] transition-transform", isActive && "scale-110")}
              strokeWidth={isActive ? 2.4 : 1.9}
            />
          </span>
          <span
            className={cn(
              "max-w-full truncate px-0.5 text-[9px] transition-colors",
              isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-safe backdrop-blur-xl lg:hidden">
        <div className="relative mx-auto h-[64px] max-w-md">
          <div className="relative flex h-full items-center px-1.5">
            {left.map(tab)}
            <div className="flex flex-1 justify-center">
              <button
                type="button"
                aria-label={action.label}
                onClick={action.onClick}
                className="press -mt-7 flex h-[58px] w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl border-4 border-background bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              >
                <action.icon className="h-6 w-6" strokeWidth={2.3} />
                <span className="text-[9px] font-bold leading-none">{action.label}</span>
              </button>
            </div>

            {right.map(tab)}
          </div>
        </div>
      </nav>

      {!center && <ExploreSheet open={exploreOpen} onOpenChange={setExploreOpen} />}
    </>
  );
};

interface AppShellProps {
  side: ShellSide;
  title: string;
  subtitle?: string;
  /** small pills under the title, e.g. stage / department */
  meta?: ReactNode;
  action?: ReactNode;
  /** override the default nav for this side */
  nav?: ShellNavItem[];
  children: ReactNode;
}

/**
 * One shell for every logged-in surface of Edura: a quiet left rail on desktop,
 * a compact top bar plus bottom nav on mobile. Nav content is side-aware.
 */
export const AppShell = ({ side, title, subtitle, meta, action, nav, children }: AppShellProps) => {
  const navigate = useNavigate();
  const items = nav ?? NAV[side];
  const railItems = [...items, ...DESKTOP_EXTRAS[side]];
  const sideMeta = SIDE_META[side];
  const { signOut, userProfile, user } = useAuth();
  const { toast } = useToast();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [campusMoreOpen, setCampusMoreOpen] = useState(false);

  // Warm the other tab bundles while the device is idle so switching tabs is
  // instant instead of showing a loader every time.
  useEffect(() => {
    const warm = () => {
      void import("@/pages/Dashboard");
      void import("@/pages/CBTHome");
      void import("@/pages/ServicesHome");
      void import("@/pages/Wallet");
    };
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void) => number)
      | undefined;
    const id = ric ? ric(warm) : window.setTimeout(warm, 1500);
    return () => {
      const cic = (window as any).cancelIdleCallback as ((h: number) => void) | undefined;
      if (ric && cic) cic(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);



  const handleLogout = async () => {
    try {
      toast({ title: "Logging out...", description: "Please wait" });
      await signOut();
      window.sessionStorage.clear();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  const displayName =
    [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    "Student";
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const railLink = (item: ShellNavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );

  const avatarMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8 border">
            <AvatarImage
              src={(userProfile as any)?.profile_image_url || (userProfile as any)?.avatar_url || undefined}
              alt={displayName}
            />

            <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <UserCog className="h-4 w-4 mr-2" /> Edit profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings#journey")}>
          <GraduationCap className="h-4 w-4 mr-2" /> My journey
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings#security")}>
          <SettingsIcon className="h-4 w-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop rail */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r bg-card">
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <img src={eduraLogo} alt="Edura" className="h-7 w-auto" />
          <Badge variant="outline" className="text-[10px] font-semibold">{sideMeta.label}</Badge>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">{railItems.map(railLink)}</nav>
        <div className="p-3 border-t space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-muted-foreground"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b bg-card/90 pt-safe backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              {avatarMenu}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{sideMeta.label}</p>
                <p className="truncate font-display text-sm font-bold">{title}</p>
              </div>
            </div>
            <p className="hidden lg:block text-sm font-semibold truncate">{title}</p>
            <div className="flex items-center gap-1.5">
              <DashboardThemeMenu />
              <NotificationBell />
              <span className="hidden lg:inline-flex">{avatarMenu}</span>
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-4 pb-24 sm:px-6 sm:py-7 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl animate-screen-in">
            <div className="mb-4 hidden flex-wrap items-start justify-between gap-3 lg:flex">
              <div className="min-w-0">
                <h1 className="font-display text-[22px] sm:text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                {meta && <div className="mt-2 flex flex-wrap gap-1.5">{meta}</div>}
              </div>

              {action}
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileTabBar
        items={items}
        center={
          side === "campus"
            ? { icon: MoreHorizontal, label: "More", onClick: () => setCampusMoreOpen(true) }
            : { icon: Compass, label: "Explore", onClick: () => setExploreOpen(true) }
        }
      />
      {side !== "campus" && <ExploreSheet open={exploreOpen} onOpenChange={setExploreOpen} />}
      {side === "campus" && (
        <CampusMoreSheet open={campusMoreOpen} onOpenChange={setCampusMoreOpen} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default AppShell;
