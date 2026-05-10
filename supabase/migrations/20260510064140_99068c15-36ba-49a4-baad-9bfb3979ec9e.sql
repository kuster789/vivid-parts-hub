DROP FUNCTION IF EXISTS public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_product_performance(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    limit_count INTEGER DEFAULT 10,
    p_utm_source TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_brand TEXT DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    brand TEXT,
    views BIGINT,
    cart_additions BIGINT,
    orders BIGINT,
    revenue NUMERIC,
    conversion_rate NUMERIC,
    stock INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'admin_master', 'supervisor')
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    WITH product_views AS (
        SELECT 
            (metadata->>'product_id')::UUID as pid, 
            count(DISTINCT session_id) as v
        FROM analytics_events
        WHERE event_type = 'product_view'
        AND created_at BETWEEN start_date AND end_date
        AND (p_utm_source IS NULL OR utm_source = p_utm_source)
        AND (p_state IS NULL OR state = p_state)
        AND (metadata->>'product_id') IS NOT NULL
        GROUP BY 1
    ),
    product_carts AS (
        SELECT 
            (metadata->>'product_id')::UUID as pid, 
            count(DISTINCT session_id) as c
        FROM analytics_events
        WHERE event_type = 'add_to_cart'
        AND created_at BETWEEN start_date AND end_date
        AND (p_utm_source IS NULL OR utm_source = p_utm_source)
        AND (p_state IS NULL OR state = p_state)
        AND (metadata->>'product_id') IS NOT NULL
        GROUP BY 1
    ),
    product_orders AS (
        SELECT 
            oi.product_id as pid, 
            count(DISTINCT oi.order_id) as o, 
            sum(oi.quantity * oi.unit_price) as r
        FROM order_items oi
        JOIN orders ord ON ord.id = oi.order_id
        WHERE ord.created_at BETWEEN start_date AND end_date
        AND (p_state IS NULL OR ord.shipping_state = p_state)
        AND ord.status IN ('paid', 'shipped', 'delivered')
        GROUP BY 1
    )
    SELECT 
        p.id, p.name, p.brand,
        COALESCE(pv.v, 0)::BIGINT,
        COALESCE(pc.c, 0)::BIGINT,
        COALESCE(po.o, 0)::BIGINT,
        COALESCE(po.r, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(pv.v, 0) > 0 THEN (COALESCE(po.o, 0)::NUMERIC / pv.v::NUMERIC) * 100
            ELSE 0 
        END as conversion_rate,
        p.stock
    FROM products p
    LEFT JOIN product_views pv ON p.id = pv.pid
    LEFT JOIN product_carts pc ON p.id = pc.pid
    LEFT JOIN product_orders po ON p.id = po.pid
    WHERE (p_brand IS NULL OR p.brand = p_brand)
    ORDER BY COALESCE(po.r, 0) DESC, COALESCE(pv.v, 0) DESC
    LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon;