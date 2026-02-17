
-- 1. Add condition column to products (Nova or Usada)
ALTER TABLE public.products
ADD COLUMN condition TEXT NOT NULL DEFAULT 'nova'
CHECK (condition IN ('nova', 'usada'));

-- 2. Create trigger function to decrement stock when order items are inserted
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(stock - NEW.quantity, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

-- 3. Create trigger on order_items
CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_order();
