-- Option-level images for questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_media jsonb DEFAULT '[]'::jsonb;

-- Storage policies for question-media bucket
DROP POLICY IF EXISTS "Question media readable by authenticated" ON storage.objects;
CREATE POLICY "Question media readable by authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'question-media');

DROP POLICY IF EXISTS "Admins upload question media" ON storage.objects;
CREATE POLICY "Admins upload question media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'question-media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update question media" ON storage.objects;
CREATE POLICY "Admins update question media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'question-media' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete question media" ON storage.objects;
CREATE POLICY "Admins delete question media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'question-media' AND public.is_admin(auth.uid()));

-- Return option_media from question-fetch functions
DROP FUNCTION IF EXISTS public.get_random_questions_for_subjects(uuid[], integer, text);
DROP FUNCTION IF EXISTS public.get_random_questions_for_exam(uuid, text);

CREATE OR REPLACE FUNCTION public.get_random_questions_for_subjects(
  subject_ids uuid[],
  per_subject_count integer DEFAULT 10,
  target_exam_body text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  question_text text,
  type question_type,
  options jsonb,
  difficulty_level integer,
  media_urls jsonb,
  option_media jsonb,
  points numeric,
  time_limit_seconds integer,
  subject_id uuid,
  tags jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  strict_mode boolean := false;
  body text := NULLIF(upper(trim(COALESCE(target_exam_body, ''))), '');
BEGIN
  SELECT COALESCE((SELECT s.value = 'true' FROM public.system_settings s WHERE s.key = 'strict_exam_body_filter'), false)
    INTO strict_mode;

  RETURN QUERY
  WITH s AS (SELECT unnest(subject_ids) AS sid)
  SELECT q.id, q.question_text, q.type, q.options, q.difficulty_level,
         q.media_urls, q.option_media, q.points, q.time_limit_seconds, q.subject_id, q.tags
  FROM s
  JOIN LATERAL (
    SELECT q.*
    FROM public.questions q
    WHERE q.subject_id = s.sid
      AND q.is_active = true
      AND (
        body IS NULL
        OR upper(q.exam_body) = body
        OR (NOT strict_mode AND q.exam_body IS NULL)
      )
    ORDER BY
      CASE WHEN body IS NOT NULL AND upper(q.exam_body) = body THEN 0 ELSE 1 END,
      random()
    LIMIT per_subject_count
  ) q ON TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_random_questions_for_exam(
  target_exam_id uuid,
  target_exam_body text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  question_text text,
  type question_type,
  options jsonb,
  difficulty_level integer,
  media_urls jsonb,
  option_media jsonb,
  points numeric,
  time_limit_seconds integer,
  subject_id uuid,
  tags jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  strict_mode boolean := false;
  body text := NULLIF(upper(trim(COALESCE(target_exam_body, ''))), '');
BEGIN
  SELECT COALESCE((SELECT s.value = 'true' FROM public.system_settings s WHERE s.key = 'strict_exam_body_filter'), false)
    INTO strict_mode;

  IF body IS NULL THEN
    SELECT NULLIF(upper(trim(e.exam_type::text)), '') INTO body
    FROM public.exams e WHERE e.id = target_exam_id;
    IF body = 'CUSTOM' THEN
      body := NULL;
    END IF;
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.type, q.options, q.difficulty_level,
         q.media_urls, q.option_media, q.points, q.time_limit_seconds, q.subject_id, q.tags
  FROM public.exam_subjects es
  JOIN LATERAL (
    SELECT q.*
    FROM public.questions q
    WHERE q.subject_id = es.subject_id
      AND q.is_active = true
      AND (
        body IS NULL
        OR upper(q.exam_body) = body
        OR (NOT strict_mode AND q.exam_body IS NULL)
      )
    ORDER BY
      CASE WHEN body IS NOT NULL AND upper(q.exam_body) = body THEN 0 ELSE 1 END,
      random()
    LIMIT COALESCE(es.question_count, 0)
  ) q ON TRUE
  WHERE es.exam_id = target_exam_id;
END;
$$;