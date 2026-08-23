# Fixes before Play Store + Study Decks

## 1. Two-factor authentication (real TOTP)

Today the switch in Profile Settings only stores a `two_fa_enabled` boolean — no enrollment, no code, no challenge at login. It is security theatre and would be flagged in review.

Replace it with real authenticator-app 2FA using Supabase MFA:

- Turning the switch on opens an enrollment dialog: QR code + manual secret, a 6-digit code field, and "Verify & enable". Nothing is saved until the code verifies.
- Turning it off asks for confirmation and unenrolls the factor.
- Sign-in detects an active factor and shows a code step before entering the app.
- After enabling, show one-time backup guidance (keep your authenticator, contact support if the device is lost).
- The stored flag is derived from the real factor list, not from the toggle.

Only authenticator apps in v1 (Google Authenticator, Authy, Microsoft Authenticator). SMS/email codes are not added.

## 2. Study preferences must respect the academic stage

Undergraduates currently see "Default exam type: JAMB / WAEC / NECO / Post-UTME", which is meaningless for them.

- Candidate stages keep the exam-type selector.
- Campus stages (undergraduate, graduate) instead see campus-relevant preferences: default study mode, course/level focus, and reminder cadence — with the exam-type field hidden entirely.
- The same stage awareness applies to test-duration and difficulty labels so the section reads correctly for both audiences.

## 3. Simplified first-run experience for SS3 / candidates

The candidate home shows too much at once and never explains itself. Rework it into a simple, obvious flow:

- A clear one-line "what to do now" header instead of stacked metrics for brand-new accounts.
- Three primary actions only on first use: Practice a subject, See how you're doing, Get help (AI tutor). Everything else moves below the fold.
- Empty states carry plain instructions ("You haven't practised yet — start with 20 questions") instead of blank cards.
- Tab labels and icons made literal (Practice, Services, Study, Me).
- Progressive reveal: streak, XP, leaderboard and advanced tiles only appear once the student has taken their first test.

## 4. Study Decks (PDF → sections → gated quizzes)

New feature available to every signed-in student, with AI generation limited by the existing usage quota so costs stay controlled.

Flow:

1. Student uploads a PDF (lecture note, textbook chapter, past-question booklet).
2. The text is extracted and split into ordered sections with titles and readable content.
3. Each section gets an auto-generated quiz (5–10 questions).
4. Sections unlock in order: the next section stays locked until the current quiz is passed at the set pass mark (default 70%). Retakes allowed.
5. A deck page shows progress, per-section scores, and a completion state.

Reading uses the existing in-app reader style (no download of the source file).

## 5. Pre-launch sweep

Beyond the above, I will check and fix:

- Delete Account in Profile Settings still says "contact support" while a working in-app deletion page exists — must point there (Play Store requirement).
- Any remaining dead routes / 404s from the mobile tab bar and deep links.
- Native payment gating still correct on every purchase surface (wallet, CBT subscription, e-PINs, ebooks).
- Permissions actually used and disclosed; privacy policy still matches.
- Console and runtime errors on a clean first-run session.
- Supabase linter and security scan results.

## Technical notes

- 2FA: `supabase.auth.mfa.enroll/challenge/verify/unenroll`; new enrollment dialog component; login challenge step in `AuthForm` and `MobileAuthForm`; `ProfileSettings.tsx` reads factor state rather than a local flag.
- Preferences: `AccountSettings.tsx` branches on `useAcademicStage`.
- Onboarding: `Dashboard.tsx` / `CBTHome.tsx` first-run branch keyed off whether the student has any attempts.
- Decks: new tables for decks, sections, section quizzes and attempts (with grants + RLS scoped to the owner), a private storage bucket for uploads, and an edge function that extracts PDF text, sections it, and generates questions via the AI gateway.
