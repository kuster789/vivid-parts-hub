-- 1. Leads and Page Views Hardening
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (
    (email IS NOT NULL)
);

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
TO public
WITH CHECK (
    (path IS NOT NULL)
);

-- 2. Revoke EXECUTE from system functions for public/authenticated roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_product() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order_confirmed() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_last_admin_master_delete() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_stock_on_order_delete() FROM public, anon, authenticated;