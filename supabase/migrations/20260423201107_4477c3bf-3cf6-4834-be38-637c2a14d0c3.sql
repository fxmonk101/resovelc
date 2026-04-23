-- Domestic (US external) transfers
CREATE TABLE public.domestic_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reference text NOT NULL DEFAULT ('DT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  recipient_name text NOT NULL,
  bank_name text NOT NULL,
  routing_number text NOT NULL,
  account_number text NOT NULL,
  account_type text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  memo text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domestic_transfers_account_type_chk CHECK (account_type IN ('checking','savings')),
  CONSTRAINT domestic_transfers_routing_chk CHECK (routing_number ~ '^[0-9]{9}$'),
  CONSTRAINT domestic_transfers_account_chk CHECK (account_number ~ '^[0-9]{5,20}$')
);

ALTER TABLE public.domestic_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own domestic transfers"
  ON public.domestic_transfers FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update domestic transfers"
  ON public.domestic_transfers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_domestic_transfers_updated_at
BEFORE UPDATE ON public.domestic_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: submit a domestic transfer
CREATE OR REPLACE FUNCTION public.user_submit_domestic_transfer(
  _recipient_name text,
  _bank_name text,
  _routing_number text,
  _account_number text,
  _account_type text,
  _amount numeric,
  _memo text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_balance numeric;
  v_ref text;
  v_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _recipient_name IS NULL OR length(trim(_recipient_name)) = 0 THEN RAISE EXCEPTION 'Recipient name required'; END IF;
  IF _bank_name IS NULL OR length(trim(_bank_name)) = 0 THEN RAISE EXCEPTION 'Bank name required'; END IF;
  IF _routing_number !~ '^[0-9]{9}$' THEN RAISE EXCEPTION 'Routing number must be exactly 9 digits'; END IF;
  IF _account_number !~ '^[0-9]{5,20}$' THEN RAISE EXCEPTION 'Account number must be 5-20 digits'; END IF;
  IF lower(_account_type) NOT IN ('checking','savings') THEN RAISE EXCEPTION 'Account type must be checking or savings'; END IF;

  SELECT balance INTO v_balance FROM public.profiles WHERE user_id = uid FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_balance < _amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  UPDATE public.profiles SET balance = balance - _amount WHERE user_id = uid;

  INSERT INTO public.domestic_transfers(
    user_id, recipient_name, bank_name, routing_number, account_number, account_type, amount, memo
  ) VALUES (
    uid, _recipient_name, _bank_name, _routing_number, _account_number, lower(_account_type), _amount, NULLIF(_memo, '')
  ) RETURNING id, reference INTO v_id, v_ref;

  INSERT INTO public.transactions(user_id, amount, type, description, status)
  VALUES (uid, -_amount, 'domestic_transfer',
    'Transfer to ' || _recipient_name || ' · ' || _bank_name || ' · ' || v_ref, 'pending');

  PERFORM public.emit_notification(uid,
    'Transfer submitted',
    'Your transfer of $' || _amount || ' to ' || _recipient_name || ' (' || _bank_name || ') is processing. Reference ' || v_ref || '.',
    'transaction', '/dashboard');

  RETURN json_build_object('id', v_id, 'reference', v_ref);
END;
$$;