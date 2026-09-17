-- 1. Mock batches: admins only
DROP POLICY IF EXISTS "Anyone can create batches" ON public.mock_batches;

-- 2. Mock results: remove wide-open write and read policies
DROP POLICY IF EXISTS "Backend can insert mock results" ON public.mock_results;
DROP POLICY IF EXISTS "Backend can update mock results" ON public.mock_results;
DROP POLICY IF EXISTS "Everyone can read released mock results" ON public.mock_results;

-- 3. Attempts: remove weak unauthenticated mock insert
DROP POLICY IF EXISTS "Mock exams can be submitted unauthenticated" ON public.attempts;

-- 4. Team applications: admin only
DROP POLICY IF EXISTS "Authenticated users can view team applications" ON public.team_applications;
DROP POLICY IF EXISTS "Authenticated users can update team applications" ON public.team_applications;
CREATE POLICY "Admins can view team applications"
ON public.team_applications FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update team applications"
ON public.team_applications FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 5. Audit log immutability
DROP POLICY IF EXISTS "Audit logs are immutable - no updates" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs are immutable - no deletes" ON public.audit_logs;
CREATE POLICY "Audit logs are immutable - no updates"
ON public.audit_logs FOR UPDATE USING (false);
CREATE POLICY "Audit logs are immutable - no deletes"
ON public.audit_logs FOR DELETE USING (false);

-- 6. Hide secret columns on users from the API
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users'
    AND column_name NOT IN ('two_fa_secret', 'active_session_token');

  EXECUTE 'REVOKE SELECT ON public.users FROM anon, authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.users TO authenticated', cols);
  EXECUTE format('GRANT SELECT (%s) ON public.users TO anon', cols);
END $$;

-- 7. Hide school contact details from signed-out visitors
DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'schools'
    AND column_name NOT IN ('email', 'phone', 'address');

  EXECUTE 'REVOKE SELECT ON public.schools FROM anon';
  EXECUTE format('GRANT SELECT (%s) ON public.schools TO anon', cols);
END $$;