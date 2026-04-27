
-- 1) Fix international transfer to mark transactions as pending
CREATE OR REPLACE FUNCTION public.user_submit_international_transfer(
  _recipient_name text, _recipient_bank text, _swift_bic text, _iban text,
  _country text, _recipient_address text, _currency text, _amount numeric, _purpose text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid UUID := auth.uid();
  v_balance NUMERIC;
  v_fee NUMERIC := GREATEST(25, _amount * 0.005);
  v_total NUMERIC := _amount + v_fee;
  v_ref TEXT;
  v_id UUID;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT balance INTO v_balance FROM public.profiles WHERE user_id = uid FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_balance < v_total THEN RAISE EXCEPTION 'Insufficient funds (need % including fees)', v_total; END IF;

  UPDATE public.profiles SET balance = balance - v_total WHERE user_id = uid;

  INSERT INTO public.international_transfers(user_id, recipient_name, recipient_bank, swift_bic, iban_or_account,
    recipient_country, recipient_address, currency, amount, fee, purpose)
  VALUES (uid, _recipient_name, _recipient_bank, _swift_bic, _iban, _country, _recipient_address, _currency, _amount, v_fee, _purpose)
  RETURNING id, reference INTO v_id, v_ref;

  -- IMPORTANT: explicitly mark transaction as pending
  INSERT INTO public.transactions(user_id, amount, type, description, status)
  VALUES (uid, -v_total, 'international_transfer',
    'International wire to ' || _recipient_name || ' (' || _country || ') · ' || v_ref,
    'pending');

  PERFORM public.emit_notification(uid, 'International transfer submitted',
    'Your wire of ' || _currency || ' ' || _amount || ' to ' || _recipient_name || ' is processing. Funds will arrive within 24–48 hours. Reference ' || v_ref || '.',
    'transaction', '/dashboard');

  RETURN json_build_object('id', v_id, 'reference', v_ref, 'fee', v_fee, 'total', v_total);
END;
$$;

-- 2) Cancel domestic transfer: refund user + mark linked transaction failed
CREATE OR REPLACE FUNCTION public.user_cancel_domestic_transfer(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_amount numeric;
  v_ref text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.domestic_transfers
     SET status = 'cancelled', updated_at = now()
   WHERE id = _id
     AND user_id = v_uid
     AND status = 'pending'
   RETURNING amount, reference INTO v_amount, v_ref;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found, not yours, or no longer pending';
  END IF;

  -- Refund the user
  UPDATE public.profiles SET balance = balance + v_amount WHERE user_id = v_uid;

  -- Mark the linked transaction as failed (best-effort match by reference in description)
  UPDATE public.transactions
     SET status = 'failed'
   WHERE user_id = v_uid
     AND type = 'domestic_transfer'
     AND status = 'pending'
     AND description LIKE '%' || v_ref || '%';

  PERFORM public.emit_notification(v_uid,
    'Transfer cancelled',
    'Your transfer ' || v_ref || ' was cancelled and $' || v_amount || ' was refunded to your account.',
    'transaction', '/dashboard');
END;
$$;

-- 3) Cancel international transfer: refund user (amount + fee) + mark linked transaction failed
CREATE OR REPLACE FUNCTION public.user_cancel_international_transfer(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_amount numeric;
  v_fee numeric;
  v_ref text;
  v_currency text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.international_transfers
     SET status = 'cancelled', updated_at = now()
   WHERE id = _id
     AND user_id = v_uid
     AND status = 'pending'
   RETURNING amount, fee, reference, currency INTO v_amount, v_fee, v_ref, v_currency;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found, not yours, or no longer pending';
  END IF;

  UPDATE public.profiles SET balance = balance + (v_amount + v_fee) WHERE user_id = v_uid;

  UPDATE public.transactions
     SET status = 'failed'
   WHERE user_id = v_uid
     AND type = 'international_transfer'
     AND status = 'pending'
     AND description LIKE '%' || v_ref || '%';

  PERFORM public.emit_notification(v_uid,
    'International transfer cancelled',
    'Your wire ' || v_ref || ' was cancelled and ' || v_currency || ' ' || (v_amount + v_fee) || ' was refunded to your account.',
    'transaction', '/dashboard');
END;
$$;

-- 4) Cancel pending transaction (unlinked): refund if it's a debit
CREATE OR REPLACE FUNCTION public.user_cancel_pending_transaction(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_amount numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.transactions
     SET status = 'failed'
   WHERE id = _id
     AND user_id = v_uid
     AND status = 'pending'
   RETURNING amount INTO v_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not cancellable';
  END IF;

  -- If the transaction debited the account (negative amount), refund it.
  IF v_amount < 0 THEN
    UPDATE public.profiles SET balance = balance + (-v_amount) WHERE user_id = v_uid;
  END IF;
END;
$$;

-- 5) Admin helper: settle a transfer (complete or fail). Failing refunds the user.
CREATE OR REPLACE FUNCTION public.admin_settle_transfer(_kind text, _id uuid, _new_status text, _notes text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid;
  v_amount numeric;
  v_fee numeric := 0;
  v_ref text;
  v_refund numeric := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _new_status NOT IN ('completed', 'failed') THEN RAISE EXCEPTION 'Status must be completed or failed'; END IF;
  IF _kind NOT IN ('domestic', 'international') THEN RAISE EXCEPTION 'Kind must be domestic or international'; END IF;

  IF _kind = 'domestic' THEN
    UPDATE public.domestic_transfers
       SET status = _new_status, admin_notes = COALESCE(_notes, admin_notes), updated_at = now()
     WHERE id = _id AND status = 'pending'
     RETURNING user_id, amount, reference INTO v_user, v_amount, v_ref;
    v_refund := v_amount;
  ELSE
    UPDATE public.international_transfers
       SET status = _new_status, admin_notes = COALESCE(_notes, admin_notes), updated_at = now()
     WHERE id = _id AND status = 'pending'
     RETURNING user_id, amount, fee, reference INTO v_user, v_amount, v_fee, v_ref;
    v_refund := v_amount + v_fee;
  END IF;

  IF v_user IS NULL THEN RAISE EXCEPTION 'Transfer not found or no longer pending'; END IF;

  -- Update linked transaction status
  UPDATE public.transactions
     SET status = _new_status
   WHERE user_id = v_user
     AND status = 'pending'
     AND description LIKE '%' || v_ref || '%';

  IF _new_status = 'failed' THEN
    UPDATE public.profiles SET balance = balance + v_refund WHERE user_id = v_user;
    PERFORM public.emit_notification(v_user,
      'Transfer failed — refunded',
      'Your transfer ' || v_ref || ' could not be processed. $' || v_refund || ' has been refunded to your account.',
      'transaction', '/dashboard');
  ELSE
    PERFORM public.emit_notification(v_user,
      'Transfer completed',
      'Your transfer ' || v_ref || ' has been completed successfully.',
      'transaction', '/dashboard');
  END IF;

  RETURN json_build_object('refunded', CASE WHEN _new_status = 'failed' THEN v_refund ELSE 0 END);
END;
$$;
