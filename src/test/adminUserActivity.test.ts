import { describe, expect, it } from 'vitest';
import {
  countUsersJoinedWithinHours,
  countUsersLoggedInWithinDays,
  filterAdminUsers,
  getEnrollmentTimestamp,
  mergeAuthActivity,
} from '@/lib/adminUserActivity';

const now = new Date('2026-11-08T12:00:00.000Z').getTime();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

const users = [
  { id: 'u1', auth_user_id: 'a1', first_name: 'Ada', last_name: 'One', email: 'ada@example.test', created_at: daysAgo(2), auth_created_at: null, last_login_at: daysAgo(3), is_verified: true, is_suspended: false },
  { id: 'u2', auth_user_id: 'a2', first_name: 'Ben', last_name: 'Two', email: 'ben@example.test', created_at: daysAgo(40), auth_created_at: null, last_login_at: hoursAgo(2), is_verified: false, is_suspended: true },
  { id: 'u3', auth_user_id: null, first_name: 'Cy', last_name: 'Three', email: 'cy@example.test', created_at: daysAgo(100), auth_created_at: null, last_login_at: null, is_verified: true, is_suspended: false },
];

describe('admin user activity', () => {
  it('counts enrollments within the last 24 hours and excludes older or future dates', () => {
    expect(countUsersJoinedWithinHours([
      { ...users[0], created_at: hoursAgo(24) },
      { ...users[1], created_at: hoursAgo(24.01) },
      { ...users[2], created_at: hoursAgo(-1) },
    ], 24, now)).toBe(1);
  });

  it('counts recent logins only inside the selected 7, 30, and 90 day windows', () => {
    const records = [
      { ...users[0], last_login_at: daysAgo(6) },
      { ...users[1], last_login_at: daysAgo(20) },
      { ...users[2], last_login_at: daysAgo(60) },
      { id: 'u4', last_login_at: daysAgo(100) },
    ];
    expect(countUsersLoggedInWithinDays(records, 7, now)).toBe(1);
    expect(countUsersLoggedInWithinDays(records, 30, now)).toBe(2);
    expect(countUsersLoggedInWithinDays(records, 90, now)).toBe(3);
  });

  it('uses Auth creation time when available and keeps unlinked profiles', () => {
    const merged = mergeAuthActivity(users, [
      { auth_user_id: 'a1', auth_created_at: daysAgo(1), last_login_at: hoursAgo(1) },
    ]);
    expect(getEnrollmentTimestamp(merged[0])).toBe(daysAgo(1));
    expect(merged[0].last_login_at).toBe(hoursAgo(1));
    expect(merged[2]).toEqual(users[2]);
  });

  it('filters never-logged-in, suspended, and unverified users independently', () => {
    expect(filterAdminUsers(users, { login: 'never' }, now).map((user) => user.id)).toEqual(['u3']);
    expect(filterAdminUsers(users, { account: 'suspended' }, now).map((user) => user.id)).toEqual(['u2']);
    expect(filterAdminUsers(users, { verification: 'unverified' }, now).map((user) => user.id)).toEqual(['u2']);
    expect(filterAdminUsers(users, { account: 'active', verification: 'verified' }, now).map((user) => user.id)).toEqual(['u1', 'u3']);
  });

  it('searches by name or email and sorts by newest enrollment', () => {
    expect(filterAdminUsers(users, { search: 'BEN' }, now).map((user) => user.id)).toEqual(['u2']);
    expect(filterAdminUsers(users, { sort: 'newest' }, now).map((user) => user.id)).toEqual(['u1', 'u2', 'u3']);
  });
});