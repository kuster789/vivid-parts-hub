-- ============================================================
-- SCHEMA COMPLETO DO PAINEL ADMIN (SEM PRODUTOS)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- 2. TABELAS

-- Perfis de usuários
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Roles de usuários
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Pedidos
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  shipping_phone text,
  tracking_code text,
  notes text,
  coupon_code text,
  production_stage text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Itens do pedido
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  variations jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text DEFAULT 'popup',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Page views (analytics)
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  region text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notificações
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vendas externas
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  product_name text NOT NULL,
  piece_value numeric NOT NULL DEFAULT 0,
  platform_cost numeric NOT NULL DEFAULT 0,
  shipping_cost numeric NOT NULL DEFAULT 0,
  manufacturing_cost numeric NOT NULL DEFAULT 0,
  net_value numeric GENERATED ALWAYS AS (piece_value - platform_cost - shipping_cost - manufacturing_cost) STORED,
  profit_percentage numeric GENERATED ALWAYS AS (
    CASE WHEN piece_value > 0 
      THEN ((piece_value - platform_cost - shipping_cost - manufacturing_cost) / piece_value) * 100 
      ELSE 0 
    END
  ) STORED,
  notes text,
  sales_channel text NOT NULL DEFAULT 'marketplace',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  min_order_value numeric DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. FUNÇÕES

-- Função para verificar roles (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger para criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notificar mudança de status do pedido
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- Notificar mudança de etapa de produção
CREATE OR REPLACE FUNCTION public.notify_production_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      'Seu pedido #' || LEFT(NEW.id::text, 8) || ' está ' || stage_label || '.',
      'production_stage',
      jsonb_build_object('order_id', NEW.id, 'stage', NEW.production_stage)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_production_stage_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_production_stage_change();

-- Notificar novo cupom
CREATE OR REPLACE FUNCTION public.notify_new_coupon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_coupon();

-- 5. RLS POLICIES

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Order Items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Admins can delete order items" ON public.order_items FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Leads
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view leads" ON public.leads FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Page Views
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view page views" ON public.page_views FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Admins can delete page views" ON public.page_views FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'employee'));
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Sales
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can view sales" ON public.sales FOR SELECT USING (has_role(auth.uid(), 'employee'));

-- Coupons
CREATE POLICY "Only admins can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6. ENABLE REALTIME (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
