-- Ejecutar en Supabase SQL Editor después de `npm run db:push`
-- Dashboard → SQL → New query

-- Bucket para facturas/recibos
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública de archivos
CREATE POLICY "receipts_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Usuarios autenticados suben solo a su carpeta ({user_id}/... o {user_id}/avatars/...)
CREATE POLICY "receipts_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuarios autenticados eliminan solo sus archivos
CREATE POLICY "receipts_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
