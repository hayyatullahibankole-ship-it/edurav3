# Fix pack: auth OTP, campus gaps, theme, emails, dead links

## 1. Password reset with OTP (no reset link)
There is currently no `/reset-password` page at all, which is why the forgot-password link lands on the 404 page.

New flow, all on one screen (`src/pages/ResetPassword.tsx`, route `/reset-password`, public):
1. Enter email -> send 6-digit code
2. Enter code -> verified
3. New password + confirm password -> saved
4. Back to login

Forgot-password buttons in `AuthForm`, `MobileAuthForm`, `SchoolLogin` and `ProfileSettings` will send the code and route here instead of emailing a magic link.

## 2. Email verification with OTP
Signup stops using confirmation links. After the email field is filled, a "Verify email" button appears, sends a 6-digit code, an OTP field slides in, and on success the field shows a green "Verified" state before the account is created. Applies to both the desktop and mobile auth forms.

## 3. Emails rewritten to look professional
Rewrite the welcome, verification and reset emails:
- Remove all gradients, emojis and decorative icons; flat white layout, single Edura green accent, plain typography
- Human copy, short sentences, no marketing-AI tone
- Fix the broken "Go to My Dashboard" link (currently points at a lovableproject.com URL that 404s) to `https://edura.com.ng/#/dashboard`
- Codes shown large and clear, with expiry note and "ignore if this wasn't you"

## 4. Campus fixes
- **Paywall**: campus routes today only check the academic stage, not payment. Add a subscription gate so Companion, Tools, Career, Projects, Logbook, NYSC and Opportunities show an upgrade screen for unpaid users (Academics/Journey stay open).
- **Manage subscription**: add a Subscription entry to the campus menu and a plan/status card on the campus home with upgrade and payment history.
- **Projects page**: add "New project" and per-project actions — edit, delete, add/complete milestones, progress, deadline.
- **AI companion credits**: the daily-credit counter still exists on the server but is not shown; surface "X of Y prompts left today" in the companion header and block with a clear message when exhausted.
- **Library tab**: the academics "Library" tab is broken (blank label, unfinished wiring). Rebuild it as course materials — upload, filter by course, preview and open.

## 5. Theme
Dark mode is scoped to a fixed list of paths that excludes `/campus`, `/forum`, `/ai-tutor`, `/decks`, `/leaderboard` and others, so the theme resets to light when moving between sections, and "System" never applies. Fix by keeping the theme for every signed-in app route and honouring the System option properly.

## 6. Delete account
Remove the in-app delete section from account settings and replace it with a short line pointing to support@edura.com.ng. The public `/delete-account` page stays (Play Store requires a reachable deletion request URL) but becomes a contact-support page.

## 7. Dead links and icons
- Trial banner buttons point at `/subscription`, which does not exist -> route them to the real subscription page
- Explore sheet: "Wallet" opens the referral page -> point it at `/wallet` and add a proper "Referrals" entry
- NABTEB logo is loaded from an externalized asset URL that does not resolve in the packaged app -> bundle it locally like the JAMB/WAEC/NECO logos

## 8. Push notifications on the device panel
Notifications only surface in-app. Fix delivery so they appear in the Android notification panel: request permission on first launch, register the device token, and send properly formed `notification` payloads (title, body, channel, icon) from the notification engine so Android displays them when the app is backgrounded or closed.

## Technical notes
- OTP flows use Supabase `signInWithOtp` / `verifyOtp` with `email_otp`; Supabase auth email templates must expose `{{ .Token }}`, and the existing `send-verification-email` function will carry the code.
- Campus gating reuses the existing `has_premium_access` / subscription hook rather than a new table.
- Theme scoping change is in `ThemeScope`; no per-page work needed.
- Android notification channel is declared in the manifest, with `notification` + `data` payloads from `send-push-notification`.
