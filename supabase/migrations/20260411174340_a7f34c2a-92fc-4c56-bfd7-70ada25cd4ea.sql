
-- Enterprise profiles
CREATE TABLE public.enterprise_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  country text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  employee_count integer NOT NULL DEFAULT 0,
  phone text,
  business_description text DEFAULT '',
  visual_level text DEFAULT 'none',
  selected_business_id text,
  logo_url text,
  site_id uuid,
  plan text NOT NULL DEFAULT 'free',
  plan_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own enterprise profile"
ON public.enterprise_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enterprise revenues
CREATE TABLE public.enterprise_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'income',
  category text NOT NULL DEFAULT '',
  description text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own revenues"
ON public.enterprise_revenues FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enterprise expenses
CREATE TABLE public.enterprise_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'expense',
  category text NOT NULL DEFAULT '',
  description text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  recurring boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own expenses"
ON public.enterprise_expenses FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enterprise employees
CREATE TABLE public.enterprise_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  hired_at date NOT NULL DEFAULT CURRENT_DATE,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own employees"
ON public.enterprise_employees FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enterprise alerts
CREATE TABLE public.enterprise_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL DEFAULT 'expense_threshold',
  threshold numeric NOT NULL DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts"
ON public.enterprise_alerts FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add user_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'freelancer';
