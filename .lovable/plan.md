# Exam-specific question mapping (WAEC vs JAMB vs NECO vs Post-UTME)

Right now, when a student picks WAEC or JAMB, the app pulls questions from the same pool — only the number of questions per subject differs. This makes practice pull questions that belong to the wrong exam.

## What will change

- Picking JAMB shows only JAMB questions; picking WAEC shows only WAEC questions; same for NECO and Post-UTME.
- The question count shown before starting a test will reflect the chosen exam, so a student is told upfront if a subject doesn't have enough WAEC (or JAMB) questions yet.
- Admin gets a way to label existing questions with the exam they belong to, plus a filter to see how many questions each exam and subject currently has.

## Important: current state of the question bank

Of the questions in the bank today, 40 are labelled JAMB (the ones just imported) and 4,483 have no exam label at all. If filtering were switched on strictly right away, almost every practice test would come back empty.

So the rollout is:

1. Untagged questions are treated as usable for any exam (safety net), and labelled questions are always preferred for the chosen exam.
2. Admin labels the existing bank (bulk action, by subject or by upload batch) and keeps importing per exam body.
3. Once a subject has enough labelled questions, an admin switch turns on strict mode so only that exam's questions are used.

## Technical notes

Database (single migration):
- Add an optional `exam_body` argument to `get_random_questions_for_subjects` and `get_random_questions_for_exam`. When provided, prefer rows where `questions.exam_body = <body>`, then top up from untagged rows only while strict mode is off.
- Add `get_subject_question_counts(exam_body)` variant returning counts per subject for a given exam, plus untagged counts.
- Add an index on `questions(subject_id, exam_body, is_active)`.
- Add a `strict_exam_body_filter` flag in `system_settings`, read by the functions.
- Store the exam body on `exams` blueprint usage via the existing `exam_type` column where set.

Frontend:
- `src/hooks/useCBTExam.tsx` — pass the attempt's `proctoring_data.exam_type` (normalised to JAMB/WAEC/NECO/POST_UTME) into both RPCs.
- `src/components/ScheduleTestModal.tsx` — re-fetch per-subject counts whenever the exam type changes and validate sufficiency against the exam-specific count.
- `src/pages/ChallengeDetail.tsx`, `src/components/dashboard/OfflineModeCard.tsx`, `src/utils/offlineExamManager.ts`, `src/components/school/SchoolAvailableExams.tsx`, `src/pages/akboy/AkboyMockExam.tsx` — pass the exam body through the same RPCs (Akboy mock keeps its current WAEC/JAMB configuration).
- `src/components/admin/QuestionManagement.tsx` — exam-body column, exam-body filter, bulk "set exam body" action on selected/filtered questions, and the strict-mode switch.
- Bulk upload and the API importer already set `exam_body`; the upload template gets an explicit exam column.

Verification: smoke test that a WAEC attempt returns only WAEC-labelled questions when strict mode is on, and existing test suite plus build.
