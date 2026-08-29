CREATE TABLE IF NOT EXISTS public.institution_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  aliases text[] NOT NULL DEFAULT '{}',
  domain text,
  logo_url text,
  institution_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution_logos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_logos TO authenticated;
GRANT ALL ON public.institution_logos TO service_role;

ALTER TABLE public.institution_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active institution logos" ON public.institution_logos;
CREATE POLICY "Anyone can view active institution logos"
ON public.institution_logos FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage institution logos" ON public.institution_logos;
CREATE POLICY "Admins manage institution logos"
ON public.institution_logos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_institution_logos_active ON public.institution_logos (is_active);

DROP TRIGGER IF EXISTS update_institution_logos_updated_at ON public.institution_logos;
CREATE TRIGGER update_institution_logos_updated_at
BEFORE UPDATE ON public.institution_logos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();