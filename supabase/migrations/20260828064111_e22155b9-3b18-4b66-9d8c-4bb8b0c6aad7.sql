ALTER TABLE public.campus_materials
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS review_note TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_campus_materials_review ON public.campus_materials(review_status);

CREATE OR REPLACE FUNCTION public.campus_materials_guard_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admins may never publish into the shared library directly.
  IF NEW.is_published IS TRUE THEN
    NEW.is_published := false;
  END IF;

  IF NEW.review_status NOT IN ('none', 'pending') THEN
    NEW.review_status := 'pending';
  END IF;

  IF NEW.review_status = 'pending' THEN
    NEW.submitted_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_campus_materials_guard_publish ON public.campus_materials;
CREATE TRIGGER trg_campus_materials_guard_publish
  BEFORE INSERT OR UPDATE ON public.campus_materials
  FOR EACH ROW EXECUTE FUNCTION public.campus_materials_guard_publish();