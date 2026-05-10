-- 1. Privilege Escalation Protection
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Only admin_master can manage admin roles" 
ON public.user_roles 
FOR ALL
USING (has_role(auth.uid(), 'admin_master'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin_master'::app_role));

CREATE POLICY "Users can see their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Secure SECURITY DEFINER functions
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN 
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace 
        WHERE p.prosecdef = true AND n.nspname = 'public'
    LOOP 
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM public, anon, authenticated', 
                       func_record.nspname, func_record.proname, func_record.args);
    END LOOP; 
END $$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_on_order() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_new_product() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock_on_order_confirmed() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_stock_on_order_delete() TO service_role;

-- 3. Storage Security
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view manuals" ON storage.objects;

CREATE POLICY "Public read access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Public read access to manuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'manuals');

-- 4. RLS Policy Hardening
-- reviews table
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are public" 
ON public.reviews 
FOR SELECT 
USING (true); -- No status column found, keeping it simple but restrictive on write

-- manuals table
DROP POLICY IF EXISTS "Anyone can view manuals" ON public.manuals;
CREATE POLICY "Public manuals are viewable" 
ON public.manuals 
FOR SELECT 
USING (true);

-- leads table
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- page_views table
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- role_permissions table
DROP POLICY IF EXISTS "Authenticated can view role_permissions" ON public.role_permissions;
CREATE POLICY "Admins can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND has_role(auth.uid(), 'admin'::app_role)));

-- 6. Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin_master can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admin_master can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin_master'::app_role));
