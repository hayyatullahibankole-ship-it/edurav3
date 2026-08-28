# Status Report: Errors, Recent Changes, Play Store Target API, Production Readiness

## 1. Errors we observed (and their status)

| Area | Symptom | Cause found | Status |
| --- | --- | --- | --- |
| Signup | After email OTP verification the app jumped to the Journey map page, then the dashboard, instead of the "create password" step | OTP verification creates a real Supabase session mid-wizard, so auth guards treated it as a completed login | Fixed: durable signup state (1h TTL) in `signupFlow.ts`, guards respect it, Journey auto-redirects removed |
| Signup | Wizard state lost on remount / WebView reload | State was held in component memory and cleared on unmount | Fixed: typed draft persisted in localStorage (no passwords stored) |
| Campus AI | Companion showed "0/0 left for today" on free accounts | Deployed `campus-ai` edge function was stale vs. the code | Fixed: function redeployed + defensive quota parser (100 free / 500 premium per day) |
| Campus premium | Premium tool pages loaded indefinitely behind the paywall | Unbounded wait on profile/subscription load | Fixed: session caching + 2s decisive fallback in `CampusPremiumGate` |
| Notifications | Not appearing on the device panel; taps did not open the right page; preferences row missing for some users | Missing route resolution and uninitialised preference rows | Fixed: `notificationRoutes.ts`, realtime sync, preference bootstrapping, high-priority channel |
| Auth / OTP | Generic "Something went wrong" messages; resend spam possible | No error mapping, no rate limit | Fixed: `errors.ts` mapping, server rate limit (5/hour, 45s gap), visible countdown |
| Routing | AI Tutor button, trial banner, wallet button, forgot-password all hit 404 | Dead/incorrect route targets | Fixed; full route audit found all 124 targets valid |
| Payments | Scratch card returned PIN only | Vendor `serial_no` not mapped | Fixed: PIN + serial shown |
| Admin | Section reset to Dashboard on refresh; buttons off-screen on mobile | State not in URL; overflow layout | Fixed: `useSearchParams` + responsive question manager |
| Build | Typecheck failure on `Notifications.tsx` (missing `side` prop) | Prop omission | Fixed; latest build log reads `build OK` |

No open build or typecheck errors: the most recent entry in the build log is `build OK`.

## 2. Summary of recent changes

- **Signup and auth**: four-step mobile wizard (About -> Path -> Verify email -> Create password), OTP-based email verification and password reset, resend cooldown with live countdown, specific error messages throughout.
- **Notifications**: candidate and Campus notification centres with read/unread lists, preferences, realtime sync, device push, and tap-to-route navigation.
- **Campus**: premium gating hardened, AI Companion daily credits (100 free / 500 premium), projects, logbook, CV/career tools, subscription management, library behaviour clarified.
- **CBT and services**: wallet payments for subscriptions, automated scratch cards with PIN + serial, payment-first service requests, institution-specific pricing.
- **Akboy**: Forest Authority design system, live events with a customisable registration form builder, access-controlled ebook library (read-only, per-ebook access codes with name capture and device fingerprinting).
- **Mobile app**: unified navigation and tab bar, Bento home redesign, light theme default with persistence, faster splash (450ms), no AI-styled icons, Play Store asset pack and docs.
- **Quality**: Vitest smoke suite (17 tests) covering login, OTP, exam start, notification routing, subscription purchase, and signup regressions. All passing.

## 3. Play Store "target API" warning

Current repo configuration is already modern:

```text
android/variables.gradle : compileSdkVersion 36, targetSdkVersion 36, minSdkVersion 23
android/app/build.gradle : versionCode 3, versionName 1.0.0
Capacitor 7.4.x (Android 16 / API 36 ready)
```

API 36 is Android 16 and satisfies the current Play requirement. The warning therefore refers to a **previously uploaded bundle** (versionCode 1 or 2, built before this config), or to an AAB built from a stale local Android folder that was never re-synced.

Proposed steps (to run after approval):

1. Confirm `targetSdkVersion 36` is the value actually compiled - not overridden anywhere else in the Gradle files.
2. Rebuild cleanly: `npm run build` -> `npx cap sync android` -> `./gradlew clean bundleRelease` in `android/`.
3. Verify the produced AAB's manifest reports `targetSdkVersion=36` before upload (`bundletool dump manifest` or Play Console's pre-upload report).
4. Bump `versionCode` to 4 (Play rejects a re-used code) and upload; the warning disappears once a build with API 36 is live on the track.
5. Optional: pin `targetSdk` explicitly in `android/app/build.gradle` so a stale `variables.gradle` cannot silently lower it.

## 4. How production readiness was determined

Readiness was judged against five checks, all currently passing:

1. **Builds clean** - TypeScript (`tsgo --noEmit`) and the Vite production build both succeed; the build log's latest entry is `build OK`.
2. **Automated tests pass** - 17 smoke tests cover the revenue and auth critical paths: login, OTP verification, exam start, notification routing, subscription purchase, and the signup regression that previously broke.
3. **Route integrity** - a full audit of all 124 navigation targets in the mobile app found no dead links or 404s.
4. **Policy compliance** - digital-goods purchases are gated on native (`nativePayments.ts`), account closure routes to support, privacy/terms carry real Edura contact details, and permissions in the manifest are limited to camera, mic, notifications, and media used by features.
5. **Backend integrity** - RLS policies and grants on user-facing tables, server-side OTP rate limiting, per-ebook access control with device fingerprinting, and edge functions verified as deployed (the stale `campus-ai` case was caught this way).

Remaining items before shipping the next release: the clean Android rebuild with versionCode 4 (section 3), and a final manual pass on the live preview after that build.
