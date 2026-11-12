CREATE OR REPLACE FUNCTION public.grant_signup_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_days integer := 0;
  v_trial_setting text;
BEGIN
  IF NEW.trial_started_at IS NOT NULL OR NEW.free_practice_access IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_trial_setting
  FROM public.system_settings
  WHERE key = 'trial_days';

  IF v_trial_setting IN ('3', '7') THEN
    v_days := v_trial_setting::integer;
  END IF;

  IF v_days = 0 THEN
    RETURN NEW;
  END IF;

  NEW.free_practice_access := true;
  NEW.free_access_expiry_date := (now() + (v_days || ' days')::interval)::date;
  NEW.trial_started_at := now();
  NEW.trial_source := 'signup';

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'grant_signup_trial error: %', SQLERRM;
  RETURN NEW;
END;
$function$;