
-- Drop existing triggers if any, then recreate all
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS on_production_stage_change ON public.orders;
DROP TRIGGER IF EXISTS on_new_product ON public.products;
DROP TRIGGER IF EXISTS on_new_coupon ON public.coupons;

-- Create trigger for order status change notifications
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();

-- Create trigger for production stage change notifications
CREATE TRIGGER on_production_stage_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_production_stage_change();

-- Create trigger for new product notifications
CREATE TRIGGER on_new_product
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_product();

-- Create trigger for new coupon notifications
CREATE TRIGGER on_new_coupon
  AFTER INSERT ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_coupon();
