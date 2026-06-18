-- Ejecutar en Supabase SQL Editor si la tabla ya existe sin columna slug

ALTER TABLE business_units ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE business_units
SET slug = 'vivero-central'
WHERE id = 'seed-business-unit' AND (slug IS NULL OR slug = '');

UPDATE business_units
SET slug = lower(
  trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
)
WHERE slug IS NULL OR slug = '';

UPDATE business_units SET slug = id WHERE slug IS NULL OR slug = '';

ALTER TABLE business_units ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS business_units_slug_key ON business_units(slug);
