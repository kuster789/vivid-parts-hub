
-- Drop the permissive SELECT policy that allows coupon enumeration
DROP POLICY IF EXISTS "Authenticated users can validate coupons" ON public.coupons;

-- Create a secure RPC to validate coupons without exposing the table
CREATE OR REPLACE FUNCTION public.validate_coupon(_code TEXT, _order_total NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _coupon RECORD;
  _discount NUMERIC;
BEGIN
  -- Sanitize input
  IF _code IS NULL OR length(trim(_code)) = 0 OR length(trim(_code)) > 50 THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom inválido');
  END IF;

  SELECT * INTO _coupon FROM public.coupons
    WHERE code = upper(trim(_code)) AND active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom inválido ou expirado');
  END IF;

  IF _coupon.expires_at IS NOT NULL AND _coupon.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom expirado');
  END IF;

  IF _coupon.max_uses IS NOT NULL AND _coupon.used_count >= _coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom esgotado');
  END IF;

  IF _coupon.min_order_value IS NOT NULL AND _order_total < _coupon.min_order_value THEN
    RETURN json_build_object('valid', false, 'error', 'Pedido mínimo: R$ ' || to_char(_coupon.min_order_value, 'FM999990D00'));
  END IF;

  -- Calculate discount
  IF _coupon.discount_percent > 0 THEN
    _discount := _order_total * (_coupon.discount_percent::NUMERIC / 100);
  ELSIF _coupon.discount_amount > 0 THEN
    _discount := _coupon.discount_amount;
  ELSE
    _discount := 0;
  END IF;

  _discount := LEAST(_discount, _order_total);

  RETURN json_build_object('valid', true, 'discount', _discount, 'code', upper(trim(_code)));
END;
$$;
