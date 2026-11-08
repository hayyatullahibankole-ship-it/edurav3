# Admin user activity upgrade

## Current findings
- `/admin` already has user search and shows profile creation dates and `last_login_at`, but no enrollment or login filters. “Active” currently means not suspended.
- The main dashboard shows recent exam attempts, not new registrations. Analytics currently labels registrations from the past day as “Active Users Today.”
- All 59 profiles currently have a blank `users.last_login_at`; linked Auth accounts do have sign-in timestamps, including 2 logins within the past 7 days.
- The `users` table contains sensitive fields, so a direct Realtime subscription could expose more than this screen needs. Use a protected, read-only admin lookup instead.

## Plan
1. Add a read-only Edge Function that verifies the caller is an admin and returns only linked account IDs and Auth creation/last-sign-in timestamps. Do not change sign-in behavior, profile data, or the database schema.
2. Upgrade the admin overview with recent enrollments and an unobtrusive new-enrollment alert, refreshed through the protected lookup rather than subscribing to sensitive user rows.
3. Upgrade User Management with filters for enrollment date, recent login (7/30/90 days and never), verification, and suspension; add newest/recent-login sorting and make export follow the active filters. “Recently active” will mean logged in within the selected period; suspended status stays separate.
4. Correct the Analytics Hub label so recent registrations are not described as active users, and show login-based activity separately where the data supports it.
5. Add focused tests for date-window and filter behavior; verify admin-only access, refresh behavior, responsive presentation, and existing user-management actions.

## Exact files
- `src/pages/AdminPortal.tsx` — overview registration summary and refresh state.
- `src/components/admin/UserManagement.tsx` — enrollment/activity filters, sorting, and filtered export.
- `src/components/admin/AnalyticsHub.tsx` — accurate registration/activity labels.
- `src/lib/adminUserActivity.ts` — date windows and activity filtering.
- `src/test/adminUserActivity.test.ts` — concrete date-window and filter tests.
- `supabase/functions/admin-user-activity/index.ts` — admin-verified, read-only Auth timestamp lookup.

## Guardrails and verification
- No schema/data migrations, auth-flow changes, payment/subscription changes, or changes to account status rules.
- Reuse the existing Supabase client, admin role check pattern, and component styling; do not read `auth.users` from the browser or subscribe to sensitive `users` rows.
- Run the focused test and existing smoke suite; verify recent joins, login periods, never-logged-in, suspended/unverified filters, and the enrollment alert using admin-authorized data.
