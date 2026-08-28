# Campus Notification Center, Stepped Mobile Signup, Live OTP Timer, App Version 3

## 1. Campus notification center

New page at `/campus/notifications`, reachable from a bell icon in the Campus header (with an unread count badge).

Two tabs:
- **Inbox** — full notification list (not just the last 20), grouped by Today / Earlier, unread rows visually marked, tap to mark read and follow any link stored in the notification, plus "Mark all as read", per-item delete, and an All / Unread filter. Realtime so new notifications appear instantly.
- **Preferences** — toggles for push notifications, email results, test/study reminders, study tips and subscription updates, saved to the existing preferences record. Includes device push permission status with an enable button on the app.

Empty and error states are explicit (e.g. "No notifications yet — results, deadlines and subscription updates will appear here").

## 2. Specific error messages everywhere touched

Replace generic "Something went wrong" / silent console errors in the notification, auth, OTP and preference flows with messages that name the cause and the fix: network offline, session expired, invalid/expired code, rate limited (with wait time), permission denied, record not found. Supabase error codes get mapped to human sentences through one shared helper so wording stays consistent.

## 3. Mobile auth form redesign (step-by-step)

Rework the mobile sign-up into a multi-step flow with a progress bar and step counter, one card per step, Back / Continue, and validation per step so users never see a wall of fields:

```text
Sign up:  1 About you (name, phone)
          2 Your path (JAMB/WAEC candidate vs undergraduate/graduate + level details)
          3 Account (email + password)
          4 Verify email (OTP)
Login:    stays a single quick form
```

Each step validates before advancing, shows inline field-level errors (including the accepted phone formats), and remembers entered data when going back. Smooth slide transitions between steps.

## 4. Live OTP resend countdown

The resend button becomes a real-time countdown: "Resend code in 0:42" ticking every second, with a thin progress ring/bar draining as it counts, and a caption explaining why ("For your security, a new code can be sent every 45 seconds"). When the hourly cap is hit it says how long until codes are available again instead of the generic message. Applied to both the signup verification and the password reset screens.

## 5. Android version bump

Set `versionCode 3` and `versionName "1.0.0"` in the Android app config so the next upload sits above the two builds already on Play.

## Technical notes

- Files: new `src/pages/campus/CampusNotifications.tsx`, new shared `src/components/notifications/NotificationList.tsx` and `NotificationPreferences.tsx`, plus edits to `CampusShell.tsx`, `NotificationBell.tsx`, `MobileAuthForm.tsx`, `src/components/auth/EmailOtpVerify.tsx`, `ResetPassword.tsx`, `src/lib/otpRateLimit.ts`, a new `src/lib/errors.ts`, route registration, and `android/app/build.gradle`.
- Uses the existing `notifications` table and the `user_preferences` notification columns — no schema changes needed. A delete policy check on `notifications` is the only DB item to confirm before wiring per-item delete.
- Countdown state stays in the existing localStorage cooldown so it survives reloads; only the presentation changes.
