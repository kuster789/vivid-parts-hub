-- Conversion fix: products with no images cannot be published.
-- Storefront audit found multiple imageless cards in the public catalog,
-- which kills click-through. This unpublishes those rows now and adds a
-- DB-level guard so it cannot happen again from any client.

-- 1) Unpublish current imageless products (kept in DB, just hidden).
UPDATE public.products
SET active = false
WHERE active = true
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- 2) Constraint: an active product MUST have at least one image.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_active_requires_image'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_active_requires_image
      CHECK (
        active = false
        OR (images IS NOT NULL AND array_length(images, 1) >= 1)
      );
  END IF;
END $$;

-- 3) Index to speed up storefront queries (active + has images).
CREATE INDEX IF NOT EXISTS products_active_with_images_idx
  ON public.products (created_at DESC)
  WHERE active = true AND images IS NOT NULL;
