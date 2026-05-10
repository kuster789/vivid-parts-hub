-- Secure the RPCs
REVOKE EXECUTE ON FUNCTION public.get_product_performance FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_search_insights FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_geo_performance FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_inventory_priority FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_monthly_revenue_comparison FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_product_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_search_insights TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_geo_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_priority TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_revenue_comparison TO authenticated;

-- Update geo normalization to include more variations
CREATE OR REPLACE FUNCTION public.normalize_geo_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize Country
    IF NEW.country IS NOT NULL THEN
        NEW.country := CASE 
            WHEN NEW.country IN ('Brazil', 'BRA', 'República Federativa do Brasil', 'BR', 'Brasil capital') THEN 'Brasil'
            WHEN NEW.country IN ('United States', 'USA', 'EUA', 'US', 'United States of America') THEN 'Estados Unidos'
            WHEN NEW.country IN ('Netherlands', 'Holanda', 'NL', 'The Netherlands') THEN 'Holanda'
            WHEN NEW.country IN ('France', 'FR', 'French Republic') THEN 'França'
            WHEN NEW.country IN ('Argentina', 'AR') THEN 'Argentina'
            ELSE NEW.country
        END;
    END IF;

    -- Clean names (trimming and basic formatting)
    IF NEW.state IS NOT NULL THEN
        NEW.state := trim(regexp_replace(NEW.state, '\s*\(.*?\)', '', 'g'));
        -- Normalize states if needed (e.g., São Paulo capital -> São Paulo)
        NEW.state := trim(regexp_replace(NEW.state, '\s+capital$', '', 'gi'));
    END IF;

    IF NEW.city IS NOT NULL THEN
        NEW.city := trim(regexp_replace(NEW.city, '\s*\(.*?\)', '', 'g'));
        NEW.city := trim(regexp_replace(NEW.city, '\s+capital$', '', 'gi'));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Refine RLS Policy for analytics_events
DROP POLICY IF EXISTS "Public can insert analytics events" ON public.analytics_events;
CREATE POLICY "Public can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (event_type IS NOT NULL AND length(event_type) > 0);
