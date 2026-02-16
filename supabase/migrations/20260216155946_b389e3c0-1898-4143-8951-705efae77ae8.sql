
CREATE OR REPLACE FUNCTION public.count_products_by_brand_model()
RETURNS TABLE(brand TEXT, model TEXT, product_count BIGINT)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH all_compat AS (
    -- Primary brand/model
    SELECT p.brand, p.model
    FROM products p
    WHERE p.active = true
    UNION ALL
    -- Compatible models from JSONB
    SELECT 
      (cm->>'brand')::TEXT AS brand,
      (cm->>'model')::TEXT AS model
    FROM products p,
         jsonb_array_elements(p.compatible_models) AS cm
    WHERE p.active = true
      AND p.compatible_models IS NOT NULL
      AND jsonb_array_length(p.compatible_models) > 0
  )
  SELECT a.brand, a.model, COUNT(*) AS product_count
  FROM all_compat a
  GROUP BY a.brand, a.model;
$$;
