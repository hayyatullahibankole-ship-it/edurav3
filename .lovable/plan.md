# Fix forum double shell, AI Tutor scrolling, and device push notifications

## 1. Forum page shows two headers and two nav bars

Confirmed cause: the `/forum` route wraps the page in `DashboardLayout`, while `Forum.tsx` already renders its own `AppShell`. That produces a page inside a page — two headers and two bottom nav bars.

Fix:
- Render `Forum` directly on its route without the extra dashboard wrapper (as already done for Wallet, Leaderboard, Study Decks).
- Give the two related screens the same treatment so the flow is consistent: "Ask a question" and the single post view move from the old `Layout` component onto the same shell, with a working back button.
- Re-check the neighbouring routes (Challenge Arena, Study Planner, Referral, Performance Report, Resources) so none end up with a duplicated shell after the change.

## 2. AI Tutor scrolling / layout issues

On phones the tutor screen is pinned with a fixed full-screen box, which fights the on-screen keyboard and the native safe areas, so the message list can stop scrolling or hide the last messages behind the input.

Fix:
- Replace the fixed full-screen box with a height-based layout that uses the real visible viewport height, so the header, scrollable message list, and input bar are always laid out correctly.
- Keep the message list as the only scrolling region and make sure it never sits under the composer or the phone's home indicator.
- Keep the view scrolled to the newest message while a reply streams in, without jumping while the user reads older messages.
- Make sure the screen still respects the status bar area when the keyboard opens and closes.

## 3. Push notifications never prompt and never appear in the notification panel

Confirmed cause: the app registers listeners but never asks Android for permission and never calls register, and nothing in the app calls the existing `requestPermission` function. Without permission and registration no device token is stored, so the backend has no device to deliver to and notifications only land in the in-app bell.

Fix:
- Ask for notification permission automatically on first launch of the installed app (once), then register the device and save its token.
- If permission is already granted on later launches, silently re-register so the token stays fresh, and refresh the stored token when Android rotates it.
- Handle refusal gracefully: no repeated prompting, and Settings shows the real state (enabled / blocked / needs device settings) with a way to retry or open the system settings screen.
- Create a default Android notification channel so delivered messages show in the device notification panel with sound, and confirm messages sent while the app is open still post a system notification rather than only an in-app toast.
- Tapping a notification opens the matching screen; unknown routes fall back to Home instead of a 404.
- Verify the delivery path end to end: the notification engine already calls the push sender, which needs the Firebase service-account secret configured to actually deliver.

## Technical notes

- Route wrappers live in `src/components/PlatformRouter.tsx`; `Forum.tsx`, `ForumPost.tsx`, `ForumNewPost.tsx` change shell usage only.
- `src/pages/AITutor.tsx` mobile branch swaps `fixed inset-0` for a `100dvh` flex column; `AITutorChat` keeps `flex-1 min-h-0 overflow-y-auto`.
- `src/hooks/usePushNotifications.tsx` gains first-launch permission + `register()`, a persisted "asked once" flag, `checkPermissions()` on resume, and channel creation via `PushNotifications.createChannel` on Android.
- Requires `FIREBASE_SERVICE_ACCOUNT_JSON` to be set as a backend secret for real delivery; `google-services.json` is already in `android/app/`.
- After merge, a fresh `npx cap sync android` and new build are needed to test on a device.
