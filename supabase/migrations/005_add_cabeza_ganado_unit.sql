-- Cabeza de ganado como unidad de medida
ALTER TABLE business_units DROP CONSTRAINT IF EXISTS business_units_measurement_unit_check;
ALTER TABLE business_units
  ADD CONSTRAINT business_units_measurement_unit_check
  CHECK (measurement_unit IN (
    'unidad', 'litro', 'galon', 'kg', 'libra', 'caja', 'bolsa', 'cabeza_ganado'
  ));

ALTER TABLE plants DROP CONSTRAINT IF EXISTS plants_measurement_unit_check;
ALTER TABLE plants
  ADD CONSTRAINT plants_measurement_unit_check
  CHECK (measurement_unit IN (
    'unidad', 'litro', 'galon', 'kg', 'libra', 'caja', 'bolsa', 'cabeza_ganado'
  ));
