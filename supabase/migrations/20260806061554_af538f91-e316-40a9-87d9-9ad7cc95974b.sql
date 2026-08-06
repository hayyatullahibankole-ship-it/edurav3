CREATE OR REPLACE FUNCTION public.has_scope_access(_auth_user_id uuid, _scope text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = v_user_id
      AND u.free_practice_access = true
      AND u.free_access_expiry_date IS NOT NULL
      AND u.free_access_expiry_date >= CURRENT_DATE
  ) THEN
    RETURN true;
  END IF;

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

  -- Paid subscription matching exactly the requested product scope
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON sp.id = s.plan_id
    WHERE s.user_id = v_user_id
      AND s.status = 'ACTIVE'
      AND s.end_date > now()
      AND sp.price > 0
      AND sp.resource_access_level::text = ANY(ARRAY['premium','enterprise'])
      AND sp.scope = _scope
  );
END;
$$;