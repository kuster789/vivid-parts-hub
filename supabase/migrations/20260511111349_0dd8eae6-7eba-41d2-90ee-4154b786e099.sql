-- Grant EXECUTE back to generate_quote_number for authenticated users (Admins)
GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated;

-- Ensure it's still revoked from anon
REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM anon;
