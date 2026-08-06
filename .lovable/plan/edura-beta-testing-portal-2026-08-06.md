# Edura Beta Testing Portal

A standalone 5-day tester program: invited testers open a dedicated page, unlock it with an invite code, and submit one report per day. You review everything from the admin dashboard.

## What testers see

Route: `/test` (separate from the app shell — no dashboard nav, no login required).

1. **Unlock screen** — tester enters their invite code plus full name, email and phone (name/email captured on first use only). Code is validated, then stored on the device so they land straight in the portal next time.
2. **Tester home** — shows their name, which day of the 5 they're on, a 5-dot progress strip (submitted / today / upcoming), and a short "what to test today" focus note you can set per day.
3. **Daily report form** — one submission per day per tester:
   - Overall rating (1-5 stars)
   - What worked well
   - Bugs / issues found
   - Suggestions
   - Device and OS version
   - Optional screenshot upload (up to 3 images)
4. After submitting, the day is locked with a summary card; they can still read past reports. Editing is allowed for the same day only.

## What you see in admin

New **Beta Testing** section in the admin portal with three tabs:

- **Testers** — generate invite codes (single or batch), see who redeemed each, their name/email/phone, days submitted (e.g. 3/5), last activity. Revoke a code.
- **Reports** — all daily reports, filterable by tester and day, with ratings, full text, and screenshots. Expandable rows; CSV export.
- **Overview** — participation rate, average rating per day, count of open bug reports, and daily focus notes you can edit.

## Technical details

Database (new tables, RLS + grants):

- `beta_testers` — code, name, email, phone, device fingerprint, status, started_at, redeemed_at
- `beta_reports` — tester_id, day_number (1-5), rating, what_worked, issues, suggestions, device_info, screenshots (array of URLs), unique on (tester_id, day_number)
- `beta_settings` — per-day focus notes and program start/end dates

Access model: no auth. Code redemption and report submission go through a `beta-portal` edge function using the service role, which validates the code, binds it to the first device that redeems it, and enforces one report per day. Tables stay locked to `anon` so codes can't be enumerated or reports read publicly; admins read them via the authenticated admin client.

Storage: reuse a public `beta-screenshots` bucket for uploads.

Frontend:
- `src/pages/BetaTest.tsx` + `src/components/beta/` (UnlockGate, DayStrip, ReportForm, PastReports)
- Route `/test` registered in `PlatformRouter.tsx` outside the authenticated shell, plus `/test/:code` so you can share a pre-filled link
- `src/components/admin/BetaTestingManager.tsx` wired into `AdminPortal.tsx` under a new "Beta Testing" nav group

Styling follows the existing flat Edura system (Deep Ink / Edura Green, no gradients), mobile-first.
