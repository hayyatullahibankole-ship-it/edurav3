DROP POLICY IF EXISTS "Anyone can view tutorial files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view tutorial uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view tutorial-uploads" ON storage.objects;

CREATE POLICY "Admins can view tutorial uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'tutorial-uploads' AND public.is_admin(auth.uid()));