-- Fix: Restrict coupons table - remove public SELECT policy and add authenticated-only policy
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;

CREATE POLICY "Authenticated users can validate coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (active = true);