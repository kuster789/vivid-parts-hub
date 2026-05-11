-- 1. Support generate_quote_number as INVOKER
GRANT USAGE, SELECT ON SEQUENCE public.quote_number_seq TO authenticated;

-- 2. Convert all analytical functions to SECURITY INVOKER
ALTER FUNCTION public.get_geo_performance(timestamptz, timestamptz) SECURITY INVOKER;
ALTER FUNCTION public.get_dashboard_opportunities(timestamptz, timestamptz) SECURITY INVOKER;
ALTER FUNCTION public.get_monthly_revenue_comparison() SECURITY INVOKER;
ALTER FUNCTION public.get_sales_funnel(timestamptz, timestamptz, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_product_performance(timestamptz, timestamptz, integer, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_search_insights(timestamptz, timestamptz, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_dashboard_metrics(timestamptz, timestamptz, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.get_inventory_priority() SECURITY INVOKER;
ALTER FUNCTION public.generate_quote_number() SECURITY INVOKER;

-- 3. Note: Trigger functions remain SECURITY DEFINER as required by Postgres for triggers on tables with RLS, 
-- but we have already revoked their public execution permissions in a previous migration.
