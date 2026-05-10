-- 1. Fix Storage Bucket Listing Warnings
-- product-images bucket
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;

CREATE POLICY "Public read access to product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] IS NOT NULL);

-- manuals bucket
DROP POLICY IF EXISTS "Public can read manuals" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to manuals" ON storage.objects;

CREATE POLICY "Public read access to manuals"
ON storage.objects FOR SELECT
USING (bucket_id = 'manuals' AND (storage.foldername(name))[1] IS NOT NULL);

-- 2. Fix SECURITY DEFINER warnings
-- Revoke execute from public for all functions in public schema that are SECURITY DEFINER
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosecdef = true
        AND n.nspname = 'public'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC', func_record.function_name, func_record.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role', func_record.function_name, func_record.args);
    END LOOP;
END $$;
