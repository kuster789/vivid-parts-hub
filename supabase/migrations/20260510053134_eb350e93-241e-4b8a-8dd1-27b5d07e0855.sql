-- Revoke execute from anon for the geo-resolve function if it was somehow exposed as a DB function, 
-- though Edge Functions are usually handled by Supabase Auth service.
-- To be safe, we rely on the Edge Function service itself or our frontend logic.

-- Ensure page_views table has correct RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Reconfirm policies for page_views
DROP POLICY IF EXISTS "Public can insert limited page views" ON public.page_views;
CREATE POLICY "Public can insert limited page views"
ON public.page_views
FOR INSERT
TO public
WITH CHECK (
  country IS NULL AND 
  region IS NULL AND 
  city IS NULL AND 
  (auth.uid() IS NULL OR auth.role() = 'authenticated' OR auth.role() = 'anon')
);

DROP POLICY IF EXISTS "Admins can view page views" ON public.page_views;
CREATE POLICY "Admins can view page views"
ON public.page_views
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

DROP POLICY IF EXISTS "Admins can delete page views" ON public.page_views;
CREATE POLICY "Admins can delete page views"
ON public.page_views
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
