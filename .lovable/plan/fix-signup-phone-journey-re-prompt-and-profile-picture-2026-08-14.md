# Fix signup phone, journey re-prompt, and profile picture

## 1. Accept normal Nigerian phone formats at signup

Today the validator only accepts a strict international form, so `08012345678` is rejected with a vague "Invalid phone number format".

- Accept all of: `08012345678`, `2348012345678`, `+2348012345678`, and spaced/dashed variants.
- Normalise whatever the user types to a single stored format (`+234...`) before saving, so records stay consistent.
- If the number really is invalid, show an exact message: "Enter a valid Nigerian number, e.g. 08012345678 or +2348012345678".
- Add the same helper text under the phone field on both the desktop and mobile signup forms.

## 2. Stop the "My journey" page from showing on every return

Cause: the journey gate treats "user not loaded yet" the same as "no journey chosen". When the app resumes and the session is still restoring, the profile read returns nothing, so the gate redirects to the journey page. On that page saving fails because the profile record hasn't loaded either — which is why picking a journey appears to do nothing.

Fixes:
- The academic-stage hook waits for auth to finish restoring before deciding, and keeps the last known stage (already cached locally) instead of falling back to "none".
- The route gates only send someone to the journey page once the profile has actually been read and confirmed empty — i.e. genuinely new users.
- The journey page's Continue button waits for the profile to be available and shows a clear error instead of silently failing.
- The journey page remains reachable on demand from Settings > Academic journey.

## 3. Show the user's profile picture

The avatar in the app top bar reads a field that is never written (`avatar_url`) while uploads are saved to `profile_image_url`, so it always falls back to initials.

- Point the top-bar avatar (and the mobile home greeting avatar) at the uploaded picture, with initials as fallback when there's no image.

## Technical notes

- `src/utils/inputValidation.ts`: replace `phoneSchema` with a Nigerian-aware schema plus a `normalizePhone()` helper; use it in `AuthForm.tsx` and `MobileAuthForm.tsx` before submit.
- `src/hooks/useAcademicStage.tsx`: consume `loading` from `useAuth`, stay in loading state while auth resolves, seed from `edura_academic_stage` cache, expose a `resolved` flag.
- `src/components/PlatformRouter.tsx`: `DashboardBySide`, `CampusOnly`, `CoreOnly` redirect to `/campus/journey` only when `resolved && !stage`.
- `src/pages/campus/CampusJourney.tsx`: guard `save()` on profile availability.
- `src/components/edura/AppShell.tsx` and `src/pages/MobileHome.tsx`: `AvatarImage src={userProfile?.profile_image_url}`.

No database changes required.
