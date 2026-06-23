-- Número de factura cuando la rendición es REPORTED_WITH_RECEIPT

ALTER TABLE cost_entries
  ADD COLUMN IF NOT EXISTS invoice_number TEXT;
