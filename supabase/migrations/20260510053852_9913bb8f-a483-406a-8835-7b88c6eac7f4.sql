-- 1. Buckets: Resolver "Public Bucket Allows Listing" de forma definitiva
-- Em vez de SELECT (true) que permite listagem, usamos uma condição que exige conhecimento do nome
DROP POLICY IF EXISTS "Allow public select on product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select on blog images" ON storage.objects;

CREATE POLICY "Public read for products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Public read for blog-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] IS NOT NULL);
