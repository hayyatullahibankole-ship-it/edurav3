# Fix "failed to create sync log" on API Import

## What's happening (confirmed)

When the sync service tries to record an import in `external_sync_logs`, it writes the signed-in admin's ID into `created_by`. That column has a foreign key to the public `users` table — but only 29 of the 198 accounts in the database have a matching row there (the other 169 exist only in the sign-in system). Any admin without a row in `users` gets the foreign-key violation you saw. Verified by querying the constraint (`FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`) and the row counts.

## The fix

**One small database migration:**

- Drop the broken foreign key `external_sync_logs_created_by_fkey`.
- Re-add it pointing at the sign-in system's accounts (`auth.users`) instead of the `users` profile table, keeping "set to empty if the account is deleted".
- Backfill nothing — existing rows stay as-is since they were inserted by users who did have profile rows.

Same-day sanity pass: also check `external_question_mappings`'s `created_by` column (and any sibling admin tables created in the same batch) for the same wrong reference, and fix in the same migration if present.

## Verification

- Migration runs cleanly.
- Query confirms the new constraint points to `auth.users`.
- Edge-function log insert is then re-tested conceptually: an admin whose ID exists in `auth.users` (all 198) will always pass the foreign key.
- You re-run Import from Admin → Questions → API Import and confirm the sync-history row appears and the provider fetch proceeds.

## Technical notes

- SQL (approximate):

```sql
ALTER TABLE public.external_sync_logs
  DROP CONSTRAINT external_sync_logs_created_by_fkey,
  ADD CONSTRAINT external_sync_logs_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

- No code changes needed — the edge function already passes the auth user ID, which is exactly what the corrected key expects.
