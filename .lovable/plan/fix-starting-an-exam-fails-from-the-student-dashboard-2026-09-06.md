# Fix: starting an exam fails from the student dashboard

## What's happening

I reproduced the failure against the live database. The test/exam itself is created fine — the failure happens the moment the app asks for the questions.

There are two duplicate copies of the question-fetching database routines (an older one and a newer one that also filters by exam body: JAMB/WAEC/NECO/Post-UTME). When the app asks for questions without naming an exam body — which happens for any practice test whose type isn't one of those four (e.g. "Custom"/"Practice") — the database can't decide which copy to use and returns an error instead of questions. The student then sees the exam fail to start.

Confirmed by calling the endpoint directly:
- request without exam body -> error `PGRST203` ("could not choose the best candidate function")
- request with exam body -> 200 with questions

The same duplication exists for the exam-blueprint routine and for two other routines (incomplete-question lookup, ebook code redemption), so those can fail the same way.

## The fix

1. Remove the outdated duplicate copies of the four routines, keeping only the current versions (they already behave identically when no exam body is given, so nothing changes for JAMB/WAEC flows).
2. Re-grant execute permission to the app roles on the kept versions.
3. Make the app always send an explicit exam-body value (empty means "any") so the request can never be ambiguous again.
4. Show a clear, specific message if questions still can't be loaded, instead of a generic failure.

## Verification

- Call the question endpoints with and without an exam body and confirm both return questions.
- Start a practice test end to end from the student dashboard (JAMB and a non-JAMB/custom type) and confirm questions load.
- Run the existing exam smoke tests, typecheck, and production build.

## Technical notes

- Drop `public.get_random_questions_for_subjects(uuid[], integer)`, `public.get_random_questions_for_exam(uuid)`, and the stale overloads of `find_incomplete_questions` and `redeem_ebook_code`; keep the newest signatures and re-issue `GRANT EXECUTE ... TO authenticated` (plus `anon`/`service_role` where the current grants require it).
- In `src/hooks/useCBTExam.tsx`, pass `target_exam_body: normalizeExamBody(...) ?? null` (never `undefined`) for all three RPC call sites.
