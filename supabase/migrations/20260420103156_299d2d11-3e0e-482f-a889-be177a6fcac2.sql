-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Transfer money RPC (atomic balance update + transactions log)
CREATE OR REPLACE FUNCTION public.user_transfer_funds(
  _to_account text,
  _amount numeric,
  _memo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _from_user uuid := auth.uid();
  _to_user uuid;
  _from_balance numeric;
BEGIN
  IF _from_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT balance INTO _from_balance FROM public.profiles WHERE user_id = _from_user FOR UPDATE;
  IF _from_balance IS NULL THEN RAISE EXCEPTION 'Sender profile not found'; END IF;
  IF _from_balance < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  SELECT user_id INTO _to_user FROM public.profiles WHERE account_number = _to_account;
  IF _to_user IS NULL THEN RAISE EXCEPTION 'Recipient account not found'; END IF;
  IF _to_user = _from_user THEN RAISE EXCEPTION 'Cannot transfer to your own account'; END IF;

  UPDATE public.profiles SET balance = balance - _amount WHERE user_id = _from_user;
  UPDATE public.profiles SET balance = balance + _amount WHERE user_id = _to_user;

  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (_from_user, 'debit', _amount, COALESCE(NULLIF(_memo, ''), 'Transfer to ' || _to_account), 'completed');
  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (_to_user, 'credit', _amount, COALESCE(NULLIF(_memo, ''), 'Transfer from account'), 'completed');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Pay bill RPC (debit only, log transaction; admin must fund)
CREATE OR REPLACE FUNCTION public.user_pay_bill(
  _payee text,
  _amount numeric,
  _memo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _bal numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _payee IS NULL OR length(trim(_payee)) = 0 THEN RAISE EXCEPTION 'Payee required'; END IF;

  SELECT balance INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF _bal < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  UPDATE public.profiles SET balance = balance - _amount WHERE user_id = _uid;
  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (_uid, 'debit', _amount, 'Bill payment · ' || _payee || COALESCE(' · ' || NULLIF(_memo, ''), ''), 'completed');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Deposit request: creates a pending transaction (admin will fund)
CREATE OR REPLACE FUNCTION public.user_request_deposit(
  _amount numeric,
  _method text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, description, status)
  VALUES (_uid, 'credit', _amount, 'Deposit request · ' || COALESCE(_method, 'ACH'), 'pending');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- KYC submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_legal_name text NOT NULL,
  date_of_birth date NOT NULL,
  ssn_last4 text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  id_document_url text,
  selfie_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own kyc" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own kyc" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own kyc" ON public.kyc_submissions FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins view all kyc" ON public.kyc_submissions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all kyc" ON public.kyc_submissions FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_kyc_updated_at BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- KYC documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc', 'kyc', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own kyc docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own kyc docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins view all kyc docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc' AND has_role(auth.uid(), 'admin'));