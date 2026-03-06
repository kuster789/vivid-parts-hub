
-- 1. Remove the trigger that decrements stock on order_items INSERT
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;

-- 2. Create new function to decrement stock when order is confirmed
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when status changes TO 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    UPDATE public.products p
    SET stock = GREATEST(p.stock - oi.quantity, 0)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  
  -- Restore stock when status changes FROM 'confirmed' to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.products p
    SET stock = p.stock + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create trigger on orders table for status changes
CREATE TRIGGER trg_stock_on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order_confirmed();
