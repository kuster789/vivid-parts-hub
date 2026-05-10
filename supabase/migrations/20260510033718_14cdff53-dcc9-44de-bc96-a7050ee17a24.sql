-- 1. Notifications Security Hardening
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- 2. Revoke Public Execution from SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;

-- 3. User Roles: Hardening
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles;
CREATE POLICY "Users can see their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 4. Storage Security: Disable Public Listing
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public can view manuals" ON storage.objects;
CREATE POLICY "Public can view manuals" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'manuals');