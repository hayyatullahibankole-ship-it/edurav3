CREATE POLICY "Users read own deck files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'study-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own deck files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'study-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own deck files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'study-decks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own deck files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'study-decks' AND (storage.foldername(name))[1] = auth.uid()::text);