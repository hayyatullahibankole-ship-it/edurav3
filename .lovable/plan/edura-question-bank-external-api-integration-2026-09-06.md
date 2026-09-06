# Edura Question Bank: External API Integration

## Recommendation

Use **ALOC as the primary question API**, with SdashAPI kept as a fallback option.

**Why ALOC first:**
- 7,000 free API calls to test integration before spending money [4](https://questions.aloc.com.ng/secure/signup)
- Over 5.4 million requests served, so the infrastructure is mature [5](https://github.com/seunope/aloc-endpoints)
- New ALOC Station platform provides structured topic taxonomies, difficulty ratings, and step-by-step explanations [2](https://questions.aloc.com.ng/)
- TypeScript SDK available for cleaner integration [1](https://aloc.com.ng/)
- Likely cheaper than SdashAPI based on your own observation

**Important caveat:** exact live pricing for both APIs is not published in the search results. Before committing, request pricing/API keys from both providers and run a small ALOC test batch using the free credits.

## The Mobile App Will Not Change

The mobile app and website already fetch questions through Supabase RPCs:
- `get_random_questions_for_subjects`
- `get_random_questions_for_exam`
- `get_exam_questions_secure`

These RPCs read from the existing `questions` table. If we populate that table from ALOC instead of manual entry, the app keeps working exactly as it does today. No mobile screen, exam interface, or scoring logic needs to be rebuilt.

## Technical Approach: Cache API Questions in Supabase

"The best" sync model is to **download ALOC questions into Edura's own database**.

**Advantages:**
- Exams are fast and work offline
- Mobile UI stays untouched
- You can mix ALOC questions with your own
- Reduces API costs (fetch once, serve many exams)
- Existing scoring, review, and analytics keep working

## What We Will Build

### 1. Database additions
- Add nullable columns to `public.questions`:
  - `external_source` (text) — e.g. "aloc"
  - `external_id` (text) — ALOC's question identifier
  - `exam_body` (text) — JAMB, WAEC, NECO, POST_UTME
  - `exam_year` (integer)
- Create `public.external_question_mappings` table to map ALOC subjects/years to Edura `subjects` rows.
- Create `public.external_sync_logs` table to track imports, counts, errors, and API usage.

### 2. Edge function: `sync-external-questions`
- Accepts `{ provider, exam_body, subject_code, year, limit, dry_run }`
- Validates admin JWT
- Calls ALOC API using a stored secret key
- Transforms ALOC response into Edura `questions` schema
- Upserts questions with duplicate detection by `external_id`
- Logs results to `external_sync_logs`
- Enforces daily/monthly import limits to control cost

### 3. Admin UI in QuestionManagement
- New "Import from API" tab
- Dropdowns for provider (ALOC / SdashAPI), exam body, subject, year
- "Preview" button to see sample questions before importing
- "Import" button with batch size and cost estimate
- Sync history table showing previous imports and success/failure counts

### 4. Subject mapping setup
- Pre-seed mappings for major Nigerian subjects: Mathematics, English, Physics, Chemistry, Biology, Government, Literature, Economics, etc.
- Admin can edit mappings if ALOC subject names differ from Edura's.

### 5. Cost guards
- Hard daily import cap (e.g. 1,000 questions/day) configurable in admin
- Per-provider monthly spend estimate based on known per-call pricing
- Warnings before large imports

## Implementation Steps

1. **Get API credentials** — sign up for ALOC (and optionally SdashAPI) and retrieve API keys.
2. **Add secrets** — store `ALOC_API_KEY` and `SDASHAPI_API_KEY` via Supabase edge-function secrets.
3. **Run migration** — add columns to `questions` and create mapping/sync-log tables with GRANTs and RLS.
4. **Build `sync-external-questions` edge function** — fetch, transform, deduplicate, upsert.
5. **Build admin import UI** — add the Import from API tab to QuestionManagement.
6. **Seed subject mappings** — map ALOC subjects to Edura subjects for JAMB/WAEC/NECO/Post-UTME.
7. **Test end-to-end** — import a small JAMB Mathematics batch, verify it appears in admin, start a mobile exam, confirm scoring works.
8. **Document provider switch** — keep SdashAPI adapter ready so you can switch if ALOC quality or pricing disappoints.

## Success Criteria

- Admin can import 100 JAMB/WAEC/NECO/Post-UTME questions without touching mobile code.
- Imported questions appear in the existing question list and can be used in exams immediately.
- Mobile exam flow, scoring, and review work unchanged.
- API usage and costs are visible and controllable from the admin dashboard.

## Notes & Risks

- ALOC's legacy `questions.aloc.com.ng` endpoint is reaching end-of-life in ~12 months [2](https://questions.aloc.com.ng/); we will target the new ALOC Station API.
- SdashAPI may have better data for some exam bodies; the architecture supports swapping providers.
- Final pricing must be confirmed directly with both providers before scaling imports.
