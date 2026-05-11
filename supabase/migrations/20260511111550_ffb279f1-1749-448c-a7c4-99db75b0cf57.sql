-- 1. Add SELECT policy for coupons so validate_coupon can be INVOKER
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons 
FOR SELECT USING (active = true);

-- 2. Change has_role to SECURITY INVOKER
-- Users have RLS access to their own roles, so this remains functional for its intended use cases.
ALTER FUNCTION public.has_role(uuid, app_role) SECURITY INVOKER;

-- 3. Change validate_coupon to SECURITY INVOKER
-- The user has RLS access to their own orders, and now has SELECT access to active coupons.
ALTER FUNCTION public.validate_coupon(text, numeric) SECURITY INVOKER;
ALTER FUNCTION public.validate_coupon(text, numeric, uuid) SECURITY INVOKER;

-- 4. Move analytical functions to SECURITY INVOKER wrappers if we wanted to silence all warnings,
-- but for now we'll keep them as DEFINER as they require elevated access to aggregate data
-- across multiple users' records (analytics_events, orders total, etc.).
-- We already ensured they have internal RBAC checks.
