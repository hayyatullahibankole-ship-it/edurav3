# Fix Campus mobile actions, paywall loading and signup verification

## What's wrong right now

1. **No "Add course" / "Upload material" buttons on mobile.** The buttons exist on the Academics page, but they are passed into the page header block that is marked desktop-only (`hidden ... lg:flex` in the app shell), so phones never render them. Same pattern affects any campus page that puts its actions in the header.
2. **Library tab has no action at all.** It only lists materials an admin published; a student has no way to contribute or to find anything (no search/filter, no empty-state action).
3. **Premium campus tool page spins forever.** The paywall waits on the subscription hook, and that hook stays in `loading = true` indefinitely whenever the public profile row hasn't loaded (it returns early without ever clearing loading). Any campus user whose profile is slow or missing sees an endless spinner instead of either the tool or the upgrade screen.
4. **Signup email verification never arrives.** The app is wired correctly (signup → step 4 → 6-digit OTP screen), but no email setup is recorded for this project, so the code delivery depends on the Supabase auth "send email" hook + Resend being active. This needs verifying on the backend before any code change.
5. **AI companion access.** Today the companion route is wrapped in the premium gate, so it is premium-only, and it *also* has a daily credit quota. That double restriction is likely not what you want.

## What I'll build

### A. Mobile action buttons
- Render page actions on mobile too: show them in a compact row directly under the mobile title (or as the top-right slot of the topbar), not only on large screens.
- Verify on Academics (Add course, Upload), Study tools (Add class, Add deadline), Projects, Logbook.

### B. Library tab
- Add a search field and a type filter (note / past question / handout / slide / textbook).
- Add a "Share to library" option in the upload dialog so a student can publish their own material (goes in unpublished, admin approves before it appears to others).
- Proper empty state with an action button instead of a blank list.

### C. Paywall loading fix
- The subscription hook will always resolve: if the profile hasn't loaded after a short window, it stops loading and reports no premium access.
- The paywall gets a bounded loading state — after a few seconds it shows the upgrade screen (or the tool, when access is confirmed) instead of spinning, plus a "Retry" action.

### D. Signup email verification
- First verify the backend: confirm the Supabase auth email hook is pointed at `send-verification-email`, that auto-confirm is off (auto-confirm suppresses verification emails entirely), and that the Resend sender domain `edura.com.ng` is verified.
- Then fix whatever that check turns up (hook config, sender, or function payload), and make the OTP screen show a clear "we couldn't send the code" error with a retry rather than silently waiting.
- Add a "Skip for now / verify later" path so a failed email never traps a new user on step 4.

### E. AI companion access
Proposal (confirm if you disagree): keep the companion **available to everyone on the campus side**, limited by the existing daily credit quota, and reserve the premium plan for *more* daily credits plus the heavier tools (past-question generator, project assistant, CV builder). That way free users can taste it and have a reason to upgrade. If you'd rather it stay fully premium, say so and I'll leave the gate.

## Technical notes

- `src/components/edura/AppShell.tsx` — the `action` slot lives in a `hidden lg:flex` block; add a mobile-visible render path.
- `src/pages/campus/CampusAcademics.tsx` — library search/filter, share-to-library flag on `campus_materials` (`is_library` already exists, `is_published` stays false until approved), empty states.
- `src/hooks/useSubscription.tsx` — early return on missing `userProfile.id` never clears `loading`; add a timeout fallback.
- `src/components/campus/CampusPremiumGate.tsx` — bounded spinner + retry.
- `src/components/auth/EmailOtpVerify.tsx` — send-failure surfacing; backend hook/Resend verification first.
- `src/components/PlatformRouter.tsx` — remove `CampusPremiumGate` around `CampusCompanion` if you approve E.
