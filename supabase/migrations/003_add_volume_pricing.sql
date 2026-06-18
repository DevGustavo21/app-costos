-- Precio base por litro/galón en unidades de negocio y cantidad en ingresos por volumen

ALTER TABLE business_units
ADD COLUMN IF NOT EXISTS base_price_per_unit NUMERIC(12, 2);

ALTER TABLE income_entries
ADD COLUMN IF NOT EXISTS sale_quantity NUMERIC(12, 3);

ALTER TABLE income_entries
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2);
