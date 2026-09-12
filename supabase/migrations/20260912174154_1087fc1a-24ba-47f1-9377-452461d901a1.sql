-- PRODUCTS
CREATE TABLE public.akboy_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  tagline text,
  short_description text,
  full_description text,
  status text NOT NULL DEFAULT 'in_development',
  problem text,
  solution text,
  audience text,
  how_it_works jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  logo_url text,
  cover_image_url text,
  cta_text text,
  cta_url text,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  seo_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_products TO authenticated;
GRANT ALL ON public.akboy_products TO service_role;
ALTER TABLE public.akboy_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published products" ON public.akboy_products FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage products" ON public.akboy_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.akboy_product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.akboy_products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_product_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_product_features TO authenticated;
GRANT ALL ON public.akboy_product_features TO service_role;
ALTER TABLE public.akboy_product_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view features of published products" ON public.akboy_product_features FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.akboy_products p WHERE p.id = product_id AND p.is_published = true));
CREATE POLICY "Admins manage product features" ON public.akboy_product_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.akboy_product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.akboy_products(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_product_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_product_media TO authenticated;
GRANT ALL ON public.akboy_product_media TO service_role;
ALTER TABLE public.akboy_product_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view media of published products" ON public.akboy_product_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.akboy_products p WHERE p.id = product_id AND p.is_published = true));
CREATE POLICY "Admins manage product media" ON public.akboy_product_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- AMBASSADORS
CREATE TABLE public.akboy_ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  photo_url text,
  school text,
  role_title text DEFAULT 'Student Ambassador',
  cohort text,
  bio text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_ambassadors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_ambassadors TO authenticated;
GRANT ALL ON public.akboy_ambassadors TO service_role;
ALTER TABLE public.akboy_ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published ambassadors" ON public.akboy_ambassadors FOR SELECT USING (is_published = true AND is_active = true);
CREATE POLICY "Admins manage ambassadors" ON public.akboy_ambassadors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- PARTNER SCHOOLS (master record)
CREATE TABLE public.akboy_partner_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  location text,
  website_url text,
  partnership_type text NOT NULL DEFAULT 'programme',
  description text,
  partnership_start_date date,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_partner_schools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_partner_schools TO authenticated;
GRANT ALL ON public.akboy_partner_schools TO service_role;
ALTER TABLE public.akboy_partner_schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view published partner schools" ON public.akboy_partner_schools FOR SELECT USING (is_published = true AND is_active = true);
CREATE POLICY "Admins manage partner schools" ON public.akboy_partner_schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- EVENTS: extra fields
ALTER TABLE public.akboy_events
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS theme text,
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS why_we_do_this text,
  ADD COLUMN IF NOT EXISTS who_its_for text,
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS outcomes text,
  ADD COLUMN IF NOT EXISTS attendance_count integer;

CREATE UNIQUE INDEX IF NOT EXISTS akboy_events_slug_key ON public.akboy_events (slug) WHERE slug IS NOT NULL;

CREATE TABLE public.akboy_event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.akboy_events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  position_title text,
  organization text,
  bio text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_event_speakers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_event_speakers TO authenticated;
GRANT ALL ON public.akboy_event_speakers TO service_role;
ALTER TABLE public.akboy_event_speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view speakers of published events" ON public.akboy_event_speakers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.akboy_events e WHERE e.id = event_id AND e.is_published = true));
CREATE POLICY "Admins manage event speakers" ON public.akboy_event_speakers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.akboy_event_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.akboy_events(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_event_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_event_media TO authenticated;
GRANT ALL ON public.akboy_event_media TO service_role;
ALTER TABLE public.akboy_event_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view media of published events" ON public.akboy_event_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.akboy_events e WHERE e.id = event_id AND e.is_published = true));
CREATE POLICY "Admins manage event media" ON public.akboy_event_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.akboy_event_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.akboy_events(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.akboy_partner_schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, school_id)
);
GRANT SELECT ON public.akboy_event_schools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_event_schools TO authenticated;
GRANT ALL ON public.akboy_event_schools TO service_role;
ALTER TABLE public.akboy_event_schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view schools of published events" ON public.akboy_event_schools FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.akboy_events e WHERE e.id = event_id AND e.is_published = true));
CREATE POLICY "Admins manage event schools" ON public.akboy_event_schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.akboy_event_ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.akboy_events(id) ON DELETE CASCADE,
  ambassador_id uuid NOT NULL REFERENCES public.akboy_ambassadors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, ambassador_id)
);
GRANT SELECT ON public.akboy_event_ambassadors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_event_ambassadors TO authenticated;
GRANT ALL ON public.akboy_event_ambassadors TO service_role;
ALTER TABLE public.akboy_event_ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view ambassadors of published events" ON public.akboy_event_ambassadors FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.akboy_events e WHERE e.id = event_id AND e.is_published = true));
CREATE POLICY "Admins manage event ambassadors" ON public.akboy_event_ambassadors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- HOMEPAGE SETTINGS (single row)
CREATE TABLE public.akboy_homepage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_event_id uuid REFERENCES public.akboy_events(id) ON DELETE SET NULL,
  show_products boolean NOT NULL DEFAULT true,
  show_featured_event boolean NOT NULL DEFAULT true,
  show_community boolean NOT NULL DEFAULT true,
  show_partner_strip boolean NOT NULL DEFAULT true,
  show_impact boolean NOT NULL DEFAULT false,
  impact_stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.akboy_homepage_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_homepage_settings TO authenticated;
GRANT ALL ON public.akboy_homepage_settings TO service_role;
ALTER TABLE public.akboy_homepage_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view homepage settings" ON public.akboy_homepage_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage homepage settings" ON public.akboy_homepage_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.akboy_homepage_settings (show_products) VALUES (true);

-- updated_at triggers
CREATE TRIGGER akboy_products_updated_at BEFORE UPDATE ON public.akboy_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER akboy_product_features_updated_at BEFORE UPDATE ON public.akboy_product_features FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER akboy_ambassadors_updated_at BEFORE UPDATE ON public.akboy_ambassadors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER akboy_partner_schools_updated_at BEFORE UPDATE ON public.akboy_partner_schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER akboy_homepage_settings_updated_at BEFORE UPDATE ON public.akboy_homepage_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();