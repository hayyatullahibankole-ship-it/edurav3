
-- Index for exam-body aware lookups
CREATE INDEX IF NOT EXISTS idx_questions_subject_exam_active
  ON public.questions (subject_id, exam_body, is_active);

-- Strict mode flag
INSERT INTO public.system_settings (key, value, description, is_public)
VALUES ('strict_exam_body_filter', 'false', 'When true, practice questions are restricted to the selected exam body only (no untagged fallback).', true)
ON CONFLICT (key) DO NOTHING;

-- Exam-body aware random questions per subject
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
         q.media_urls, q.points, q.time_limit_seconds, q.subject_id, q.tags
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

-- Exam-body aware blueprint questions
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
         q.media_urls, q.points, q.time_limit_seconds, q.subject_id, q.tags
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

-- Counts per subject for a given exam body
CREATE OR REPLACE FUNCTION public.get_subject_question_counts_by_exam(
  target_exam_body text DEFAULT NULL
)
RETURNS TABLE(
  subject_id uuid,
  question_count bigint,
  tagged_count bigint,
  untagged_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH params AS (
    SELECT NULLIF(upper(trim(COALESCE(target_exam_body, ''))), '') AS body,
           COALESCE((SELECT s.value = 'true' FROM public.system_settings s WHERE s.key = 'strict_exam_body_filter'), false) AS strict_mode
  )
  SELECT q.subject_id,
         COUNT(*) FILTER (
           WHERE (SELECT body FROM params) IS NULL
              OR upper(q.exam_body) = (SELECT body FROM params)
              OR (NOT (SELECT strict_mode FROM params) AND q.exam_body IS NULL)
         ) AS question_count,
         COUNT(*) FILTER (WHERE (SELECT body FROM params) IS NOT NULL AND upper(q.exam_body) = (SELECT body FROM params)) AS tagged_count,
         COUNT(*) FILTER (WHERE q.exam_body IS NULL) AS untagged_count
  FROM public.questions q
  WHERE q.is_active = true AND q.subject_id IS NOT NULL
  GROUP BY q.subject_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_subject_question_counts_by_exam(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_random_questions_for_subjects(uuid[], integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_random_questions_for_exam(uuid, text) TO anon, authenticated, service_role;
