-- Add tracking columns to existing questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS external_source TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS exam_body TEXT,
ADD COLUMN IF NOT EXISTS exam_year INTEGER;

-- Index for fast duplicate detection and filtering
CREATE INDEX IF NOT EXISTS idx_questions_external_source_id
ON public.questions(external_source, external_id)
WHERE external_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_exam_body_year
ON public.questions(exam_body, exam_year);

-- Table to map API provider subjects to Edura subjects
CREATE TABLE public.external_question_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('aloc', 'sdashapi')),
    exam_body TEXT NOT NULL,
    external_subject_code TEXT,
    external_subject_name TEXT NOT NULL,
    edura_subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT ON public.external_question_mappings TO authenticated;
GRANT ALL ON public.external_question_mappings TO service_role;

ALTER TABLE public.external_question_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read external question mappings"
ON public.external_question_mappings
FOR SELECT
TO authenticated
USING (true);

-- Table to track every import/sync run
CREATE TABLE public.external_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('aloc', 'sdashapi')),
    exam_body TEXT NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    year INTEGER,
    requested_count INTEGER DEFAULT 0,
    imported_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT ON public.external_sync_logs TO authenticated;
GRANT ALL ON public.external_sync_logs TO service_role;

ALTER TABLE public.external_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own sync logs or all if admin"
ON public.external_sync_logs
FOR SELECT
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin')
    )
);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_external_question_mappings_updated_at
BEFORE UPDATE ON public.external_question_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_sync_logs_updated_at
BEFORE UPDATE ON public.external_sync_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to check daily import cap
CREATE OR REPLACE FUNCTION public.get_daily_import_count(_provider TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(SUM(requested_count), 0)::INTEGER
    FROM public.external_sync_logs
    WHERE provider = _provider
      AND started_at >= CURRENT_DATE
      AND status IN ('completed', 'running');
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_import_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_import_count(TEXT) TO service_role;