ALTER TABLE public.akboy_events ADD COLUMN IF NOT EXISTS form_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.akboy_event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.akboy_events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_akboy_event_registrations_event ON public.akboy_event_registrations(event_id, created_at DESC);

GRANT INSERT ON public.akboy_event_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akboy_event_registrations TO authenticated;
GRANT ALL ON public.akboy_event_registrations TO service_role;

ALTER TABLE public.akboy_event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register for an active event"
ON public.akboy_event_registrations FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.akboy_events e WHERE e.id = event_id AND e.is_active = true)
);

CREATE POLICY "Admins can view event registrations"
ON public.akboy_event_registrations FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update event registrations"
ON public.akboy_event_registrations FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete event registrations"
ON public.akboy_event_registrations FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_akboy_event_registrations_updated_at
BEFORE UPDATE ON public.akboy_event_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();