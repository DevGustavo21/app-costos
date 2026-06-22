-- Control de stock: no negativo y ajuste atómico en ventas
ALTER TABLE plants
  DROP CONSTRAINT IF EXISTS plants_stock_non_negative;

ALTER TABLE plants
  ADD CONSTRAINT plants_stock_non_negative CHECK (stock IS NULL OR stock >= 0);

CREATE OR REPLACE FUNCTION adjust_plant_stock(p_plant_id TEXT, p_delta NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock NUMERIC;
  v_new_stock NUMERIC;
BEGIN
  SELECT stock INTO v_stock
  FROM plants
  WHERE id = p_plant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF v_stock IS NULL THEN
    RETURN NULL;
  END IF;

  v_new_stock := v_stock + p_delta;

  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK';
  END IF;

  UPDATE plants SET stock = v_new_stock WHERE id = p_plant_id;

  RETURN v_new_stock;
END;
$$;
