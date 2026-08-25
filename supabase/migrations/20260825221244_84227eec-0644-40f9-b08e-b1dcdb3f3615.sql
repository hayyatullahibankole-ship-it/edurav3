
-- 1. Trial fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_source text;

-- 2. Settings defaults
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES
  ('trial_days', '30', 'Number of free trial days granted on signup', true),
  ('notifications_enabled', 'true', 'Master switch for automated notifications', false),
  ('notification_evening_hour_utc', '18', 'UTC hour for the main daily notification run', false),
  ('notification_morning_hour_utc', '6', 'UTC hour for the morning notification run', false)
ON CONFLICT (key) DO NOTHING;

-- 3. Notification rules
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  run_window text NOT NULL DEFAULT 'evening',
  last_run_at timestamptz,
  last_sent_count integer NOT NULL DEFAULT 0,
  total_sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_rules TO authenticated;
GRANT ALL ON public.notification_rules TO service_role;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read notification rules"
  ON public.notification_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage notification rules"
  ON public.notification_rules FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

GRANT INSERT, UPDATE, DELETE ON public.notification_rules TO authenticated;

CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Notification log (dedupe)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_key text NOT NULL,
  dedupe_key text NOT NULL,
  channel text NOT NULL DEFAULT 'inapp',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rule_key, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_sent ON public.notification_log (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_rule ON public.notification_log (rule_key, sent_at DESC);

GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notification log"
  ON public.notification_log FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- 5. Seed rules
INSERT INTO public.notification_rules (rule_key, label, category, description, priority, run_window) VALUES
  ('trial_started', 'Trial started', 'trial', 'Welcome message when a free trial begins', 10, 'evening'),
  ('trial_day7', 'Trial day 7 check-in', 'trial', 'Mid-trial engagement nudge', 15, 'evening'),
  ('trial_3_days_left', 'Trial: 3 days left', 'trial', 'Upgrade reminder 3 days before trial ends', 12, 'evening'),
  ('trial_1_day_left', 'Trial: 1 day left', 'trial', 'Final upgrade reminder', 11, 'evening'),
  ('trial_ended', 'Trial ended', 'trial', 'Sent the day the trial expires', 10, 'evening'),
  ('trial_winback', 'Trial win-back', 'trial', 'Sent 3 days after trial expiry', 20, 'evening'),
  ('sub_expiring', 'Subscription expiring', 'billing', 'Paid plan expiring in 3 days', 10, 'evening'),
  ('streak_at_risk', 'Streak at risk', 'study', 'No activity today and a streak is active', 40, 'evening'),
  ('inactive_3_days', 'Inactive 3 days', 'study', 'No practice in the last 3 days', 45, 'evening'),
  ('weekly_recap', 'Weekly recap', 'study', 'Sunday evening progress summary', 50, 'evening'),
  ('exam_countdown', 'Exam countdown', 'exam', 'Milestone reminders before JAMB/WAEC', 30, 'morning'),
  ('campus_tasks_due', 'Campus tasks due', 'campus', 'Logbook, project milestone and NYSC task reminders', 35, 'morning'),
  ('news_published', 'News & announcements', 'news', 'Fan-out when education/admission news is published', 60, 'evening')
ON CONFLICT (rule_key) DO NOTHING;

-- 6. Grant trial on signup
CREATE OR REPLACE FUNCTION public.grant_signup_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer;
BEGIN
  IF NEW.trial_started_at IS NOT NULL OR NEW.free_practice_access IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(value, '')::integer, 30) INTO v_days
  FROM public.system_settings WHERE key = 'trial_days';

  IF v_days IS NULL THEN v_days := 30; END IF;

  NEW.free_practice_access := true;
  NEW.free_access_expiry_date := (now() + (v_days || ' days')::interval)::date;
  NEW.trial_started_at := now();
  NEW.trial_source := 'signup';

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'grant_signup_trial error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_signup_trial_trigger ON public.users;
CREATE TRIGGER grant_signup_trial_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_signup_trial();
