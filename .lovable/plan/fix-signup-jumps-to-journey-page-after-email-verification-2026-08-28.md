# Fix: signup jumps to journey page after email verification

## What is happening

On step 3 of the mobile sign-up, verifying the 6-digit code creates a real Supabase session. The app treats any new session as "user just logged in", so the auth screen's redirect effect fires and sends the user to the journey page and then the dashboard — before the password step ever renders.

notifications is also loading indefinitely

## What it should do

```text
1. About you       name, phone
2. Your path       stage, institution, level
3. Verify email    code -> Verified  (stay on the form)
4. Create password password + confirm -> account ready -> dashboard
```

The journey page must never appear during sign-up: the stage was already chosen in step 2 and is saved with the account.

## Changes

1. **Signup-in-progress flag.** When the sign-up wizard sends/verifies the email code, mark the session as "signup in progress" (session storage). The flag is cleared once the password step completes or the user leaves sign-up.
2. **Auth screen respects the flag.** The redirect effect and the immediate redirect on the auth page skip routing while the flag is set, so the wizard stays mounted and advances to step 4.
3. **Router respects the flag.** The stage-based guard that sends users with no academic stage to `/campus/journey` is skipped while sign-up is in progress, so a mid-signup session cannot bounce into the journey screen.
4. **Stage is written before redirect.** Finishing step 4 saves the password plus profile fields (name, phone, academic stage, institution, level) and waits for the profile write to land before clearing the flag and navigating — so the post-signup landing already has a stage and never re-prompts the journey page.
5. **Abandonment safety.** If the user closes the app after verifying but before setting a password, the next launch finds a session with no password/stage; that user is routed back into the sign-up wizard at step 4 rather than into the journey page.

## Technical notes

- `src/components/MobileAuthForm.tsx`: set/clear `sessionStorage` key (e.g. `edura_signup_in_progress`) around steps 3-4; `finishSignup` keeps `updateUser` with password + metadata, then awaits the profile refresh before `navigate("/dashboard")`.
- `src/pages/Auth.tsx`: early-return from the redirect effect and the `<Navigate>` branch while the flag is set.
- `src/components/PlatformRouter.tsx`: guard the three `!stage && resolved -> /campus/journey` redirects with the same flag.
- No database or edge function changes.