-- Varias facturas por costo (array de URLs)

ALTER TABLE cost_entries
  ADD COLUMN IF NOT EXISTS receipt_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE cost_entries
SET receipt_urls = jsonb_build_array(receipt_url)
WHERE receipt_url IS NOT NULL
  AND receipt_url <> ''
  AND receipt_urls = '[]'::jsonb;
