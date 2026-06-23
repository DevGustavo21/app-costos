-- Ajuste de políticas de storage: el path debe empezar con el UUID del usuario.
-- Formato válido: {user_id}/archivo.pdf  o  {user_id}/avatars/foto.jpg

DROP POLICY IF EXISTS "receipts_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "receipts_auth_delete" ON storage.objects;

CREATE POLICY "receipts_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "receipts_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
