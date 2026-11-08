export interface AdminUserActivity {
  auth_user_id: string;
  auth_created_at: string | null;
  last_login_at: string | null;
}

export interface AdminUserRecord {
  id: string;
  auth_user_id?: string | null;
  created_at?: string | null;
  auth_created_at?: string | null;
  last_login_at?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  is_suspended?: boolean | null;
  is_verified?: boolean | null;
  [key: string]: unknown;
}

export type EnrollmentWindow = 'all' | '24h' | '7d' | '30d' | '90d';
export type LoginWindow = 'all' | '7d' | '30d' | '90d' | 'never';
export type AccountFilter = 'all' | 'active' | 'suspended';
export type VerificationFilter = 'all' | 'verified' | 'unverified';
export type UserSort = 'newest' | 'recent-login' | 'name';

export interface AdminUserFilters {
  search?: string;
  enrollment?: EnrollmentWindow;
  login?: LoginWindow;
  account?: AccountFilter;
  verification?: VerificationFilter;
  sort?: UserSort;
}

const enrollmentTime = (user: AdminUserRecord): number | null => {
  const value = user.auth_created_at || user.created_at;
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const loginTime = (user: AdminUserRecord): number | null => {
  if (!user.last_login_at) return null;
  const timestamp = new Date(user.last_login_at).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const withinHours = (timestamp: number | null, hours: number, now: number) =>
  timestamp !== null && timestamp <= now && timestamp >= now - hours * 60 * 60 * 1000;

export const getEnrollmentTimestamp = (user: AdminUserRecord): string | null => {
  const timestamp = enrollmentTime(user);
  return timestamp === null ? null : new Date(timestamp).toISOString();
};

export const mergeAuthActivity = <T extends AdminUserRecord>(
  profiles: T[],
  activities: AdminUserActivity[],
): T[] => {
  const byAuthId = new Map(activities.map((activity) => [activity.auth_user_id, activity]));
  return profiles.map((profile) => {
    if (!profile.auth_user_id) return profile;
    const activity = byAuthId.get(profile.auth_user_id);
    if (!activity) return profile;
    return {
      ...profile,
      auth_created_at: activity.auth_created_at,
      last_login_at: activity.last_login_at,
    };
  });
};

export const countUsersJoinedWithinHours = (
  users: AdminUserRecord[],
  hours: number,
  now = Date.now(),
) => users.filter((user) => withinHours(enrollmentTime(user), hours, now)).length;

export const countUsersLoggedInWithinDays = (
  users: AdminUserRecord[],
  days: number,
  now = Date.now(),
) => users.filter((user) => withinHours(loginTime(user), days * 24, now)).length;

export const filterAdminUsers = <T extends AdminUserRecord>(
  users: T[],
  filters: AdminUserFilters = {},
  now = Date.now(),
): T[] => {
  const query = filters.search?.trim().toLowerCase() || '';
  const enrollmentHours: Record<Exclude<EnrollmentWindow, 'all'>, number> = {
    '24h': 24,
    '7d': 7 * 24,
    '30d': 30 * 24,
    '90d': 90 * 24,
  };
  const loginDays: Record<Exclude<LoginWindow, 'all' | 'never'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const filtered = users.filter((user) => {
    if (query) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      if (!name.includes(query) && !(user.email || '').toLowerCase().includes(query)) return false;
    }

    if (filters.enrollment && filters.enrollment !== 'all') {
      if (!withinHours(enrollmentTime(user), enrollmentHours[filters.enrollment], now)) return false;
    }

    if (filters.login === 'never' && loginTime(user) !== null) return false;
    if (filters.login && filters.login !== 'all' && filters.login !== 'never') {
      if (!withinHours(loginTime(user), loginDays[filters.login] * 24, now)) return false;
    }

    if (filters.account === 'active' && user.is_suspended) return false;
    if (filters.account === 'suspended' && !user.is_suspended) return false;
    if (filters.verification === 'verified' && !user.is_verified) return false;
    if (filters.verification === 'unverified' && user.is_verified) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === 'name') {
      const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim();
      const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim();
      return aName.localeCompare(bName);
    }
    if (filters.sort === 'recent-login') return (loginTime(b) ?? -Infinity) - (loginTime(a) ?? -Infinity);
    return (enrollmentTime(b) ?? -Infinity) - (enrollmentTime(a) ?? -Infinity);
  });
};