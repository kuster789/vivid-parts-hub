-- Revoke execute from public/anon for the new functions
REVOKE EXECUTE ON FUNCTION public.get_dashboard_metrics FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_sales_funnel FROM PUBLIC, anon, authenticated;

-- Grant to admin roles (via authenticated with internal check, or specific roles if possible)
-- In Supabase, usually we grant to authenticated and then check role inside
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_funnel TO authenticated;

-- 3. Product Performance
CREATE OR REPLACE FUNCTION public.get_product_performance(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    brand TEXT,
    views BIGINT,
    cart_additions BIGINT,
    orders BIGINT,
    conversion_rate NUMERIC,
    revenue NUMERIC,
    stock INT
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
    WITH prod_stats AS (
        SELECT 
            (metadata->>'product_id')::UUID as p_id,
            count(*) FILTER (WHERE event_type = 'product_view') as v_count,
            count(*) FILTER (WHERE event_type = 'add_to_cart') as c_count
        FROM analytics_events
        WHERE created_at BETWEEN start_date AND end_date
        AND event_type IN ('product_view', 'add_to_cart')
        GROUP BY 1
    ),
    order_stats AS (
        SELECT 
            oi.product_id as p_id,
            count(DISTINCT oi.order_id) as o_count,
            sum(oi.price * oi.quantity) as o_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at BETWEEN start_date AND end_date
        AND o.status IN ('paid', 'shipped', 'delivered')
        GROUP BY 1
    )
    SELECT 
        p.id,
        p.name,
        p.brand,
        COALESCE(ps.v_count, 0),
        COALESCE(ps.c_count, 0),
        COALESCE(os.o_count, 0),
        CASE WHEN COALESCE(ps.v_count, 0) > 0 THEN (COALESCE(os.o_count, 0)::NUMERIC / ps.v_count::NUMERIC) * 100 ELSE 0 END,
        COALESCE(os.o_revenue, 0),
        p.stock
    FROM products p
    LEFT JOIN prod_stats ps ON ps.p_id = p.id
    LEFT JOIN order_stats os ON os.p_id = p.id
    WHERE (ps.v_count > 0 OR os.o_count > 0)
    ORDER BY ps.v_count DESC
    LIMIT limit_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_performance TO authenticated;

-- 4. Search Insights
CREATE OR REPLACE FUNCTION public.get_search_insights(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS TABLE (
    query TEXT,
    search_count BIGINT,
    no_results BOOLEAN,
    conversions BIGINT
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
        metadata->>'query' as q,
        count(*) as c,
        (event_type = 'search_no_results') as nr,
        (
            SELECT count(DISTINCT session_id) 
            FROM analytics_events ae2 
            WHERE ae2.session_id = ae1.session_id 
            AND ae2.event_type = 'order_created'
            AND ae2.created_at > ae1.created_at
        ) as conv
    FROM analytics_events ae1
    WHERE event_type IN ('search_performed', 'search_no_results')
    AND created_at BETWEEN start_date AND end_date
    GROUP BY 1, ae1.event_type, ae1.session_id, ae1.created_at
    ORDER BY c DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_search_insights TO authenticated;

-- 5. Geo Performance (Normalized)
CREATE OR REPLACE FUNCTION public.get_geo_performance(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS TABLE (
    country TEXT,
    state TEXT,
    city TEXT,
    visits BIGINT,
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
    WITH geo_visits AS (
        SELECT country as c, state as s, city as ci, count(DISTINCT session_id) as v
        FROM analytics_events
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY 1, 2, 3
    ),
    geo_orders AS (
        SELECT shipping_country as c, shipping_state as s, shipping_city as ci, count(*) as o, sum(total) as r
        FROM orders
        WHERE created_at BETWEEN start_date AND end_date
        AND status IN ('paid', 'shipped', 'delivered')
        GROUP BY 1, 2, 3
    )
    SELECT 
        COALESCE(gv.c, go.c),
        COALESCE(gv.s, go.s),
        COALESCE(gv.ci, go.ci),
        COALESCE(gv.v, 0),
        COALESCE(go.o, 0),
        COALESCE(go.r, 0)
    FROM geo_visits gv
    FULL OUTER JOIN geo_orders go ON gv.c = go.c AND gv.s = go.s AND gv.ci = go.ci
    ORDER BY gv.v DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_geo_performance TO authenticated;

-- 6. Inventory Priority Score
CREATE OR REPLACE FUNCTION public.get_inventory_priority()
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    stock INT,
    score NUMERIC,
    views_30d BIGINT,
    orders_30d BIGINT,
    recommendation TEXT
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
    WITH stats AS (
        SELECT 
            (metadata->>'product_id')::UUID as p_id,
            count(*) FILTER (WHERE event_type = 'product_view') as v_count,
            count(*) FILTER (WHERE event_type = 'add_to_cart') as c_count
        FROM analytics_events
        WHERE created_at > now() - interval '30 days'
        GROUP BY 1
    ),
    o_stats AS (
        SELECT product_id as p_id, count(*) as o_count
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at > now() - interval '30 days'
        GROUP BY 1
    )
    SELECT 
        p.id,
        p.name,
        p.stock,
        (COALESCE(s.v_count, 0) * 0.1 + COALESCE(s.c_count, 0) * 0.5 + COALESCE(os.o_count, 0) * 2.0) as score,
        COALESCE(s.v_count, 0),
        COALESCE(os.o_count, 0),
        CASE 
            WHEN p.stock = 0 AND COALESCE(s.v_count, 0) > 10 THEN 'Reposição Urgente (Alta Demanda)'
            WHEN p.stock < 5 AND COALESCE(s.v_count, 0) > 20 THEN 'Estoque Baixo'
            WHEN p.image_url IS NULL OR p.image_url = '' THEN 'Adicionar Fotos'
            WHEN p.description IS NULL OR length(p.description) < 50 THEN 'Melhorar Descrição'
            ELSE 'OK'
        END
    FROM products p
    LEFT JOIN stats s ON s.p_id = p.id
    LEFT JOIN o_stats os ON os.p_id = p.id
    WHERE p.active = true
    ORDER BY 4 DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_inventory_priority TO authenticated;
