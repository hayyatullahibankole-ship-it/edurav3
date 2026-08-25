# Follow-up Mobile UX Audit and Android Push Notifications

## Confirmed Firebase details

- **Android package name / Firebase Android app ID:** `com.edura.app`
- This matches both `capacitor.config.ts` and Android's `applicationId`/namespace.
- In Firebase Console, register an **Android app** with package name `com.edura.app`.
- Download the client configuration file as `google-services.json` and place it at:
  `android/app/google-services.json`
- The SHA-1/SHA-256 fingerprints are not required for basic FCM push delivery, but should be added from the Play Console app-signing certificate before using Firebase features that require verified app identity.
- The project already includes Capacitor Push Notifications, Android notification permission, Google Services Gradle support, and the Firebase Gradle plugin. The missing JSON file and the disabled runtime flag currently prevent registration.

## Firebase setup checklist for you

1. Create or select the Edura Firebase project.
2. Add Android app package `com.edura.app` (case-sensitive).
3. Download `google-services.json`; do not rename or edit it.
4. Upload/provide that file for placement in `android/app/`.
5. In Firebase Console, ensure **Firebase Cloud Messaging API (HTTP v1)** is enabled.
6. Create/download a server service-account JSON with permission to send FCM messages.
   - Do **not** put this server credential in the Android app, source code, or `google-services.json`.
   - It will be stored as a protected backend secret when implementation begins.
7. After pulling the completed project locally, run `npm install`, `npm run build`, and `npx cap sync android`, then generate a fresh signed AAB.

## Implementation plan

### 1. Consolidate the authenticated mobile shell

- Make `AppShell` and its stable bottom tab bar the single navigation system for candidate and Campus screens.
- Migrate Study Hub, Resources, Forum, Challenge Arena, lessons, and AI Tutor away from legacy or missing mobile navigation.
- Keep focused exam-taking screens free of persistent navigation to avoid accidental exits.
- Remove retired `MobileHome`, `MobileNav`, `ServicesMobileNav`, and `SideSwitcher` paths/components after references are migrated.
- Correct all Home, CBT, Services, Wallet, Profile, and More destinations so installed/native navigation never returns to stale routes.

### 2. Simplify candidate information architecture

- Preserve the new action-centric Home hierarchy: progress, one recommended action, then grouped tools.
- Remove duplicate CBT, Wallet, Study Hub, and discovery entry points where they compete for attention.
- Use one first-run guide rather than the currently duplicated guide and dormant onboarding tour.
- Standardize loading skeletons, empty states, errors with retry, and install-gating copy across candidate screens.

### 3. Make Campus navigation stage-aware

- Keep Home, Academics, AI, and Projects as primary destinations, with one consistent More sheet for Wallet, Tools, Opportunities, Career, Logbook, NYSC, and Settings.
- Filter SIWES, Teaching Practice, NYSC, and graduate career actions according to the saved academic stage/level.
- Add an in-page SIWES/Teaching Practice switcher to Logbook.
- Remove dead-tap tool previews and make every visible tool tile navigable.
- Show course prerequisites before sending a student to AI Companion, and clarify quota/Premium wording.

### 4. Merge and branch onboarding

- Ask the student's journey once, early in onboarding.
- Show candidate-specific slides for SS3/JAMB/WAEC users and Campus-specific slides for undergraduates/graduates.
- Reuse the chosen journey during account setup so Campus users are not asked the same stage question twice.
- Keep later journey editing available only from Profile/Settings.

### 5. Complete reliable Android push registration

- Enable push only after Firebase client configuration is present.
- Replace the automatic first-launch permission prompt with a clear, user-triggered notification setup in Settings/onboarding.
- Register listeners once, clean them up correctly, handle token refresh, denied permissions, app settings, foreground messages, and notification-tap deep links.
- Validate deep-link routes before navigation so malformed notification data cannot send users to a 404.
- Display an accurate enabled/denied/device-settings state instead of a generic browser-notification toggle.

### 6. Support multiple devices securely

- Add a dedicated `push_devices` table instead of storing only one token in `user_preferences`.
- Store token, authenticated user, platform, device identifier, enabled state, and last-seen timestamp; upsert on registration and disable on logout/removal.
- Add explicit authenticated/service-role grants, RLS policies, uniqueness constraints, and indexes.
- Keep tokens private to their owner and backend sender.

### 7. Modernize server-side delivery

- Replace the existing deprecated FCM legacy endpoint and `FCM_SERVER_KEY` flow with Firebase HTTP v1 OAuth using the protected service-account credential.
- Require authenticated/admin-authorized calls for manual sends; do not allow clients to send arbitrary notifications to other users.
- Send to every enabled device for the target user, remove invalid/expired tokens, persist the in-app notification record, and return truthful partial-failure results.
- Preserve route and contextual data for notification taps.

### 8. Verification

- Verify candidate and Campus routes at phone widths with no overflow, duplicate tab bars, dead taps, or unexpected journey redirects.
- Test fresh onboarding, returning sessions, profile journey edits, and native back navigation.
- On a physical Android device, test permission grant/deny/re-enable, token persistence, foreground/background/terminated delivery, notification deep links, logout, and multiple devices.
- Run the production build and Android sync checks, then document the final AAB/version-code release steps.

## Technical notes

- `google-services.json` is Firebase client configuration and belongs only at `android/app/google-services.json`.
- The Firebase service-account JSON is a sensitive backend credential and will be requested through secure secret storage, never committed.
- Android currently targets SDK 35 and already declares `POST_NOTIFICATIONS` for Android 13+.
- The next Play Store upload must increment `versionCode` above the version already uploaded; the current repository value is `1`.
