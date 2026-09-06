# Fix refresh 404s (external host) + bulk question importing

## Part 1 — Stop the 404 on refresh (Option B)

Keep the site on the current external host and tell it to serve the app for every path.

- Add a `vercel.json` at the project root with a catch-all rewrite to `/index.html`, so `/dashboard`, `/login`, `/akboy/...` etc. load on refresh and direct links.
- Also add a `public/_redirects` fallback line (`/* /index.html 200`) so the same behaviour applies if the site is ever served from Netlify-style hosting or Lovable.
- After the next deploy of the site on that host, refresh a few deep pages to confirm they load instead of showing 404.

Note: the fix only takes effect once the external host redeploys from this project's code. If the host builds from a different repo, the same `vercel.json` file must be added there.

## Part 2 — Bulk question importing

Today each import is one subject, one exam body, one pull, and the provider returns at most 40 questions per call. That means hundreds of clicks.

### What changes on the admin screen

A new "Bulk import" panel in Admin → Questions → API Import:

- Pick exam bodies (JAMB, WAEC, NECO, Post-UTME) — multi-select.
- Pick subjects: "All mapped subjects" by default, or tick specific ones.
- Pick years: a range (e.g. 2010–2024) or "any year".
- Set a target per subject/year (e.g. 200 questions).
- Press Start once. A live progress list shows each subject/year combination as queued, running, done (imported/skipped) or failed, with a running total and a Stop button.

### How it runs behind the scenes

- The import service gains a `bulk` action that expands the selection into a job list (exam body × subject × year) and works through it.
- For each combination it calls the provider repeatedly in 40-question pulls, de-duplicating by the provider question id, until the target is reached or the provider stops returning new questions.
- Small pause between provider calls so we don't get rate-limited; existing daily cap still applies and the run stops cleanly when it is reached.
- Each combination writes its own sync-history row, so the history stays readable and a failure in one subject never stops the rest.
- Work is done in chunks that fit inside the function's time limit; the admin screen keeps requesting the next chunk until the queue is empty, which is also what powers the live progress and the Stop button.

### Technical notes

- Files: `supabase/functions/sync-external-questions/index.ts` (new `bulk` action, per-combination looping, resume-by-cursor), `providers/aloc.ts` and `providers/sdashapi.ts` (repeat pulls with de-duplication until target), `src/components/admin/ExternalQuestionImport.tsx` (bulk panel, queue state, progress table, stop).
- Imported rows keep `external_source`/`external_id` de-duplication plus `exam_body` and `exam_year`, so exam-specific question selection keeps working.
- Verification: run a small bulk job (2 subjects × 2 years, target 40), confirm counts in sync history and in the question list filtered by exam body; then typecheck, smoke tests and build.
