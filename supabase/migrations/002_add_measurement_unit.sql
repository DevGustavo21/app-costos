-- Ejecutar en Supabase SQL Editor

ALTER TABLE business_units
ADD COLUMN IF NOT EXISTS measurement_unit TEXT NOT NULL DEFAULT 'unidad';

ALTER TABLE business_units DROP CONSTRAINT IF EXISTS business_units_measurement_unit_check;

ALTER TABLE business_units
ADD CONSTRAINT business_units_measurement_unit_check
CHECK (measurement_unit IN ('unidad', 'litro', 'galon', 'kg', 'libra', 'caja', 'bolsa'));

UPDATE business_units SET measurement_unit = 'unidad' WHERE measurement_unit IS NULL;
