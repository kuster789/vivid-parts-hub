
-- Create storage bucket for manuals/documents
INSERT INTO storage.buckets (id, name, public) VALUES ('manuals', 'manuals', true);

-- Allow anyone to read manuals
CREATE POLICY "Anyone can view manuals" ON storage.objects FOR SELECT USING (bucket_id = 'manuals');

-- Only admins can upload manuals
CREATE POLICY "Admins can upload manuals" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'manuals' AND has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete manuals
CREATE POLICY "Admins can delete manuals" ON storage.objects FOR DELETE USING (bucket_id = 'manuals' AND has_role(auth.uid(), 'admin'::app_role));

-- Create a table for manual metadata
CREATE TABLE public.manuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'manual',
  file_url TEXT NOT NULL,
  file_size INTEGER,
  brand TEXT,
  models TEXT[],
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view manuals" ON public.manuals FOR SELECT USING (true);
CREATE POLICY "Admins can manage manuals" ON public.manuals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
