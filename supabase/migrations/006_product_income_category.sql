-- Productos del catálogo vinculados a categoría de ingreso padre (ej. Ganado, Leche)
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plants_category ON plants(category_id);
