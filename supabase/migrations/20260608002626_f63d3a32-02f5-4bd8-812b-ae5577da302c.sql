
ALTER TABLE public.domestic_transfers ADD COLUMN IF NOT EXISTS pending_admin_edits jsonb;
ALTER TABLE public.international_transfers ADD COLUMN IF NOT EXISTS pending_admin_edits jsonb;

CREATE OR REPLACE FUNCTION public.admin_set_pending_transfer_edits(_kind text, _id uuid, _edits jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _kind = 'domestic' THEN
    UPDATE public.domestic_transfers SET pending_admin_edits = _edits, updated_at = now() WHERE id = _id;
  ELSIF _kind = 'international' THEN
    UPDATE public.international_transfers SET pending_admin_edits = _edits, updated_at = now() WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'Kind must be domestic or international';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_settle_transfer(_kind text, _id uuid, _new_status text, _notes text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
  v_amount numeric;
  v_fee numeric := 0;
  v_ref text;
  v_refund numeric := 0;
  v_edits jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _new_status NOT IN ('completed', 'failed') THEN RAISE EXCEPTION 'Status must be completed or failed'; END IF;
  IF _kind NOT IN ('domestic', 'international') THEN RAISE EXCEPTION 'Kind must be domestic or international'; END IF;

  IF _kind = 'domestic' THEN
    SELECT pending_admin_edits INTO v_edits FROM public.domestic_transfers WHERE id = _id AND status = 'pending';
    UPDATE public.domestic_transfers
       SET status = _new_status,
           admin_notes = COALESCE(_notes, admin_notes),
           recipient_name = COALESCE(v_edits->>'recipient_name', recipient_name),
           bank_name = COALESCE(v_edits->>'bank_name', bank_name),
           routing_number = COALESCE(v_edits->>'routing_number', routing_number),
           account_number = COALESCE(v_edits->>'account_number', account_number),
           account_type = COALESCE(v_edits->>'account_type', account_type),
           memo = COALESCE(v_edits->>'memo', memo),
           pending_admin_edits = NULL,
           updated_at = now()
     WHERE id = _id AND status = 'pending'
     RETURNING user_id, amount, reference INTO v_user, v_amount, v_ref;
    v_refund := v_amount;
  ELSE
    SELECT pending_admin_edits INTO v_edits FROM public.international_transfers WHERE id = _id AND status = 'pending';
    UPDATE public.international_transfers
       SET status = _new_status,
           admin_notes = COALESCE(_notes, admin_notes),
           recipient_name = COALESCE(v_edits->>'recipient_name', recipient_name),
           recipient_bank = COALESCE(v_edits->>'recipient_bank', recipient_bank),
           swift_bic = COALESCE(v_edits->>'swift_bic', swift_bic),
           iban_or_account = COALESCE(v_edits->>'iban_or_account', iban_or_account),
           recipient_country = COALESCE(v_edits->>'recipient_country', recipient_country),
           recipient_address = COALESCE(v_edits->>'recipient_address', recipient_address),
           purpose = COALESCE(v_edits->>'purpose', purpose),
           pending_admin_edits = NULL,
           updated_at = now()
     WHERE id = _id AND status = 'pending'
     RETURNING user_id, amount, fee, reference INTO v_user, v_amount, v_fee, v_ref;
    v_refund := v_amount + v_fee;
  END IF;

  IF v_user IS NULL THEN RAISE EXCEPTION 'Transfer not found or no longer pending'; END IF;

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
$function$;
