
CREATE OR REPLACE FUNCTION public.increment_stock_on_order_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + OLD.quantity
  WHERE id = OLD.product_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_increment_stock_on_order_item_delete
  BEFORE DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_stock_on_order_delete();
