CREATE POLICY "Users upload own proctoring snapshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proctoring-snapshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own proctoring snapshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'proctoring-snapshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins view all proctoring snapshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'proctoring-snapshots' AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));

CREATE POLICY "Admins delete proctoring snapshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'proctoring-snapshots' AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));