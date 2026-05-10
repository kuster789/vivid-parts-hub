-- 1. Create missing performance indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_anonymous_id ON public.analytics_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_source ON public.analytics_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_events_city ON public.analytics_events(city);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events((metadata->>'product_id')) WHERE (metadata->>'product_id') IS NOT NULL;

-- 2. Create missing performance indexes for Operational Data
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_state ON public.orders(shipping_state);
CREATE INDEX IF NOT EXISTS idx_sales_order_date ON public.sales(order_date);

-- 3. Ensure get_sales_funnel has role check
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

-- 4. Audit & Secure administrative functions (Fixing signatures based on pg_proc)
REVOKE ALL ON FUNCTION public.get_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_sales_funnel(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_funnel(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

REVOKE ALL ON FUNCTION public.get_geo_performance(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_geo_performance(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

REVOKE ALL ON FUNCTION public.get_inventory_priority() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_priority() TO authenticated;

REVOKE ALL ON FUNCTION public.get_monthly_revenue_comparison() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue_comparison() TO authenticated;

REVOKE ALL ON FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO authenticated;

REVOKE ALL ON FUNCTION public.get_search_insights(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_insights(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
