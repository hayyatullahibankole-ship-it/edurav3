CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = notifications.user_id
      AND users.auth_user_id = auth.uid()
  ));