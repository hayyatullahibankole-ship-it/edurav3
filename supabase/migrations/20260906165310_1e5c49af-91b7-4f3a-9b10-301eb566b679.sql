DROP FUNCTION IF EXISTS public.get_review_questions_for_attempt(uuid);

CREATE OR REPLACE FUNCTION public.get_review_questions_for_attempt(attempt_uuid uuid)
 RETURNS TABLE(id uuid, question_text text, options jsonb, correct_answer_index integer, explanation text, subject_id uuid, subject_name text, user_answer_index integer, is_correct boolean, time_spent_seconds integer, media_urls jsonb, option_media jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_owns_attempt boolean;
  is_admin_user boolean;
  attempt_status attempt_status;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.attempts a
    JOIN public.users u ON a.user_id = u.id
    WHERE a.id = attempt_uuid AND u.auth_user_id = auth.uid()
  ) INTO user_owns_attempt;

  SELECT is_admin(auth.uid()) INTO is_admin_user;
  SELECT a.status INTO attempt_status FROM public.attempts a WHERE a.id = attempt_uuid;

  IF NOT (user_owns_attempt OR is_admin_user) THEN
    RAISE EXCEPTION 'Access denied to attempt data';
  END IF;

  IF attempt_status != 'SUBMITTED' THEN
    RAISE EXCEPTION 'Review is only available for submitted attempts';
  END IF;

  RETURN QUERY
  SELECT 
    q.id::uuid AS id,
    q.question_text::text AS question_text,
    q.options::jsonb AS options,
    (
      CASE
        WHEN q.correct_answer ~ '^\s*[0-3]\s*$' THEN (q.correct_answer)::integer
        WHEN q.correct_answer ~ '^\s*"[0-3]"\s*$' THEN (trim(both '"' from q.correct_answer))::integer
        WHEN q.correct_answer ~ '^\s*[A-Da-d]\s*$' THEN ascii(upper(trim(q.correct_answer))) - 65
        WHEN q.correct_answer ~ '^\s*"[A-Da-d]"\s*$' THEN ascii(upper(trim(both '"' from q.correct_answer))) - 65
        ELSE 0
      END
    )::integer AS correct_answer_index,
    COALESCE(q.explanation, '')::text AS explanation,
    q.subject_id::uuid AS subject_id,
    COALESCE(s.name, 'Unknown')::text AS subject_name,
    (
      CASE 
        WHEN aa.answer IS NULL THEN NULL
        WHEN jsonb_typeof(aa.answer) = 'number' THEN (aa.answer::text)::integer
        WHEN jsonb_typeof(aa.answer) = 'string' AND (aa.answer::text) ~ '^"[A-Da-d]"$' THEN ascii(upper(trim(both '"' from aa.answer::text))) - 65
        ELSE NULL
      END
    )::integer AS user_answer_index,
    COALESCE(aa.is_correct, false)::boolean AS is_correct,
    COALESCE(aa.time_spent_seconds, 0)::integer AS time_spent_seconds,
    COALESCE(q.media_urls, '[]'::jsonb) AS media_urls,
    COALESCE(q.option_media, '[]'::jsonb) AS option_media
  FROM public.attempt_answers aa
  JOIN public.questions q ON q.id = aa.question_id
  LEFT JOIN public.subjects s ON s.id = q.subject_id
  WHERE aa.attempt_id = attempt_uuid;
END;
$function$;