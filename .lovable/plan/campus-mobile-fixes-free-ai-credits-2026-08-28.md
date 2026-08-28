# Campus mobile fixes + free AI credits

## 1. Missing buttons on mobile (Courses, Materials, Library)

The Add course / Upload buttons already exist, but the app shell renders page actions inside a
desktop-only block (`hidden ... lg:flex`), so on phones they never appear. Same for the page
subtitle and the stage badges.

Fix:
- Render page actions on mobile in the shell (compact action row under the mobile header), so every
  campus page's buttons show up on phones.
- Add in-page action buttons on the Academics tabs as well, so each tab is self-explanatory:
  - Courses tab: "Add course" button in the header row and in the empty state.
  - My materials tab: "Upload material" button in the header row and in the empty state.
  - Library tab: two actions — "Save to my materials" on each library item, and a
    "Contribute a material" button that submits to the shared library for admin approval.

## 2. Library contributions

- Library items gain a save action that copies the item into the student's own materials list.
- A contribute flow uploads a file, marks it as a library submission pending review, and shows a
  "Pending review" badge to the submitter. Approved submissions appear in the Library for everyone.
- Admin side: an approve/reject list for pending library submissions in the campus materials admin
  area.

## 3. Premium campus tool page loads forever

The subscription hook keeps `loading = true` forever whenever the public profile row never resolves,
and the gate shows only a spinner in that state. Fix:
- Give the profile wait a bounded timeout so the hook always settles into a decided state.
- The gate stops spinning after the timeout, shows the upgrade screen (or a short retry message
  with a "Try again" button) instead of an endless spinner.

## 4. Email verification not arriving at signup

Signup relies on the Supabase auth email hook delivering the 6-digit code, and the OTP screen only
assumes it was sent. Fix:
- Verify the auth hook + Resend sender configuration and confirm the template carries the OTP token.
- Make the OTP step explicitly trigger the code send when the signup response indicates no email was
  dispatched, and surface a clear error if sending fails instead of silently showing the code box.
- Show a "Didn't get it? Resend" state that respects the existing 45-second cooldown, and log
  delivery failures so they are visible.

## 5. Campus AI becomes free with daily credits

Currently the AI companion is fully premium (free daily limit is 0) and the whole page is gated.

New model:
- Free campus users: **100 credits per day**.
- Subscribers: higher daily allowance (keep the existing premium ceiling).
- Remove the hard premium block from the AI edge function; only block when the user's daily credits
  are exhausted, with an upgrade prompt at that point.
- Companion page: no premium wall. Header shows "X / 100 credits left today" and resets daily. When
  credits run out, an inline card explains the reset time and offers upgrade.
- Route change: the companion page is no longer wrapped in the premium gate.

## Technical notes

- `src/components/edura/AppShell.tsx`: render `action` on mobile.
- `src/pages/campus/CampusAcademics.tsx`: tab-level action buttons, empty-state CTAs, save-to-mine
  and contribute flows.
- `src/hooks/useSubscription.tsx`: bounded profile wait so `loading` always resolves.
- `src/components/campus/CampusPremiumGate.tsx`: timeout fallback instead of endless spinner.
- `supabase/functions/campus-ai/index.ts`: free daily limit 100, drop the `requiresUpgrade` hard
  block, keep per-day counting in `campus_ai_usage`.
- `src/pages/campus/CampusCompanion.tsx`: credit meter, exhausted state, no premium gate.
- `src/components/PlatformRouter.tsx`: unwrap `/campus/companion` from `CampusPremiumGate`.
- Migration: add a review/approval status column to `campus_materials` for library submissions.
- `src/components/auth/EmailOtpVerify.tsx` + signup flow: explicit send + failure surfacing.
