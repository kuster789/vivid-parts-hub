-- 1. Drop obsolete overloads
DROP FUNCTION IF EXISTS public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER);
DROP FUNCTION IF EXISTS public.get_sales_funnel(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_search_insights(TIMESTAMPTZ, TIMESTAMPTZ);

-- 2. Secure current versions
ALTER FUNCTION public.get_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_dashboard_metrics(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

ALTER FUNCTION public.get_geo_performance(TIMESTAMPTZ, TIMESTAMPTZ) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_geo_performance(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;

ALTER FUNCTION public.get_search_insights(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_search_insights(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon;

ALTER FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_product_performance(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

ALTER FUNCTION public.get_sales_funnel(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_sales_funnel(TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) FROM PUBLIC, anon;

ALTER FUNCTION public.get_dashboard_opportunities(TIMESTAMPTZ, TIMESTAMPTZ) SET search_path = public;
REVOKE ALL ON FUNCTION public.get_dashboard_opportunities(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;

ALTER FUNCTION public.get_inventory_priority() SET search_path = public;
REVOKE ALL ON FUNCTION public.get_inventory_priority() FROM PUBLIC, anon;

ALTER FUNCTION public.get_monthly_revenue_comparison() SET search_path = public;
REVOKE ALL ON FUNCTION public.get_monthly_revenue_comparison() FROM PUBLIC, anon;