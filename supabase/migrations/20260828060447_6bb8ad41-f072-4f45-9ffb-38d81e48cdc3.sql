CREATE OR REPLACE FUNCTION public.check_otp_send_rate_limit(p_email text, p_purpose text DEFAULT 'otp')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text := lower(trim(p_email));
  v_endpoint text := 'otp_send:' || coalesce(p_purpose, 'otp');
  v_hour_count integer;
  v_last timestamptz;
  v_wait integer := 0;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_email', 'retry_after', 0);
  END IF;

  SELECT count(*), max(created_at) INTO v_hour_count, v_last
  FROM rate_limits
  WHERE endpoint = v_endpoint
    AND details->>'email' = v_email
    AND created_at > now() - INTERVAL '1 hour';

  IF v_last IS NOT NULL THEN
    v_wait := greatest(0, 45 - floor(extract(epoch FROM (now() - v_last)))::int);
  END IF;

  IF v_wait > 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'cooldown', 'retry_after', v_wait);
  END IF;

  IF v_hour_count >= 5 THEN
    PERFORM log_security_event(
      'OTP_RATE_LIMIT_EXCEEDED',
      'auth',
      NULL,
      jsonb_build_object('email', v_email, 'purpose', p_purpose, 'count', v_hour_count)
    );
    RETURN jsonb_build_object('allowed', false, 'reason', 'hourly_limit', 'retry_after', 3600);
  END IF;

  INSERT INTO rate_limits (user_id, endpoint, request_count, window_start, created_at, details)
  VALUES (NULL, v_endpoint, 1, now(), now(), jsonb_build_object('email', v_email, 'purpose', p_purpose));

  RETURN jsonb_build_object('allowed', true, 'remaining', 4 - v_hour_count, 'retry_after', 45);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.check_otp_send_rate_limit(text, text) TO anon, authenticated;