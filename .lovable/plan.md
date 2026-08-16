# Testers can move between days 1-5

Right now the beta portal only ever shows the report form for "today" (a day number calculated from when the code was redeemed). Testers can't go back to Day 1 to fix something or jump to Day 3 to file that day's report.

## What changes for testers

- The 5-dot day strip becomes tappable. Tapping D1-D5 opens that day's report in the form.
- The form header says which day is selected, and whether it is being created or edited ("Day 1 report - editing").
- Each day chip shows its state at a glance: submitted (check), selected (outlined), empty (plain).
- The form pre-fills with whatever was already saved for the selected day, including its screenshots; switching days swaps the content.
- A "Back to today" link appears when the tester is viewing a day other than the current one.
- Past reports list stays, but now tapping a past card also jumps the form to that day.

Any of the 5 days can be selected and submitted at any point in the program, so a tester who missed Day 2 can still fill it in later.

## Stale app / "clear browser history" problem

The reason your testers had to clear history is the service worker serving the previously cached build. Two fixes so this update reaches them automatically:

- The beta portal will always fetch its state from the server on load (no cached state), and re-fetch when the tab regains focus.
- The app registers a fresh-content check on load and, when a new build is detected, activates it and reloads once - so testers get the new version without clearing anything.

## Technical details

Frontend - `src/pages/BetaTest.tsx`:
- New `selectedDay` state, defaulting to `state.currentDay`; `hydrateForm(state, day)` takes the day parameter.
- Day chips become buttons calling `selectDay(d)`; screenshot upload path uses `selectedDay`.
- Submit sends `day_number: selectedDay`; after a successful save the form re-hydrates from the returned state for that same day.
- Past reports list filters against `selectedDay` instead of `currentDay`.
- Re-fetch state on `visibilitychange` when the document becomes visible.

Backend - `supabase/functions/beta-portal/index.ts`:
- The `submit` action reads an optional `day_number` from the body, clamps it to 1-5, and falls back to the computed current day when absent. The existing upsert on `(tester_id, day_number)` already handles create-or-update.

Update delivery - `src/lib/registerAppServiceWorker.ts`: confirm the existing update path calls `skipWaiting` + reload on new-content detection; add it if that flow is missing.

No database or schema changes are needed.
