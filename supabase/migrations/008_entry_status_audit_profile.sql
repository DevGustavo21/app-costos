-- Estados de costos e ingresos, historial de cambios, perfil e icono de unidad

ALTER TABLE cost_entries
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'ACCOUNTS_PAYABLE'
    CHECK (payment_status IN ('PAID', 'ACCOUNTS_PAYABLE')),
  ADD COLUMN IF NOT EXISTS expense_report_status TEXT NOT NULL DEFAULT 'PENDING_REPORT'
    CHECK (expense_report_status IN ('PENDING_REPORT', 'REPORTED_WITH_RECEIPT', 'REPORTED_WITHOUT_RECEIPT'));

ALTER TABLE income_entries
  ADD COLUMN IF NOT EXISTS collection_status TEXT NOT NULL DEFAULT 'RECEIVED'
    CHECK (collection_status IN ('RECEIVED', 'ACCOUNTS_RECEIVABLE'));

ALTER TABLE business_units
  ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_preset TEXT;

CREATE TABLE IF NOT EXISTS entry_changelog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('COST', 'INCOME')),
  entry_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE')),
  snapshot JSONB NOT NULL,
  previous_snapshot JSONB,
  changed_by_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entry_changelog_entry
  ON entry_changelog(entry_type, entry_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_entry_changelog_bu
  ON entry_changelog(business_unit_id, created_at DESC);
