DROP POLICY IF EXISTS "Admins upload question media" ON storage.objects;
CREATE POLICY "Admins upload question media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'question-media'
  AND (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.school_staff ss
      JOIN public.users u ON u.id = ss.user_id
      WHERE u.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.admin_user_id = auth.uid()
    )
  )
);