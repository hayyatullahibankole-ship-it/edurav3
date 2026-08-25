CREATE TABLE public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  device_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_devices_platform_valid CHECK (platform IN ('android', 'ios', 'web')),
  CONSTRAINT push_devices_user_device_unique UNIQUE (user_id, device_id),
  CONSTRAINT push_devices_token_unique UNIQUE (token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_devices TO authenticated;
GRANT ALL ON public.push_devices TO service_role;

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push devices"
ON public.push_devices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = push_devices.user_id
      AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can register own push devices"
ON public.push_devices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = push_devices.user_id
      AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own push devices"
ON public.push_devices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = push_devices.user_id
      AND u.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = push_devices.user_id
      AND u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove own push devices"
ON public.push_devices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = push_devices.user_id
      AND u.auth_user_id = auth.uid()
  )
);

CREATE INDEX push_devices_user_enabled_idx
ON public.push_devices (user_id, enabled)
WHERE enabled = true;

CREATE OR REPLACE FUNCTION public.set_push_devices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_push_devices_updated_at
BEFORE UPDATE ON public.push_devices
FOR EACH ROW EXECUTE FUNCTION public.set_push_devices_updated_at();