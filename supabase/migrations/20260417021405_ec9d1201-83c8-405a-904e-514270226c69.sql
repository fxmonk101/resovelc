-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view + update all profiles & transactions
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all transactions" ON public.transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update transactions" ON public.transactions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Business profiles
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  ein text,
  industry text NOT NULL,
  monthly_revenue numeric(14,2) DEFAULT 0,
  employees int DEFAULT 1,
  address text,
  city text,
  state text,
  zip text,
  business_balance numeric(14,2) NOT NULL DEFAULT 0,
  account_number text NOT NULL DEFAULT lpad((floor(random() * 9999999999)::bigint)::text, 10, '0'),
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own business" ON public.business_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own business" ON public.business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own business" ON public.business_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all businesses" ON public.business_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all businesses" ON public.business_profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_business_updated BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Loan applications
CREATE TABLE public.loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_type text NOT NULL,
  amount numeric(14,2) NOT NULL,
  term_months int NOT NULL,
  purpose text NOT NULL,
  annual_income numeric(14,2),
  employment_status text,
  employer text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  approved_amount numeric(14,2),
  interest_rate numeric(5,2),
  reference text NOT NULL DEFAULT ('LN' || (floor(random() * 999999999))::bigint::text),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loans" ON public.loan_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own loans" ON public.loan_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all loans" ON public.loan_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all loans" ON public.loan_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_loans_updated BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant applications
CREATE TABLE public.grant_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program text NOT NULL,
  amount_requested numeric(14,2) NOT NULL,
  purpose text NOT NULL,
  household_size int,
  household_income numeric(14,2),
  hardship_description text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  approved_amount numeric(14,2),
  reference text NOT NULL DEFAULT ('GR' || (floor(random() * 999999999))::bigint::text),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.grant_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own grants" ON public.grant_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own grants" ON public.grant_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all grants" ON public.grant_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all grants" ON public.grant_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_grants_updated BEFORE UPDATE ON public.grant_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit card applications
CREATE TABLE public.credit_card_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type text NOT NULL,
  requested_limit numeric(12,2) NOT NULL,
  annual_income numeric(14,2),
  employment_status text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reference text NOT NULL DEFAULT ('CC' || (floor(random() * 999999999))::bigint::text),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_card_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own card apps" ON public.credit_card_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own card apps" ON public.credit_card_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all card apps" ON public.credit_card_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all card apps" ON public.credit_card_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ccapp_updated BEFORE UPDATE ON public.credit_card_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Issued credit cards
CREATE TABLE public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.credit_card_applications(id) ON DELETE SET NULL,
  card_type text NOT NULL,
  card_number text NOT NULL DEFAULT ('4' || lpad((floor(random() * 999999999999999)::bigint)::text, 15, '0')),
  cvv text NOT NULL DEFAULT lpad((floor(random() * 999)::int)::text, 3, '0'),
  expiry text NOT NULL DEFAULT to_char(now() + interval '4 years', 'MM/YY'),
  credit_limit numeric(12,2) NOT NULL DEFAULT 1000,
  available_credit numeric(12,2) NOT NULL DEFAULT 1000,
  current_balance numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own cards" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all cards" ON public.credit_cards FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert cards" ON public.credit_cards FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update cards" ON public.credit_cards FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();