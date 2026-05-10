-- 1. Update get_sales_funnel with filters and refined steps
CREATE OR REPLACE FUNCTION public.get_sales_funnel(
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
        -- We can't easily filter orders by brand unless we join with order_items
    ),
    funnel AS (
        SELECT 
            count(DISTINCT session_id) FILTER (WHERE event_type = 'product_view') as step1_views,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart') as step2_cart,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'checkout_started') as step3_checkout
        FROM filtered_events
    ),
    order_funnel AS (
        SELECT 
            count(*) as step4_purchases
        FROM filtered_orders
        WHERE status IN ('paid', 'shipped', 'delivered', 'pending') -- Include pending as "purchases" for funnel
    )
    SELECT jsonb_build_object(
        'steps', jsonb_build_array(
            jsonb_build_object('name', 'Visualização de Produto', 'count', f.step1_views, 'benchmark', 100),
            jsonb_build_object('name', 'Adição ao Carrinho', 'count', f.step2_cart, 'benchmark_rate', 7.5),
            jsonb_build_object('name', 'Início de Checkout', 'count', f.step3_checkout, 'benchmark_rate', 45.0),
            jsonb_build_object('name', 'Compras Concluídas', 'count', of.step4_purchases, 'benchmark_rate', 50.0)
        )
    ) FROM funnel f, order_funnel of INTO result;

    RETURN result;
END;
$$;

-- 2. Create get_dashboard_opportunities
CREATE OR REPLACE FUNCTION public.get_dashboard_opportunities(
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

    WITH high_view_low_purchase AS (
        SELECT 
            p.id, p.name, 
            count(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'product_view') as views,
            count(DISTINCT oi.order_id) as orders
        FROM products p
        LEFT JOIN analytics_events ae ON ae.metadata->>'product_id' = p.id::text AND ae.created_at BETWEEN start_date AND end_date
        LEFT JOIN order_items oi ON oi.product_id = p.id AND oi.created_at BETWEEN start_date AND end_date
        GROUP BY p.id, p.name
        HAVING count(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'product_view') > 20
        AND count(DISTINCT oi.order_id) = 0
        ORDER BY views DESC
        LIMIT 5
    ),
    empty_searches AS (
        SELECT query, count(*) as search_count
        FROM analytics_events
        WHERE event_type = 'search_no_results'
        AND created_at BETWEEN start_date AND end_date
        GROUP BY query
        HAVING count(*) > 3
        ORDER BY search_count DESC
        LIMIT 5
    ),
    abandonment_by_city AS (
        SELECT 
            city, state,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart') as carts,
            count(DISTINCT session_id) FILTER (WHERE event_type = 'checkout_started') as checkouts
        FROM analytics_events
        WHERE created_at BETWEEN start_date AND end_date
        AND city IS NOT NULL
        GROUP BY city, state
        HAVING count(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart') > 5
        AND (count(DISTINCT session_id) FILTER (WHERE event_type = 'checkout_started')::float / count(DISTINCT session_id) FILTER (WHERE event_type = 'add_to_cart')) < 0.3
        ORDER BY carts DESC
        LIMIT 5
    ),
    low_stock_high_demand AS (
        SELECT 
            p.id, p.name, p.stock,
            count(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'product_view') as views
        FROM products p
        JOIN analytics_events ae ON ae.metadata->>'product_id' = p.id::text AND ae.created_at BETWEEN start_date AND end_date
        WHERE p.stock < 3
        GROUP BY p.id, p.name, p.stock
        HAVING count(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'product_view') > 15
        ORDER BY views DESC
        LIMIT 5
    )
    SELECT jsonb_build_object(
        'high_view_low_purchase', (SELECT jsonb_agg(h) FROM high_view_low_purchase h),
        'empty_searches', (SELECT jsonb_agg(e) FROM empty_searches e),
        'abandonment_by_city', (SELECT jsonb_agg(a) FROM abandonment_by_city a),
        'low_stock_high_demand', (SELECT jsonb_agg(l) FROM low_stock_high_demand l)
    ) INTO result;

    RETURN result;
END;
$$;

-- 3. Update existing functions to support filters if missing
CREATE OR REPLACE FUNCTION public.get_search_insights(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    p_utm_source TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    no_results BOOLEAN
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
    SELECT 
        ae.query,
        count(*)::BIGINT as search_count,
        CASE WHEN event_type = 'search_no_results' THEN true ELSE false END as no_results
    FROM analytics_events ae
    WHERE created_at BETWEEN start_date AND end_date
    AND event_type IN ('search_performed', 'search_no_results')
    AND (p_utm_source IS NULL OR utm_source = p_utm_source)
    AND (p_state IS NULL OR state = p_state)
    GROUP BY ae.query, event_type
    ORDER BY search_count DESC;
END;
$$;

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
    orders BIGINT,
    revenue NUMERIC
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
        COALESCE(po.o, 0)::BIGINT,
        COALESCE(po.r, 0)::NUMERIC
    FROM products p
    LEFT JOIN product_views pv ON p.id = pv.pid
    LEFT JOIN product_orders po ON p.id = po.pid
    WHERE (p_brand IS NULL OR p.brand = p_brand)
    ORDER BY COALESCE(po.r, 0) DESC, COALESCE(pv.v, 0) DESC
    LIMIT limit_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_sales_funnel(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_opportunities(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_insights(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT) TO authenticated;