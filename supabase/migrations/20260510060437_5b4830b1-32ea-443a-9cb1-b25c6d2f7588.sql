-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    path TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    device_type TEXT,
    browser TEXT,
    country TEXT,
    state TEXT,
    city TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Indexing for performance
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_country_state ON public.analytics_events(country, state);

-- RLS Policies
CREATE POLICY "Public can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_master', 'supervisor')
  )
);

-- Geographic Normalization Function
CREATE OR REPLACE FUNCTION public.normalize_geo_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize Country
    IF NEW.country IS NOT NULL THEN
        NEW.country := CASE 
            WHEN NEW.country IN ('Brazil', 'BRA', 'República Federativa do Brasil', 'BR') THEN 'Brasil'
            WHEN NEW.country IN ('United States', 'USA', 'EUA', 'US') THEN 'Estados Unidos'
            WHEN NEW.country IN ('Netherlands', 'Holanda', 'NL') THEN 'Holanda'
            WHEN NEW.country IN ('France', 'FR') THEN 'França'
            WHEN NEW.country IN ('Argentina', 'AR') THEN 'Argentina'
            ELSE NEW.country
        END;
    END IF;

    -- Clean names (trimming and basic formatting)
    NEW.state := trim(regexp_replace(NEW.state, '\s*\(.*?\)', '', 'g'));
    NEW.city := trim(regexp_replace(NEW.city, '\s*\(.*?\)', '', 'g'));
    NEW.city := trim(regexp_replace(NEW.city, '\s*capital$', '', 'gi'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_normalize_geo_analytics
BEFORE INSERT ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION public.normalize_geo_data();

-- Also apply to existing page_views if needed, or just let new system handle it
CREATE TRIGGER tr_normalize_geo_page_views
BEFORE INSERT ON public.page_views
FOR EACH ROW
EXECUTE FUNCTION public.normalize_geo_data();

-- Dashboard RPCs (Security Definer for admin access to aggregations)

-- 1. Main Dashboard KPIs
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    p_utm_source TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_brand TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only admins can call this
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'admin_master', 'supervisor')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH filtered_events AS (
        SELECT * FROM analytics_events
        WHERE created_at BETWEEN start_date AND end_date
        AND (p_utm_source IS NULL OR utm_source = p_utm_source)
        AND (p_state IS NULL OR state = p_state)
    ),
    filtered_orders AS (
        SELECT * FROM orders
        WHERE created_at BETWEEN start_date AND end_date
        AND (p_state IS NULL OR shipping_state = p_state)
    )
    SELECT jsonb_build_object(
        'unique_visitors', (SELECT count(DISTINCT session_id) FROM filtered_events),
        'page_views', (SELECT count(*) FROM filtered_events WHERE event_type = 'page_view'),
        'product_views', (SELECT count(*) FROM filtered_events WHERE event_type = 'product_view'),
        'whatsapp_clicks', (SELECT count(*) FROM filtered_events WHERE event_type = 'whatsapp_click'),
        'cart_additions', (SELECT count(*) FROM filtered_events WHERE event_type = 'add_to_cart'),
        'checkouts_started', (SELECT count(*) FROM filtered_events WHERE event_type = 'checkout_started'),
        'orders_created', (SELECT count(*) FROM filtered_orders),
        'orders_paid', (SELECT count(*) FROM filtered_orders WHERE status IN ('paid', 'shipped', 'delivered')),
        'revenue_total', (SELECT COALESCE(sum(total), 0) FROM filtered_orders),
        'revenue_approved', (SELECT COALESCE(sum(total), 0) FROM filtered_orders WHERE status IN ('paid', 'shipped', 'delivered')),
        'abandoned_carts', (
            SELECT count(DISTINCT session_id) 
            FROM analytics_events 
            WHERE event_type = 'add_to_cart' 
            AND session_id NOT IN (SELECT session_id FROM analytics_events WHERE event_type = 'checkout_started')
            AND created_at BETWEEN start_date AND end_date
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 2. Sales Funnel
CREATE OR REPLACE FUNCTION public.get_sales_funnel(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'admin_master', 'supervisor')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    WITH funnel AS (
        SELECT 
            count(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as step1_visits,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'product_view') as step2_prod_views,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart') as step3_cart,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'checkout_started') as step4_checkout
        FROM analytics_events
        WHERE created_at BETWEEN start_date AND end_date
    ),
    order_funnel AS (
        SELECT 
            count(*) as step5_orders,
            count(*) FILTER (WHERE status IN ('paid', 'shipped', 'delivered')) as step6_paid
        FROM orders
        WHERE created_at BETWEEN start_date AND end_date
    )
    SELECT jsonb_build_object(
        'steps', jsonb_build_array(
            jsonb_build_object('name', 'Visitas', 'count', f.step1_visits),
            jsonb_build_object('name', 'Visualização de Produto', 'count', f.step2_prod_views),
            jsonb_build_object('name', 'Adição ao Carrinho', 'count', f.step3_cart),
            jsonb_build_object('name', 'Início de Checkout', 'count', f.step4_checkout),
            jsonb_build_object('name', 'Pedido Criado', 'count', of.step5_orders),
            jsonb_build_object('name', 'Pedido Pago', 'count', of.step6_paid)
        )
    ) FROM funnel f, order_funnel of INTO result;

    RETURN result;
END;
$$;
