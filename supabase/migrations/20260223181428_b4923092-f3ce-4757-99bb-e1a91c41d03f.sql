
-- Table to track page views
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view page views" ON public.page_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Only admins can delete (cleanup)
CREATE POLICY "Admins can delete page views" ON public.page_views
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for online tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
