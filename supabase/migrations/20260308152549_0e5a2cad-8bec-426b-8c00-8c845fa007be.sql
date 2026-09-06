
CREATE TABLE public.generated_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  business_category TEXT,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view generated sites" ON public.generated_sites
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their sites" ON public.generated_sites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites" ON public.generated_sites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
