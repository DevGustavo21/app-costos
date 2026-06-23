-- Esquema completo para Supabase (ejecutar en SQL Editor)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums como tipos TEXT con CHECK
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_units (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  measurement_unit TEXT NOT NULL DEFAULT 'unidad' CHECK (
    measurement_unit IN ('unidad', 'litro', 'galon', 'kg', 'libra', 'caja', 'bolsa', 'cabeza_ganado')
  ),
  base_price_per_unit NUMERIC(12, 2),
  base_currency TEXT NOT NULL DEFAULT 'NIO' CHECK (base_currency IN ('USD', 'NIO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER')),
  UNIQUE (user_id, business_unit_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT REFERENCES business_units(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('COST', 'INCOME')),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_plant_category BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_bu_type ON categories(business_unit_id, type);

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  measurement_unit TEXT NOT NULL DEFAULT 'unidad' CHECK (
    measurement_unit IN ('unidad', 'litro', 'galon', 'kg', 'libra', 'caja', 'bolsa', 'cabeza_ganado')
  ),
  base_price NUMERIC(12, 2) NOT NULL,
  stock NUMERIC(12, 3),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plants_bu ON plants(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_plants_category ON plants(category_id);

CREATE TABLE IF NOT EXISTS cost_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'NIO')),
  amount NUMERIC(12, 2) NOT NULL,
  exchange_rate NUMERIC(10, 4),
  amount_usd NUMERIC(12, 2) NOT NULL,
  receipt_url TEXT,
  receipt_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cost_entries_bu_date ON cost_entries(business_unit_id, date);
CREATE INDEX IF NOT EXISTS idx_cost_entries_category ON cost_entries(category_id);

CREATE TABLE IF NOT EXISTS income_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  date DATE NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'NIO')),
  amount NUMERIC(12, 2) NOT NULL,
  sale_quantity NUMERIC(12, 3),
  unit_price NUMERIC(12, 2),
  exchange_rate NUMERIC(10, 4),
  amount_usd NUMERIC(12, 2) NOT NULL,
  created_by_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_income_entries_bu_date ON income_entries(business_unit_id, date);
CREATE INDEX IF NOT EXISTS idx_income_entries_category ON income_entries(category_id);

CREATE TABLE IF NOT EXISTS income_lines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  income_entry_id TEXT NOT NULL REFERENCES income_entries(id) ON DELETE CASCADE,
  plant_id TEXT REFERENCES plants(id),
  description TEXT,
  quantity NUMERIC(12, 3) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_income_lines_entry ON income_lines(income_entry_id);
CREATE INDEX IF NOT EXISTS idx_income_lines_plant ON income_lines(plant_id);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_budgets_bu ON budgets(business_unit_id);

CREATE TABLE IF NOT EXISTS budget_lines (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  type TEXT NOT NULL CHECK (type IN ('COST', 'INCOME')),
  planned_amount_usd NUMERIC(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  business_unit_id TEXT REFERENCES business_units(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE (business_unit_id, key)
);

-- Trigger updated_at en cost_entries e income_entries
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cost_entries_updated_at ON cost_entries;
CREATE TRIGGER cost_entries_updated_at
  BEFORE UPDATE ON cost_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS income_entries_updated_at ON income_entries;
CREATE TRIGGER income_entries_updated_at
  BEFORE UPDATE ON income_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
