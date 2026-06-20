-- Unidad de medida por producto en el catálogo
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS measurement_unit TEXT NOT NULL DEFAULT 'unidad' CHECK (
    measurement_unit IN ('unidad', 'litro', 'galon', 'kg', 'libra', 'caja', 'bolsa')
  );

-- Cantidades decimales (litros, kg, etc.) en líneas de ingreso
ALTER TABLE income_lines
  ALTER COLUMN quantity TYPE NUMERIC(12, 3) USING quantity::numeric;
