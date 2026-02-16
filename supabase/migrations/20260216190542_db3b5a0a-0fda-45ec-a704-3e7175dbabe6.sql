
-- Create trigger function for production stage notifications
CREATE OR REPLACE FUNCTION public.notify_production_stage_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stage_label TEXT;
BEGIN
  IF OLD.production_stage IS DISTINCT FROM NEW.production_stage AND NEW.production_stage IS NOT NULL THEN
    CASE NEW.production_stage
      WHEN 'producao' THEN stage_label := 'em produção';
      WHEN 'acabamento' THEN stage_label := 'em acabamento';
      WHEN 'pintura' THEN stage_label := 'em pintura';
      WHEN 'embalagem' THEN stage_label := 'sendo embalado';
      WHEN 'postagem' THEN stage_label := 'postado para envio';
      ELSE stage_label := NEW.production_stage;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Atualização do pedido',
      'Seu pedido #' || LEFT(NEW.id::text, 8) || ' está ' || stage_label || '.' || 
      CASE WHEN NEW.production_stage = 'postagem' AND NEW.tracking_code IS NOT NULL 
        THEN ' Código de rastreio: ' || NEW.tracking_code 
        ELSE '' 
      END,
      'production_stage',
      jsonb_build_object('order_id', NEW.id, 'stage', NEW.production_stage, 'tracking_code', NEW.tracking_code)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER on_production_stage_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_production_stage_change();
