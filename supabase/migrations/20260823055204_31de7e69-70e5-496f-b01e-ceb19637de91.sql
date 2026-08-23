CREATE TABLE public.study_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  source_path text,
  page_count integer NOT NULL DEFAULT 0,
  section_count integer NOT NULL DEFAULT 0,
  pass_mark integer NOT NULL DEFAULT 70,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_decks TO authenticated;
GRANT ALL ON public.study_decks TO service_role;
ALTER TABLE public.study_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own decks" ON public.study_decks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.deck_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.study_decks(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_sections TO authenticated;
GRANT ALL ON public.deck_sections TO service_role;
ALTER TABLE public.deck_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deck sections" ON public.deck_sections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.study_decks d WHERE d.id = deck_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.study_decks d WHERE d.id = deck_id AND d.user_id = auth.uid()));

CREATE TABLE public.deck_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.deck_sections(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_questions TO authenticated;
GRANT ALL ON public.deck_questions TO service_role;
ALTER TABLE public.deck_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deck questions" ON public.deck_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deck_sections s JOIN public.study_decks d ON d.id = s.deck_id WHERE s.id = section_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deck_sections s JOIN public.study_decks d ON d.id = s.deck_id WHERE s.id = section_id AND d.user_id = auth.uid()));

CREATE TABLE public.deck_section_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  deck_id uuid NOT NULL REFERENCES public.study_decks(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.deck_sections(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_section_attempts TO authenticated;
GRANT ALL ON public.deck_section_attempts TO service_role;
ALTER TABLE public.deck_section_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deck attempts" ON public.deck_section_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_study_decks_user ON public.study_decks(user_id, created_at DESC);
CREATE INDEX idx_deck_sections_deck ON public.deck_sections(deck_id, order_index);
CREATE INDEX idx_deck_questions_section ON public.deck_questions(section_id, order_index);
CREATE INDEX idx_deck_attempts_section ON public.deck_section_attempts(user_id, section_id, created_at DESC);

CREATE TRIGGER update_study_decks_updated_at BEFORE UPDATE ON public.study_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();