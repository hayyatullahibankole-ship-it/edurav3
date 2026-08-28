/**
 * Resolves the in-app destination for a notification.
 * Priority: explicit route stored on the notification -> sensible default per type.
 */
export interface RoutableNotification {
  type?: string | null;
  metadata?: Record<string, any> | null;
}

const TYPE_ROUTES: Record<string, string> = {
  result: "/results",
  results: "/results",
  exam: "/cbt",
  exam_reminder: "/cbt",
  practice: "/cbt",
  subscription: "/payment",
  subscription_expiry: "/payment",
  trial: "/payment",
  payment: "/wallet",
  wallet: "/wallet",
  transaction: "/wallet",
  referral: "/referrals",
  forum: "/forum",
  ebook: "/ebooks",
  streak: "/dashboard",
  achievement: "/dashboard",
  leaderboard: "/leaderboard",
  challenge: "/challenges",
  service: "/services",
  campus: "/campus",
  campus_material: "/campus/academics",
  campus_project: "/campus/projects",
  campus_opportunity: "/campus/opportunities",
  campus_task: "/campus/academics",
};

const CAMPUS_FALLBACK = "/campus/notifications";
const CANDIDATE_FALLBACK = "/notifications";

export function resolveNotificationRoute(
  n: RoutableNotification,
  opts: { campus?: boolean } = {}
): string {
  const meta = n.metadata || {};
  const explicit = meta.route ?? meta.link ?? meta.url ?? meta.path;
  if (typeof explicit === "string" && explicit.startsWith("/")) return explicit;

  const type = (n.type || "").toLowerCase();
  if (TYPE_ROUTES[type]) {
    const route = TYPE_ROUTES[type];
    // Keep campus users inside the campus workspace where an equivalent exists.
    if (opts.campus && route === "/dashboard") return "/campus";
    return route;
  }

  return opts.campus ? CAMPUS_FALLBACK : CANDIDATE_FALLBACK;
}
