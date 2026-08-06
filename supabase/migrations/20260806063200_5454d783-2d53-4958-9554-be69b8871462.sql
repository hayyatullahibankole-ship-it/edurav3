CREATE TABLE public.campus_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'siwes',
  organisation TEXT NOT NULL,
  role_title TEXT,
  location TEXT,
  supervisor_name TEXT,
  supervisor_email TEXT,
  supervisor_phone TEXT,
  school_supervisor TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_placements TO authenticated;
GRANT ALL ON public.campus_placements TO service_role;
ALTER TABLE public.campus_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own placements" ON public.campus_placements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.campus_logbook_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  placement_id UUID REFERENCES public.campus_placements(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'siwes',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number INT,
  title TEXT,
  activities TEXT NOT NULL DEFAULT '',
  skills_learned TEXT,
  challenges TEXT,
  supervisor_comment TEXT,
  hours NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_logbook_entries TO authenticated;
GRANT ALL ON public.campus_logbook_entries TO service_role;
ALTER TABLE public.campus_logbook_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own logbook" ON public.campus_logbook_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campus_logbook_user_date ON public.campus_logbook_entries (user_id, entry_date DESC);

CREATE TABLE public.campus_nysc_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'pre_mobilisation',
  is_done BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  notes TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_nysc_tasks TO authenticated;
GRANT ALL ON public.campus_nysc_tasks TO service_role;
ALTER TABLE public.campus_nysc_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own nysc tasks" ON public.campus_nysc_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.campus_cv_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  headline TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_cv_profiles TO authenticated;
GRANT ALL ON public.campus_cv_profiles TO service_role;
ALTER TABLE public.campus_cv_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cv" ON public.campus_cv_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_campus_placements_updated BEFORE UPDATE ON public.campus_placements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_campus_logbook_updated BEFORE UPDATE ON public.campus_logbook_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_campus_cv_updated BEFORE UPDATE ON public.campus_cv_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();