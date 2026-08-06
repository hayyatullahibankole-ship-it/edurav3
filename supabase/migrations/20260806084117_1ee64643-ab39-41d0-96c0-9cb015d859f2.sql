CREATE TABLE public.beta_testers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  device_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  redeemed_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.beta_testers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_testers TO authenticated;
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage beta testers" ON public.beta_testers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.beta_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tester_id UUID NOT NULL REFERENCES public.beta_testers(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  what_worked TEXT,
  issues TEXT,
  suggestions TEXT,
  device_info TEXT,
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tester_id, day_number)
);

GRANT ALL ON public.beta_reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_reports TO authenticated;
ALTER TABLE public.beta_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage beta reports" ON public.beta_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.beta_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE,
  focus_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.beta_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beta_settings TO authenticated;
ALTER TABLE public.beta_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage beta settings" ON public.beta_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_beta_testers_updated_at BEFORE UPDATE ON public.beta_testers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beta_reports_updated_at BEFORE UPDATE ON public.beta_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_beta_settings_updated_at BEFORE UPDATE ON public.beta_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.beta_settings (day_number, focus_note) VALUES
  (1, 'Install the app, sign up and explore the home dashboard.'),
  (2, 'CBT practice: start an exam, submit it and review your results.'),
  (3, 'Wallet and services: fund wallet, browse services and e-PINs.'),
  (4, 'Study hub, AI tutor, forum and leaderboard.'),
  (5, 'Overall: speed, crashes, design and anything still confusing.');