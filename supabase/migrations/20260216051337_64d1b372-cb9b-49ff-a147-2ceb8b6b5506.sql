
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- NULL means broadcast to all
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'order_status', 'promotion', 'new_product', 'info'
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications + broadcasts
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can mark own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can insert notifications (for broadcasts)
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee')
  );

-- System inserts via triggers use SECURITY DEFINER functions
-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: on order status change, create notification for the user
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  status_label TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN status_label := 'confirmado';
      WHEN 'shipped' THEN status_label := 'enviado';
      WHEN 'delivered' THEN status_label := 'entregue';
      WHEN 'cancelled' THEN status_label := 'cancelado';
      ELSE status_label := NEW.status;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Pedido atualizado',
      'Seu pedido #' || LEFT(NEW.id::text, 8) || ' foi ' || status_label || '.',
      'order_status',
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'tracking_code', NEW.tracking_code)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();

-- Trigger: on new product, create broadcast notification
CREATE OR REPLACE FUNCTION public.notify_new_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.active = true THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NULL,
      'Novo produto disponível!',
      NEW.name || ' da ' || NEW.brand || ' já está no catálogo.',
      'new_product',
      jsonb_build_object('product_id', NEW.id, 'product_name', NEW.name, 'brand', NEW.brand)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_product
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_product();

-- Trigger: on new coupon, broadcast notification
CREATE OR REPLACE FUNCTION public.notify_new_coupon()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.active = true THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NULL,
      'Nova promoção! 🎉',
      'Use o cupom ' || NEW.code || CASE 
        WHEN NEW.discount_percent > 0 THEN ' para ' || NEW.discount_percent || '% de desconto!'
        ELSE ' para R$ ' || NEW.discount_amount || ' de desconto!'
      END,
      'promotion',
      jsonb_build_object('coupon_code', NEW.code, 'discount_percent', NEW.discount_percent, 'discount_amount', NEW.discount_amount)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_coupon
  AFTER INSERT ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_coupon();
