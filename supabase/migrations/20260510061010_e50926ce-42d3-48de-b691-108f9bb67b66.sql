CREATE OR REPLACE FUNCTION public.get_monthly_revenue_comparison()
RETURNS TABLE (
    name TEXT,
    site NUMERIC,
    externo NUMERIC
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
    WITH site_rev AS (
        SELECT 
            to_char(created_at, 'Mon/YY') as m,
            sum(total) as val
        FROM orders
        WHERE status IN ('paid', 'shipped', 'delivered')
        GROUP BY 1
    ),
    ext_rev AS (
        SELECT 
            to_char(order_date, 'Mon/YY') as m,
            sum(piece_value) as val
        FROM sales
        GROUP BY 1
    ),
    months AS (
        SELECT DISTINCT m FROM site_rev
        UNION
        SELECT DISTINCT m FROM ext_rev
    )
    SELECT 
        m.m,
        COALESCE(sr.val, 0),
        COALESCE(er.val, 0)
    FROM months m
    LEFT JOIN site_rev sr ON sr.m = m.m
    LEFT JOIN ext_rev er ON er.m = m.m
    ORDER BY to_date(m.m, 'Mon/YY') DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_revenue_comparison TO authenticated;
