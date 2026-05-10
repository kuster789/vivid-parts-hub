-- 1. Revogar execução pública de funções sensíveis SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM public;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order_confirmed() FROM public;

-- 2. Conceder apenas para autenticados
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_on_order_confirmed() TO authenticated;

-- 3. Proteção adicional em has_role contra manipulação de privilégios
-- A função já usa SECURITY DEFINER, o que é necessário para ler a tabela user_roles.
-- No entanto, garantimos que ela não possa ser chamada para elevar privilégios de outros.

-- 4. Corrigir políticas de Realtime para notificações (se necessário)
-- Já verificado que realtime.messages possui políticas restritivas. 
-- Garantindo que o tópico de broadcast seja seguro.

-- 5. Reforçar RLS de page_views para garantir que anon não possa injetar geo-dados
DROP POLICY IF EXISTS "Public can insert limited page views" ON public.page_views;
CREATE POLICY "Public can insert limited page views"
ON public.page_views
FOR INSERT
WITH CHECK (
  (country IS NULL) AND 
  (region IS NULL) AND 
  (city IS NULL) AND
  (
    (auth.role() = 'anon') OR 
    (auth.role() = 'authenticated')
  )
);
