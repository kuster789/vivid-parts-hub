-- 1. SECURITY DEFINER Hardening
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_product() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order_confirmed() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_last_admin_master_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_stock_on_order_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_production_stage_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_coupon() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;

-- 2. Realtime & Notifications Hardening
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'::app_role)
);

-- 3. Storage Hardening
DROP POLICY IF EXISTS "Public can view manuals" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to manuals" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;

CREATE POLICY "Public read access to manuals" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'manuals');

CREATE POLICY "Public read access to product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

-- 4. RLS Cleanup
DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;
CREATE POLICY "Reviews are public" 
ON public.reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public manuals are viewable" ON public.manuals;
CREATE POLICY "Public manuals are viewable" 
ON public.manuals FOR SELECT 
USING (true);

-- 5. Page Views Hardening
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" 
ON public.page_views FOR INSERT 
WITH CHECK (true);

-- 6. Audit Logs Hardening
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING ((SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'::app_role);
