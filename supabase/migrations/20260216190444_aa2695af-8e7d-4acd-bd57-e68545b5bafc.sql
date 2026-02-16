
-- Add production_stage column to orders
ALTER TABLE public.orders ADD COLUMN production_stage text DEFAULT NULL;

-- Possible values: producao, acabamento, pintura, embalagem, postagem
COMMENT ON COLUMN public.orders.production_stage IS 'Production stages: producao, acabamento, pintura, embalagem, postagem';
