ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);