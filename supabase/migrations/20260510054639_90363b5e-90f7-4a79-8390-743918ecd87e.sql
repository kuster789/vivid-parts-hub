-- Revoke execute from authenticated for trigger-only functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.proname AS function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosecdef = true
        AND n.nspname = 'public'
        AND p.proname IN (
            'notify_order_status_change',
            'notify_production_stage_change',
            'notify_new_product',
            'notify_new_coupon',
            'prevent_last_admin_master_delete',
            'increment_stock_on_order_delete',
            'decrement_stock_on_order_confirmed',
            'update_updated_at_column',
            'handle_new_user',
            'decrement_stock_on_order'
        )
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', func_record.function_name, func_record.args);
    END LOOP;
END $$;
