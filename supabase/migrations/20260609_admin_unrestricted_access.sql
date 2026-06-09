-- Restrict local (internal) transfers for non-admin users
-- This prevents users from sending money to other member accounts
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

  -- Only admin users can send money locally (to other member accounts)
  IF NOT public.has_role(_from_user, 'admin') THEN
    RAISE EXCEPTION 'Local transfers are not allowed. Please use external bank transfers or contact support.';
  END IF;

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

-- Admin function to modify any user's profile without validation
CREATE OR REPLACE FUNCTION public.admin_modify_user_profile(
  _user_id uuid,
  _first_name text DEFAULT NULL,
  _last_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _country text DEFAULT NULL,
  _account_type text DEFAULT NULL,
  _account_number text DEFAULT NULL,
  _username text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _update_count int := 0;
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required';
  END IF;

  -- Update profile fields (no validation - admin bypass)
  UPDATE public.profiles
  SET
    first_name = COALESCE(_first_name, first_name),
    last_name = COALESCE(_last_name, last_name),
    phone = COALESCE(_phone, phone),
    country = COALESCE(_country, country),
    account_type = COALESCE(_account_type, account_type),
    account_number = COALESCE(_account_number, account_number),
    username = COALESCE(_username, username),
    updated_at = now()
  WHERE user_id = _user_id;

  GET DIAGNOSTICS _update_count = ROW_COUNT;

  IF _update_count = 0 THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'User profile updated by admin');
END;
$$;

-- Admin function to modify pending transaction receiver account (without validation)
CREATE OR REPLACE FUNCTION public.admin_modify_transfer_recipient(
  _transfer_id uuid,
  _kind text,
  _recipient_name text DEFAULT NULL,
  _bank_name text DEFAULT NULL,
  _routing_number text DEFAULT NULL,
  _account_number text DEFAULT NULL,
  _account_type text DEFAULT NULL,
  _recipient_bank text DEFAULT NULL,
  _swift_bic text DEFAULT NULL,
  _iban_or_account text DEFAULT NULL,
  _recipient_country text DEFAULT NULL,
  _recipient_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF _kind NOT IN ('domestic', 'international') THEN
    RAISE EXCEPTION 'Kind must be domestic or international';
  END IF;

  IF _kind = 'domestic' THEN
    UPDATE public.domestic_transfers
    SET
      recipient_name = COALESCE(_recipient_name, recipient_name),
      bank_name = COALESCE(_bank_name, bank_name),
      routing_number = COALESCE(_routing_number, routing_number),
      account_number = COALESCE(_account_number, account_number),
      account_type = COALESCE(_account_type, account_type),
      updated_at = now()
    WHERE id = _transfer_id AND status = 'pending';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transfer not found or not pending';
    END IF;
  ELSE
    UPDATE public.international_transfers
    SET
      recipient_name = COALESCE(_recipient_name, recipient_name),
      recipient_bank = COALESCE(_recipient_bank, recipient_bank),
      swift_bic = COALESCE(_swift_bic, swift_bic),
      iban_or_account = COALESCE(_iban_or_account, iban_or_account),
      recipient_country = COALESCE(_recipient_country, recipient_country),
      recipient_address = COALESCE(_recipient_address, recipient_address),
      updated_at = now()
    WHERE id = _transfer_id AND status = 'pending';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transfer not found or not pending';
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Transfer recipient updated');
END;
$$;

-- Admin function to complete a pending transaction
CREATE OR REPLACE FUNCTION public.admin_complete_pending_transaction(
  _transaction_id uuid,
  _admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.transactions
  SET status = 'completed', updated_at = now()
  WHERE id = _transaction_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not pending';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Transaction marked completed');
END;
$$;

-- Admin function to cancel a pending transaction
CREATE OR REPLACE FUNCTION public.admin_cancel_pending_transaction(
  _transaction_id uuid,
  _admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _user_id uuid;
  _amount numeric;
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.transactions
  SET status = 'cancelled', updated_at = now()
  WHERE id = _transaction_id AND status = 'pending'
  RETURNING user_id, amount INTO _user_id, _amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not pending';
  END IF;

  -- Refund user if transaction was a debit (negative amount)
  IF _amount < 0 THEN
    UPDATE public.profiles SET balance = balance + (-_amount) WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Transaction cancelled and user refunded if applicable');
END;
$$;

-- Admin function to mark transaction as failed
CREATE OR REPLACE FUNCTION public.admin_fail_pending_transaction(
  _transaction_id uuid,
  _admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _user_id uuid;
  _amount numeric;
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.transactions
  SET status = 'failed', updated_at = now()
  WHERE id = _transaction_id AND status = 'pending'
  RETURNING user_id, amount INTO _user_id, _amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not pending';
  END IF;

  -- Refund user if transaction was a debit (negative amount)
  IF _amount < 0 THEN
    UPDATE public.profiles SET balance = balance + (-_amount) WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Transaction marked failed and user refunded if applicable');
END;
$$;
