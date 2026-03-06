-- Add shipping dimensions columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_weight numeric DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_width integer DEFAULT 15;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_height integer DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_length integer DEFAULT 20;

COMMENT ON COLUMN public.products.shipping_weight IS 'Peso em kg para cálculo de frete';
COMMENT ON COLUMN public.products.shipping_width IS 'Largura da caixa em cm';
COMMENT ON COLUMN public.products.shipping_height IS 'Altura da caixa em cm';
COMMENT ON COLUMN public.products.shipping_length IS 'Comprimento da caixa em cm';