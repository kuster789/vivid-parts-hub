-- 1. Fix search_path for mutable functions
ALTER FUNCTION public.normalize_geo_data() SET search_path = public;

-- 2. Revoke default execute on all functions from PUBLIC (which includes anon and authenticated)
-- This is a proactive step to ensure no function is exposed unless explicitly granted.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- 3. Grant EXECUTE back to those that NEED to be callable from the frontend

-- Utility functions needed by all authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Coupon validation needs to be public for checkout (both anon and authenticated)
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric, uuid) TO anon, authenticated;

-- Analytical functions for Dashboard (only for authenticated users)
-- Internal RBAC checks within these functions will handle fine-grained permissions (admin/supervisor)
GRANT EXECUTE ON FUNCTION public.get_geo_performance(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_opportunities(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue_comparison() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_funnel(timestamptz, timestamptz, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_performance(timestamptz, timestamptz, integer, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_insights(timestamptz, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics(timestamptz, timestamptz, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_priority() TO authenticated;

-- 4. Ensure future functions follow the same principle (optional but good practice)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM authenticated;

-- 5. Revoke execute on trigger functions explicitly (system calls them as owner/definer, but they shouldn't be RPCable)
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_product() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order_confirmed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_last_admin_master_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_stock_on_order_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_geo_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_coupon() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_production_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM PUBLIC, anon, authenticated;
