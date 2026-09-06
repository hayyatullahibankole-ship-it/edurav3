# Fix the "Import" button error on API Import

## What's happening

The Import button calls the question-sync service, that service fails, and the screen only shows a generic "non-2xx status" message instead of the real reason. Two separate problems:

1. **The real error is hidden.** The service returns a clear message (e.g. "no subject mapping", "provider rejected the key"), but the admin screen throws it away and shows the generic text. The service also writes nothing to its logs, so its recent logs show only start/stop entries with no failure detail.

2. **The requests sent to the question providers are almost certainly wrong.** Confirmed by reading the provider code:
   - Neither provider request includes the **subject** (e.g. "english", "physics"). Both ALOC and SdashAPI require it, so the provider replies with an error, which the service turns into a failed fetch.
   - The ALOC request uses `Authorization: Bearer <key>` against `api.aloc.com.ng/api/v1/questions`. ALOC's live service uses an `AccessToken` header and the `questions.aloc.com.ng/api/v2` endpoints (`/q` for one question, `/m` for many).

   Not yet confirmed: whether the two saved API keys are valid, since testing needs an admin login that isn't available from here.

## The fix

**Surface real errors**
- Read the failure body returned by the service and show that exact message on the admin screen (missing mapping, provider rejected key, daily cap reached, not admin, etc.).
- Log each step inside the service (provider, subject, exam body, provider URL without the key, provider response status and body snippet) so failures are visible in the function logs.
- Save the provider's own error text into the sync history row so past failures stay readable.

**Correct the provider requests**
- Pass the mapped provider subject code on every request; if a subject has no mapping for the chosen provider and exam body, stop early with a clear "map this subject first" message instead of calling the provider.
- ALOC: switch to the v2 endpoints (`/m` for batches, `/q` for single) with the `AccessToken` header, keeping the base URL overridable by setting.
- SdashAPI: keep `AccessToken` and `/v1/q`, add the subject parameter, and keep the 50-per-request ceiling with repeat calls when a larger batch is asked for.
- Treat an empty provider result as a clear "no questions returned for this subject/year" message, not a crash.

**Add a connection check**
- A "Test connection" action next to Preview that makes one tiny request per provider and reports plainly whether the key works, so key problems are separated from mapping problems.

## Technical notes

- Files: `supabase/functions/sync-external-questions/index.ts`, `providers/aloc.ts`, `providers/sdashapi.ts`, `types.ts`, `src/components/admin/ExternalQuestionImport.tsx`.
- Client-side: use `FunctionsHttpError.context.json()` from `supabase.functions.invoke` to read the JSON error body.
- Mapping lookup must filter by `provider + exam_body + edura_subject_id` and return the stored provider subject code; the current code only resolves the Edura subject and never uses the provider code.
- Extend `providers_test.ts` with cases for URL/header construction and empty responses; then run the Deno tests, typecheck, smoke tests, and a build.

## Verification

After deploying, sign in as admin, run Test connection for both providers, Preview 5 JAMB English questions, then Import and confirm the new rows and the sync-history entry.
