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
    -- Using region instead of state as per table schema
    IF NEW.region IS NOT NULL THEN
        NEW.region := trim(regexp_replace(NEW.region, '\s*\(.*?\)', '', 'g'));
        -- Normalize regions/states if needed
        NEW.region := trim(regexp_replace(NEW.region, '\s+capital$', '', 'gi'));
    END IF;

    IF NEW.city IS NOT NULL THEN
        NEW.city := trim(regexp_replace(NEW.city, '\s*\(.*?\)', '', 'g'));
        NEW.city := trim(regexp_replace(NEW.city, '\s+capital$', '', 'gi'));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;