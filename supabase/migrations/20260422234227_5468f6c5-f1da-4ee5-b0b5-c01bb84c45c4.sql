CREATE OR REPLACE FUNCTION public.admin_set_balance(_user_id uuid, _new_balance numeric, _description text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old NUMERIC;
  v_delta NUMERIC;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'Balance cannot be negative'; END IF;

  SELECT balance INTO v_old FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  IF v_old IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  v_delta := _new_balance - v_old;

  UPDATE public.profiles SET balance = _new_balance WHERE user_id = _user_id;

  IF v_delta <> 0 THEN
    INSERT INTO public.transactions(user_id, amount, type, description)
    VALUES (_user_id, v_delta, CASE WHEN v_delta > 0 THEN 'admin_credit' ELSE 'admin_debit' END,
            COALESCE(_description, 'Admin balance adjustment'));
  END IF;

  PERFORM public.emit_notification(_user_id,
    'Account balance updated',
    'Your balance was updated to $' || _new_balance || '.',
    'transaction', '/dashboard');

  RETURN json_build_object('old_balance', v_old, 'new_balance', _new_balance, 'delta', v_delta);
END;
$$;