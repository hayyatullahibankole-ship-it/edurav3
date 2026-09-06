ALTER TABLE public.external_sync_logs
  DROP CONSTRAINT external_sync_logs_created_by_fkey,
  ADD CONSTRAINT external_sync_logs_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;