
CREATE TABLE public.scan_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text,
  category text NOT NULL DEFAULT '',
  rating numeric,
  website text,
  has_website boolean NOT NULL DEFAULT false,
  opportunity_score numeric,
  lat double precision NOT NULL DEFAULT 0,
  lng double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan businesses" ON public.scan_businesses
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scans WHERE scans.id = scan_businesses.scan_id AND scans.user_id = auth.uid()));

CREATE POLICY "Users can insert own scan businesses" ON public.scan_businesses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.scans WHERE scans.id = scan_businesses.scan_id AND scans.user_id = auth.uid()));

CREATE POLICY "Users can delete own scan businesses" ON public.scan_businesses
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.scans WHERE scans.id = scan_businesses.scan_id AND scans.user_id = auth.uid()));
