
-- Allow users to cancel their own pending transactions
CREATE OR REPLACE FUNCTION public.user_cancel_pending_transaction(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.transactions
     SET status = 'failed'
   WHERE id = _id
     AND user_id = auth.uid()
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not cancellable';
  END IF;
END;
$$;

-- Allow users to edit amount/description of their own pending transactions
CREATE OR REPLACE FUNCTION public.user_edit_pending_transaction(
  _id uuid,
  _amount numeric,
  _description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;
  IF _description IS NULL OR length(trim(_description)) = 0 THEN
    RAISE EXCEPTION 'Description is required';
  END IF;

  UPDATE public.transactions
     SET amount = _amount,
         description = _description
   WHERE id = _id
     AND user_id = auth.uid()
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not editable';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_cancel_pending_transaction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_edit_pending_transaction(uuid, numeric, text) TO authenticated;
