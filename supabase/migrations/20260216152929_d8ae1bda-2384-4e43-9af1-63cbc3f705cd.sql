
CREATE OR REPLACE FUNCTION public.filter_products_by_compatibility(
  _brand TEXT DEFAULT NULL,
  _model TEXT DEFAULT NULL
)
RETURNS SETOF products
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT * FROM products
  WHERE active = true
    AND (
      _brand IS NULL
      OR brand = _brand
      OR compatible_models @> to_jsonb(ARRAY[jsonb_build_object('brand', _brand)])
    )
    AND (
      _model IS NULL
      OR model = _model
      OR compatible_models @> to_jsonb(ARRAY[jsonb_build_object('brand', _brand, 'model', _model)])
    );
$$;
