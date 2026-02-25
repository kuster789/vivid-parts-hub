
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_name TEXT NOT NULL,
  piece_value NUMERIC NOT NULL DEFAULT 0,
  platform_cost NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  manufacturing_cost NUMERIC NOT NULL DEFAULT 0,
  net_value NUMERIC GENERATED ALWAYS AS (piece_value - platform_cost - shipping_cost - manufacturing_cost) STORED,
  profit_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN piece_value > 0 
      THEN ROUND(((piece_value - platform_cost - shipping_cost - manufacturing_cost) / piece_value) * 100, 2)
      ELSE 0 
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sales" ON public.sales
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view sales" ON public.sales
  FOR SELECT USING (has_role(auth.uid(), 'employee'::app_role));
