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
        AND (p_brand IS NULL OR (metadata->>'brand') = p_brand)
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
        'quotes_requested', (SELECT count(*) FROM filtered_events WHERE event_type = 'quote_requested'),
        'leads_count', (SELECT count(*) FROM filtered_events WHERE event_type = 'lead_created'),
        'out_of_stock_views', (SELECT count(*) FROM filtered_events WHERE event_type = 'product_view' AND (metadata->>'stock_status') = 'out_of_stock'),
        'abandoned_carts', (
            SELECT count(DISTINCT session_id) 
            FROM filtered_events 
            WHERE event_type = 'add_to_cart' 
            AND session_id NOT IN (SELECT session_id FROM filtered_events WHERE event_type = 'checkout_started')
        )
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.get_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) FROM PUBLIC, anon;