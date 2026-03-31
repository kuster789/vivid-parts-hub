
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_fantasy_name text,
  ADD COLUMN IF NOT EXISTS client_cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS client_ie text,
  ADD COLUMN IF NOT EXISTS client_address text,
  ADD COLUMN IF NOT EXISTS client_number text,
  ADD COLUMN IF NOT EXISTS client_complement text,
  ADD COLUMN IF NOT EXISTS client_neighborhood text,
  ADD COLUMN IF NOT EXISTS client_city text,
  ADD COLUMN IF NOT EXISTS client_state text,
  ADD COLUMN IF NOT EXISTS client_zip text;
