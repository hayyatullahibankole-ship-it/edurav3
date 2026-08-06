# Build & release readiness: status and leftovers

## Verified as ready

- Type-check passes with no errors across the whole app.
- Capacitor packages are all aligned on the v7 line (`core`, `cli`, `android`, `ios`, `browser`), so `npm install` in the deploy resolves cleanly.
- Android app is configured under `com.edura.app`, with launcher icons, splash and the correct `MainActivity` package path.
- Campus Phase 2 is fully wired: `/campus/logbook`, `/campus/nysc`, `/campus/career` are routed and linked from the Campus home tiles.
- Play Store policy blockers previously raised are closed: in-app account deletion, native purchase gating, and camera/mic + deletion disclosures in the privacy policy.

## Leftovers before you can publish

1. **Push notifications are switched off.** `usePushNotifications.tsx` has `PUSH_ENABLED = false` and `android/app/google-services.json` is missing. Until a Firebase project is created and that file is added, the app ships with no push. This does not block the store — it blocks the feature.
2. **Supabase dashboard settings (manual, not code).** Enable leaked-password protection, and confirm Site URL + redirect URLs point at the production domain.
3. **Play Console paperwork (manual).** Upload key / signing, store listing text, screenshots and feature graphic (already generated under the play-store assets folder), privacy policy URL, Data Safety form, content rating questionnaire.
4. **Final QA pass on a real device.** Install the release APK/AAB and walk: onboarding → signup → CBT practice → services purchase → wallet → Campus AI gating → ebook reader → account deletion.

## What I would do next in code

Only one item here is code work: turning push notifications on. That means adding `google-services.json`, flipping `PUSH_ENABLED` to `true`, and confirming the `send-push-notification` edge function is wired to the stored device tokens. Everything else on the list is dashboard or Play Console work you do outside the codebase.

Tell me if you want push enabled now (you'll need to supply the Firebase `google-services.json`), or if you'd rather ship the first release without it.
