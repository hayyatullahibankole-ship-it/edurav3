CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period text DEFAULT 'all'::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(rank bigint, user_id uuid, display_name text, avg_score numeric, tests integer, is_me boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
  ),
  agg AS (
    SELECT a.user_id AS uid,
           round(avg(r.percentage)::numeric, 1) AS avg_score,
           count(*)::int AS tests
    FROM public.results r
    JOIN public.attempts a ON a.id = r.attempt_id
    JOIN public.users u ON u.id = a.user_id
    WHERE r.created_at >= public.leaderboard_period_start(p_period)
      AND r.percentage IS NOT NULL
      AND coalesce(u.is_suspended, false) = false
    GROUP BY a.user_id
    HAVING count(*) >= 1
  )
  SELECT ROW_NUMBER() OVER (ORDER BY g.avg_score DESC, g.tests DESC, u.id)::bigint AS rank,
         g.uid AS user_id,
         trim(coalesce(u.first_name, 'Student') || ' ' || coalesce(left(u.last_name, 1) || '.', '')) AS display_name,
         g.avg_score,
         g.tests,
         (g.uid = (SELECT id FROM me)) AS is_me
  FROM agg g
  JOIN public.users u ON u.id = g.uid
  ORDER BY rank
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200))
$function$;

CREATE OR REPLACE FUNCTION public.get_my_leaderboard_rank(p_period text DEFAULT 'all'::text)
 RETURNS TABLE(rank bigint, total bigint, avg_score numeric, tests integer, qualified boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
  ),
  agg AS (
    SELECT a.user_id AS uid,
           round(avg(r.percentage)::numeric, 1) AS avg_score,
           count(*)::int AS tests
    FROM public.results r
    JOIN public.attempts a ON a.id = r.attempt_id
    JOIN public.users u ON u.id = a.user_id
    WHERE r.created_at >= public.leaderboard_period_start(p_period)
      AND r.percentage IS NOT NULL
      AND coalesce(u.is_suspended, false) = false
    GROUP BY a.user_id
  ),
  ranked AS (
    SELECT g.*, ROW_NUMBER() OVER (ORDER BY g.avg_score DESC, g.tests DESC, g.uid) AS rnk
    FROM agg g WHERE g.tests >= 1
  )
  SELECT coalesce((SELECT rnk FROM ranked WHERE uid = (SELECT id FROM me)), 0)::bigint,
         (SELECT count(*) FROM ranked)::bigint,
         coalesce((SELECT avg_score FROM agg WHERE uid = (SELECT id FROM me)), 0)::numeric,
         coalesce((SELECT tests FROM agg WHERE uid = (SELECT id FROM me)), 0)::int,
         coalesce((SELECT true FROM ranked WHERE uid = (SELECT id FROM me)), false)
$function$;