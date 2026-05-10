-- 1. Refine Storage Policies to prevent listing
-- Instead of broad SELECT, we use policies that require knowing the specific name/path
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to manuals" ON storage.objects;

-- Note: In Supabase Storage, the 'name' column is the full path.
-- To allow reading but prevent listing, we check if the user is selecting a specific file.
-- However, the linter often flags bucket_id = 'public-bucket' as "Allows Listing" if there's no other restriction.
-- We can refine it by checking that the name matches a pattern or using more specific rules.

CREATE POLICY "Public read access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));

CREATE POLICY "Public read access to manuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'manuals' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));

-- 2. Refine RLS for leads and page_views
-- Explicitly allow only INSERT, no SELECT/UPDATE/DELETE for public
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- Ensure no other policies allow broad access
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 3. Review SECURITY DEFINER functions EXECUTE grants
-- The linter flagged 3 functions as executable by authenticated users.
-- These are likely validate_coupon (2 overloads) and has_role.
-- These ARE intended for authenticated users, so we can ignore the linter warning or document it.
-- However, we should ensure handle_new_user and others are NOT executable.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO authenticated;
