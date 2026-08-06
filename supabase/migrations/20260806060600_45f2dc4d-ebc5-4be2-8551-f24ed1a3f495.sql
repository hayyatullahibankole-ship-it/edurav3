ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'cbt',
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'premium';

UPDATE public.subscription_plans SET scope = 'cbt' WHERE scope IS NULL;

INSERT INTO public.subscription_plans (name, description, price, currency, duration_days, resource_access_level, is_active, scope, tier, features)
SELECT * FROM (VALUES
  ('Campus Premium', 'AI course explanations and past-question generation for higher institution students', 2500::numeric, 'NGN', 30, 'premium', true, 'campus', 'premium', '["Course Companion AI","Past question generation","Study material tools"]'::jsonb),
  ('Campus Pro', 'Everything in Campus Premium plus project assistant, CV and portfolio tools', 4500::numeric, 'NGN', 30, 'premium', true, 'campus', 'pro', '["Everything in Campus Premium","Project Assistant","CV & portfolio builder","Priority AI limits"]'::jsonb),
  ('Edura All-Access', 'CBT practice plus the full Campus AI suite in one plan', 6000::numeric, 'NGN', 30, 'enterprise', true, 'all', 'pro', '["All CBT practice content","Everything in Campus Pro","Best value bundle"]'::jsonb)
) AS v(name, description, price, currency, duration_days, resource_access_level, is_active, scope, tier, features)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans sp WHERE sp.name = v.name);

CREATE OR REPLACE FUNCTION public.has_scope_access(_auth_user_id uuid, _scope text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF public.is_admin(_auth_user_id) THEN
    RETURN true;
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = _auth_user_id LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Promo access
  IF EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = v_user_id
      AND u.free_practice_access = true
      AND u.free_access_expiry_date IS NOT NULL
      AND u.free_access_expiry_date >= CURRENT_DATE
  ) THEN
    RETURN true;
  END IF;

  -- School subscriptions unlock everything for their students
  IF EXISTS (
    SELECT 1
    FROM public.school_students stu
    JOIN public.school_subscriptions ss ON ss.school_id = stu.school_id
    WHERE stu.user_id = v_user_id
      AND stu.is_active = true
      AND ss.status = 'ACTIVE'
      AND ss.end_date > now()
  ) THEN
    RETURN true;
  END IF;

  -- Personal paid subscription matching the requested scope (or an all-access plan)
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE s.user_id = v_user_id
      AND s.status = 'ACTIVE'
      AND s.end_date > now()
      AND sp.resource_access_level::text = ANY(ARRAY['premium','enterprise'])
      AND (sp.scope = _scope OR sp.scope = 'all')
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.has_scope_access(uuid, text) TO authenticated, anon, service_role;