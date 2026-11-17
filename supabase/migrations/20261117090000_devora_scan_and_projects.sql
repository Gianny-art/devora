CREATE TABLE public.free_scan_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.free_scan_usage ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.scan_businesses
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE OR REPLACE FUNCTION public.get_free_scan_used()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.free_scan_usage
    WHERE user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.get_free_scan_used() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_free_scan_used() TO authenticated;

ALTER TABLE public.project_businesses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'contacted', 'interested', 'proposal', 'closed', 'lost'));

CREATE POLICY "Project members update shared business status" ON public.project_businesses
  FOR UPDATE TO authenticated
  USING (public.is_project_member(auth.uid(), project_id))
  WITH CHECK (public.is_project_member(auth.uid(), project_id));
REVOKE UPDATE ON TABLE public.project_businesses FROM authenticated;
GRANT UPDATE (status) ON TABLE public.project_businesses TO authenticated;

DROP POLICY IF EXISTS "Users manage own scans" ON public.scans;
CREATE POLICY "Users view own scans" ON public.scans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Premium users save scans" ON public.scans
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.plan = 'premium'
        AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
    )
  );
CREATE POLICY "Premium users update own scans" ON public.scans
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.plan = 'premium'
        AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
    )
  )
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own scans" ON public.scans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own scan businesses" ON public.scan_businesses;
DROP POLICY IF EXISTS "Users can insert own scan businesses" ON public.scan_businesses;
DROP POLICY IF EXISTS "Users can delete own scan businesses" ON public.scan_businesses;
CREATE POLICY "Users view own scan businesses" ON public.scan_businesses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scans s
    WHERE s.id = scan_businesses.scan_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Premium users save own scan businesses" ON public.scan_businesses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.scans s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.id = scan_businesses.scan_id
      AND s.user_id = auth.uid()
      AND p.plan = 'premium'
      AND (p.plan_expires_at IS NULL OR p.plan_expires_at > now())
  ));
CREATE POLICY "Users delete own scan businesses" ON public.scan_businesses
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.scans s
    WHERE s.id = scan_businesses.scan_id AND s.user_id = auth.uid()
  ));

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, company, phone, avatar_url, updated_at)
  ON TABLE public.profiles TO authenticated;
