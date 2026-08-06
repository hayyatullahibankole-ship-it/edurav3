CREATE POLICY "Anyone can upload beta screenshots" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'beta-screenshots');

CREATE POLICY "Admins can read beta screenshots" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'beta-screenshots' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Admins can delete beta screenshots" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'beta-screenshots' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));