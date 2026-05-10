-- Revogar execução de usuários normais (AUTHENTICATED) e anônimos (PUBLIC) 
-- para funções que devem ser executadas apenas via Triggers ou pelo Sistema.

REVOKE ALL ON FUNCTION public.decrement_stock_on_order() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.decrement_stock_on_order_confirmed() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.increment_stock_on_order_delete() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_product() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.notify_new_coupon() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.notify_order_status_change() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.notify_production_stage_change() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, authenticated;
REVOKE ALL ON FUNCTION public.prevent_last_admin_master_delete() FROM public, authenticated;

-- Garantir que o service_role ainda pode executar para triggers e lógica de backend
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Manter has_role apenas para AUTHENTICATED pois é usada em políticas de RLS
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- validate_coupon e generate_quote_number permanecem para AUTHENTICATED
-- pois o frontend (usuário logado) precisa chamá-las.
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM public;
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;
