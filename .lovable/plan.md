# Bigger daily import limit + pause and resume

## What changes for you

- The daily limit on imported questions goes from 1,000 to 20,000, so a long import run no longer stops after a few subjects.
- The bulk import panel gets **Pause**, **Resume**, and **Reset queue** buttons next to Stop. Pausing finishes the job in progress, then waits; resuming picks up at the next unfinished job instead of restarting from the top.
- The queue survives a page refresh or accidental navigation. When you come back to the API Import tab, the panel offers to continue the saved run from where it left off.
- Failed jobs can be retried on their own: a "Retry failed" button re-runs only the jobs that errored, without redoing the completed ones.
- The progress line shows finished / total, imported, skipped, and how many of today's 20,000 have been used, refreshed after each job.

## Technical details

**Edge function `sync-external-questions`**
- Change `DEFAULT_DAILY_CAP` from `1000` to `20000`; the `EXTERNAL_IMPORT_DAILY_CAP` env override stays.
- Keep the existing `get_daily_import_count` pre-flight check and its error message so the UI can still detect cap-reached and halt.

**`src/components/admin/ExternalQuestionImport.tsx`**
- Replace the single `stopRef` with a control ref holding `'run' | 'pause' | 'stop'`, plus `bulkPaused` state.
- Extract the per-job loop into `runQueue(jobs)` that iterates only over jobs with status `queued` or `failed-on-retry`, checks the control ref before each job, marks remaining jobs `paused` (new status) rather than `stopped` when paused, and exits cleanly.
- On `Resume`, call `runQueue` again with the current `bulkJobs`, so `done` jobs are skipped.
- Persist `{ provider, bulkTarget, jobs }` to `localStorage` under an admin-scoped key after every job status update; load it on mount and show a "Continue previous run" banner when unfinished jobs exist. `Reset queue` clears the stored state.
- Add `Retry failed`, which flips `failed` jobs back to `queued` and runs the queue.
- Raise the per-job maximum from 500 to keep matching the edge-function limit only if the function allows it; otherwise leave the per-job cap unchanged and rely on the higher daily cap.
- Keep the existing cap-reached detection: when the message matches `daily import cap`, set the control to `stop` and surface the toast.

**Verification**
- Typecheck, existing smoke tests, and a small live run (2 subjects x 1 year) checking pause mid-run, refresh, and resume producing no duplicate imports (dedupe by `external_source` + `external_id` already protects against this).
