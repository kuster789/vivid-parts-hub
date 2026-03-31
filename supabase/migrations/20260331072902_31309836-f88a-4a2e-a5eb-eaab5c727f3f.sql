
-- Sequence for quotation numbering per year
CREATE SEQUENCE IF NOT EXISTS public.quote_number_seq START 1;

-- Quotes table
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  client_name text,
  client_phone text,
  client_email text,
  notes text,
  validity_days integer NOT NULL DEFAULT 7,
  discount_percent numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_value numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Quote items table
CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  product_brand text NOT NULL,
  product_model text NOT NULL,
  product_sku text,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Function to generate quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _year text;
  _seq integer;
BEGIN
  _year := to_char(now(), 'YYYY');
  _seq := nextval('public.quote_number_seq');
  RETURN 'ORC-' || _year || '-' || lpad(_seq::text, 4, '0');
END;
$$;

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for quotes
CREATE POLICY "Staff can manage quotes" ON public.quotes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- RLS policies for quote_items
CREATE POLICY "Staff can manage quote items" ON public.quote_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_items.quote_id AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_items.quote_id AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role))));

-- Updated_at trigger
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
