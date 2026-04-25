
-- Cancel a pending domestic transfer (user-owned, only while still pending)
CREATE OR REPLACE FUNCTION public.user_cancel_domestic_transfer(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.domestic_transfers
     SET status = 'cancelled', updated_at = now()
   WHERE id = _id
     AND user_id = auth.uid()
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found, not yours, or no longer pending';
  END IF;
END;
$$;

-- Edit a pending domestic transfer
CREATE OR REPLACE FUNCTION public.user_edit_domestic_transfer(
  _id uuid,
  _recipient_name text,
  _bank_name text,
  _routing_number text,
  _account_number text,
  _account_type text,
  _amount numeric,
  _memo text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF _routing_number !~ '^\d{9}$' THEN
    RAISE EXCEPTION 'Routing number must be exactly 9 digits';
  END IF;

  IF _account_number !~ '^\d{5,20}$' THEN
    RAISE EXCEPTION 'Account number must be 5–20 digits';
  END IF;

  IF _account_type NOT IN ('checking', 'savings') THEN
    RAISE EXCEPTION 'Account type must be checking or savings';
  END IF;

  UPDATE public.domestic_transfers
     SET recipient_name = _recipient_name,
         bank_name = _bank_name,
         routing_number = _routing_number,
         account_number = _account_number,
         account_type = _account_type,
         amount = _amount,
         memo = _memo,
         updated_at = now()
   WHERE id = _id
     AND user_id = auth.uid()
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found, not yours, or no longer pending';
  END IF;
END;
$$;

-- Cancel a pending international transfer
CREATE OR REPLACE FUNCTION public.user_cancel_international_transfer(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.international_transfers
     SET status = 'cancelled', updated_at = now()
   WHERE id = _id
     AND user_id = auth.uid()
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found, not yours, or no longer pending';
  END IF;
END;
$$;
