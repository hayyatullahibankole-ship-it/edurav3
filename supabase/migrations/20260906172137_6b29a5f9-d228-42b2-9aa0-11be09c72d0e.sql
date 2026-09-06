DROP FUNCTION IF EXISTS public.get_random_questions_for_subjects(uuid[], integer);
DROP FUNCTION IF EXISTS public.get_random_questions_for_exam(uuid);
DROP FUNCTION IF EXISTS public.find_incomplete_questions(text);
DROP FUNCTION IF EXISTS public.redeem_ebook_code(text);

GRANT EXECUTE ON FUNCTION public.get_random_questions_for_subjects(uuid[], integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_random_questions_for_exam(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_ebook_code(text, text, text) TO authenticated, service_role;