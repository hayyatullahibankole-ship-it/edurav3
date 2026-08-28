# Signup flow, notifications and premium gating fixes

## 1. Sign-up: verify email before creating a password

Today the mobile sign-up collects name → path → email + password together, creates the account, and only then tries to show a code step. Because the project's auth settings return a session straight away, the code step is usually skipped entirely — that is why "verify email" appears broken.

New step order:

```text
1. About you      name, phone
2. Your path      stage, institution, level
3. Your email     enter email -> "Send code" -> 6-digit code -> Verified
4. Create password  password + confirm -> account ready
```

- Step 3 sends a real 6-digit code to the email and verifies it on the spot, with the existing 45s resend countdown and rate limiting. The user cannot continue until the code is accepted, and a green "Verified" state is shown.
- Step 4 sets the password and saves the profile details captured in steps 1-2.
- "Change email" on step 3 resets verification.
- Login flow is untouched.

## 2. Notifications open the page they refer to

Tapping a notification currently only navigates when the record happens to carry a `route` value, and it changes the URL by hand rather than using the app router.

- Tapping any notification marks it read and routes with the app router (no reload).
- Destination resolution order: explicit route/link stored on the notification, then a sensible default per notification type (results, exam, subscription/payment, referral, forum, campus, ebook, wallet), then the relevant inbox as fallback.
- Campus notifications route to campus pages, candidate notifications to candidate pages.
- Applies to both the candidate and campus notification lists, and to notifications opened from the bell dropdown.

## 3. Premium campus tools: instant, decisive gate

- Premium/trial users must never see the wall, and never a spinner: once the plan is known it is cached for the session so moving between campus tools is instant.
- Free users see the upgrade wall immediately, not after a delay.
- The gate only shows a brief skeleton on the very first check, and any slow/failed lookup resolves to a decided state fast (about 2 seconds) instead of the current 8-second spinner.
- The upgrade wall gets stronger copy: locked feature name, what is included, price entry point, and a clear "Upgrade" call to action, plus a "Restore/refresh my plan" link for users who just paid.

## 4. Campus AI: 100 free credits per day

Already set at 100 free / 500 premium in the AI service. This pass makes it visible and consistent:
- Credit counter shown on the Campus AI screen ("x / 100 credits left today").
- Exhaustion message states the reset time and the premium allowance.
- No premium wall in front of Campus AI.

## Technical notes

- `src/components/MobileAuthForm.tsx`: reorder to 5 steps; step 3 uses `signInWithOtp` (`shouldCreateUser: true`) + `verifyOtp({ type: "email" })`; step 4 uses `updateUser({ password, data: {...profile} })` and keeps the referral handling and session-token logic. Duplicate-account handling stays.
- `src/components/auth/EmailOtpVerify.tsx`: add a `mode="email"` variant that does not auto-send on mount (explicit "Send code" button), keeps `guardOtpSend`/cooldown, and reports send failures.
- `src/components/notifications/NotificationList.tsx`: accept an `onOpen(notification)` callback; resolution helper in a new `src/lib/notificationRoutes.ts`; callers use `useNavigate`.
- `src/components/campus/CampusPremiumGate.tsx` + `src/hooks/useSubscription.tsx`: session-level cache of the resolved plan, 2s bounded fallback, no spinner when a cached decision exists.
- `src/pages/campus/CampusCompanion.tsx`: verify credit badge and exhaustion card render correctly against the 100/day limit.
- No database migration required.
