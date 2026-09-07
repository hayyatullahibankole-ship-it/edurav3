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
