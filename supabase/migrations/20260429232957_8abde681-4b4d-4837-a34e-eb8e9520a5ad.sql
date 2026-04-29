
-- Add admin_notes column to transactions (idempotent)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Admin-only RPC: update a pending transaction's status with optional note.
-- Returns user_id, email-friendly summary so caller can dispatch email.
CREATE OR REPLACE FUNCTION public.admin_update_transaction_status(
  _id uuid,
  _new_status text,
  _admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_amount numeric;
  v_old_status text;
  v_type text;
  v_desc text;
  v_ref text;
  v_refund numeric := 0;
  v_title text;
  v_body text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _new_status NOT IN ('completed', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Status must be completed, failed, or cancelled';
  END IF;

  SELECT user_id, amount, status, type, description, reference
    INTO v_user, v_amount, v_old_status, v_type, v_desc, v_ref
  FROM public.transactions
  WHERE id = _id
  FOR UPDATE;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  IF v_old_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending transactions can be updated (current status: %)', v_old_status;
  END IF;

  -- Refund debits when failing/cancelling
  IF _new_status IN ('failed', 'cancelled') AND v_amount < 0 THEN
    v_refund := -v_amount;
    UPDATE public.profiles SET balance = balance + v_refund WHERE user_id = v_user;
  END IF;

  UPDATE public.transactions
     SET status = _new_status,
         admin_notes = COALESCE(_admin_notes, admin_notes)
   WHERE id = _id;

  -- Compose notification
  IF _new_status = 'completed' THEN
    v_title := 'Transaction completed';
    v_body  := 'Your transaction "' || v_desc || '" has been completed successfully.';
  ELSIF _new_status = 'failed' THEN
    v_title := 'Transaction failed';
    v_body  := 'Your transaction "' || v_desc || '" failed.'
               || CASE WHEN _admin_notes IS NOT NULL AND length(trim(_admin_notes)) > 0
                       THEN ' Reason: ' || _admin_notes ELSE '' END
               || CASE WHEN v_refund > 0 THEN ' $' || v_refund || ' has been refunded to your account.' ELSE '' END;
  ELSE -- cancelled
    v_title := 'Transaction cancelled';
    v_body  := 'Your transaction "' || v_desc || '" was cancelled.'
               || CASE WHEN _admin_notes IS NOT NULL AND length(trim(_admin_notes)) > 0
                       THEN ' Reason: ' || _admin_notes ELSE '' END
               || CASE WHEN v_refund > 0 THEN ' $' || v_refund || ' has been refunded to your account.' ELSE '' END;
  END IF;

  PERFORM public.emit_notification(v_user, v_title, v_body, 'transaction', '/dashboard');

  RETURN json_build_object(
    'user_id', v_user,
    'amount', v_amount,
    'refund', v_refund,
    'reference', v_ref,
    'description', v_desc,
    'new_status', _new_status,
    'admin_notes', _admin_notes
  );
END;
$$;
