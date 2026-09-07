# Real JAMB-style CBT exam console

Rebuild the exam screen so it looks and behaves like the official JAMB CBT console students meet on exam day, and use that same screen everywhere an exam is taken.

## What the student will see

Top bar
- Candidate strip: profile photo (initials if none) with full name and registration/exam number, plus the exam title.
- Large digital countdown clock on the right, turning red in the final 5 minutes.
- Calculator button and Submit button.

Subject tabs
- A row of subject tabs (English, Mathematics, etc.) exactly like the real console; tapping a subject jumps to its first question and the question numbers below switch to that subject.
- Each tab shows answered/total for that subject.

Question area
- Clean white question panel: "Question 12 of 40", the question text, any diagram image, then the four options laid out as A / B / C / D rows with round selectors — the familiar exam look, one selected at a time.
- Support for option images and maths formulas stays as it is now.

Bottom console
- Numbered question grid (1...40) colour-coded: answered, unanswered, flagged for review, current.
- Previous / Next buttons, a "Flag for review" toggle, and Submit.
- On phones the grid sits in a fixed bottom bar as a swipeable strip, with a tap-to-expand full grid sheet — so numbers are always reachable but the question keeps the screen.

Behaviour kept from today
- Timer auto-submits when time runs out; answers saved locally and retried offline (mock exam); subscription checks, anti-cheat and proctoring rules unchanged.

## Where it applies

One shared exam console used by:
- Student CBT practice exams
- Akboy mock exam
- School exams
- Challenge arena exams

## Technical notes

- New `src/components/cbt/ExamConsole.tsx` (plus small parts: `CandidateBar`, `SubjectTabs`, `QuestionPanel`, `QuestionGrid`, `ExamFooter`) built on existing `CBTQuestion` / `CBTAnswers` types, so no data or backend changes.
- Props extend the current `CleanCBTInterface` contract: questions, answers, onAnswerSelect, onSubmit, duration, examTitle, submitting, disableSubmit, plus optional `candidate` (name, photo, reg number), `flagged`/`onToggleFlag`, and `bypassSubscription`.
- Subject tabs derive from `question.subject`; single-subject exams hide the tab row.
- `CleanCBTInterface.tsx`, `MockCBTInterface.tsx`, `ExamInterface.tsx`, `SubjectBasedExamInterface.tsx` and `JambCBTInterface.tsx` become thin wrappers over `ExamConsole` (keeping their existing extra logic: mock offline persistence, proctoring, upgrade dialog) so `CBTExam.tsx`, `AkboyMockExam.tsx`, `ChallengeDetail.tsx` and school exam pages need no changes beyond passing candidate info.
- Candidate photo/name read from the existing auth profile; mock exam uses the registration record.
- All colours via existing semantic tokens, no gradients; safe-area padding for the native app; keyboard shortcuts (A-D, arrow keys) on desktop.
- Verify with typecheck, the existing smoke tests, and Playwright captures at phone and desktop widths checking no horizontal overflow.

## Camera proctoring and anti-cheat

Built into the same console, on by default for real exams (practice mode can run without it):
- Permission step before the exam starts: the student sees a short screen asking for camera access, with a live preview and a "Start exam" button. Clear message if they deny it.
- Small live camera thumbnail in the candidate panel with a red "Recording" dot, like the mock exam has today; a warning appears if the camera stops.
- Periodic snapshots (start, then every few minutes and at submission) uploaded to a private storage bucket and attached to the attempt, so admins can review them with the result.
- Anti-cheat events reuse the existing monitor: tab switching, copy/paste, right-click and fullscreen exit are blocked and counted; repeated tab switches show warnings and, past a limit, auto-submit.
- Every event and snapshot is stored on the attempt's proctoring record and shown in the admin exam review.
- Students are told up-front what is recorded, matching the privacy policy.

Technical notes for this part:
- Extract the mock exam's camera logic into `src/components/cbt/useProctoring.ts` (stream setup, health checks, snapshot capture via canvas) shared by all exam surfaces.
- Snapshots go to a private `proctoring-snapshots` bucket with per-attempt paths and admin-only read access, referenced from the attempt's existing `proctoring_data`.
- `antiCheat.ts` stays the event source; the console subscribes and persists a summary with the attempt.
- Camera is optional on the native app if permission is denied for practice exams; required for mock and school exams.
