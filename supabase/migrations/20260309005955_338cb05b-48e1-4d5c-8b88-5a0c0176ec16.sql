-- Update validate_coupon to check if coupon starting with BEMVINDO already used by this user
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_total numeric, _user_id uuid DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- First-purchase validation: cupons BEMVINDO só podem ser usados em primeira compra
  IF upper(trim(_code)) LIKE 'BEMVINDO%' AND _user_id IS NOT NULL THEN
    -- Check if user already used any BEMVINDO coupon
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE user_id = _user_id
        AND status NOT IN ('cancelled')
        AND coupon_code LIKE 'BEMVINDO%'
    ) THEN
      RETURN json_build_object('valid', false, 'error', 'Este cupom é válido apenas para a primeira compra');
    END IF;
    -- Check if user already has any confirmed order (first purchase restriction)
    IF EXISTS (
      SELECT 1 FROM public.orders
      WHERE user_id = _user_id
        AND status IN ('confirmed', 'shipped', 'delivered')
    ) THEN
      RETURN json_build_object('valid', false, 'error', 'Este cupom é válido apenas para a primeira compra');
    END IF;
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
$function$;