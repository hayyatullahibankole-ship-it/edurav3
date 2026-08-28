# Fix mobile signup routing and finish Campus notifications

## Confirmed cause

The OTP itself is succeeding. Immediately afterward, Supabase emits a signed-in session and `useAuth` sets global auth loading back to true. `Auth.tsx` then replaces the signup form with its loading screen, which unmounts `MobileAuthForm`; that component’s unmount cleanup clears `edura_signup_in_progress`. When auth finishes, the normal authenticated redirect runs, and the missing-stage guards can send the new user through `/campus/journey`. This explains both the apparent full-page refresh and why the previous session-storage guard did not hold.

The Campus notification route, inbox, read/unread controls, realtime updates, destination navigation, and preferences UI already exist. The remaining reliability gap is that notification preferences can still load forever when the authenticated profile is delayed or unavailable, and several backend errors still collapse to a generic message.

## Changes

1. **Make signup a stable four-step state machine**
   - Keep the mobile signup form mounted when OTP creates the temporary authenticated session.
   - Preserve the exact flow: About you → Your path → Verify email → Create password.
   - Advance directly from a successful OTP to the password step with local React state—no navigation, route replacement, or page reload.
   - Show the verified email on the password step and prevent returning to/editing verified identity fields accidentally.

2. **Remove the fragile redirect suppression lifecycle**
   - Stop clearing signup state merely because the form temporarily unmounts during an auth-state update.
   - Persist the active step and required signup draft safely enough for the native WebView to survive an auth rerender, while clearing it only on explicit cancellation, sign-in switch, successful completion, or logout.
   - Make `Auth.tsx` prioritize an active signup over its global auth loading and authenticated-user redirects.

3. **Remove automatic Journey-page routing**
   - Remove automatic redirects to `/campus/journey` from dashboard, Campus, and candidate route guards.
   - Use the stage already selected during signup for the first destination; if profile synchronization is briefly delayed, stay on a neutral dashboard/loading state rather than opening Journey.
   - Keep “My journey” available only through Profile/Settings, as requested.

4. **Finish account creation before dashboard navigation**
   - After password creation, update auth metadata and the public profile, verify the profile write succeeded, refresh the in-memory profile/stage state, then clear signup state and navigate once.
   - Surface a specific profile-save error and keep the user on the password step if completion fails.

5. **Harden the Campus notification center**
   - Keep the existing Inbox and Preferences tabs, read/unread filtering, mark-read, mark-all-read, delete, realtime inserts, and destination navigation.
   - Prevent Preferences from spinning indefinitely when profile resolution finishes without a usable profile; show an actionable retry/sign-in state.
   - Ensure notification taps first mark the item read, then navigate to a validated in-app Campus destination.
   - Keep the bell badge synchronized after read/delete actions and realtime changes.

6. **Make errors specific**
   - Expand mappings for invalid/expired OTP, already-used email, resend throttling, offline/timeouts, permission failures, missing profile/preferences, notification load/update/delete failures, and profile completion failures.
   - Avoid exposing raw backend messages and avoid the generic fallback where the operation is known.

7. **Regression coverage and verification**
   - Add an integration-style mobile signup test that simulates the OTP `SIGNED_IN` event and proves the form remains mounted on “Create password,” with no `/campus/journey` or dashboard navigation before completion.
   - Add tests for successful completion, failed profile save, no automatic Journey redirect, notification destination/read behavior, and preferences-without-profile behavior.
   - Run the smoke suite, TypeScript checks, inspect the latest build log, and verify the mobile flow in the running app without a reload.

## Technical scope

Primary files: `MobileAuthForm.tsx`, `EmailOtpVerify.tsx`, `Auth.tsx`, `PlatformRouter.tsx`, signup-flow state helpers, auth/profile refresh handling, notification components/pages, error mapping, and smoke tests. No new database tables are required; the existing `notifications` and `user_preferences` tables and their owner-scoped policies support this work.
