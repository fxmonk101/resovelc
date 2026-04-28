
-- Rename existing data
UPDATE public.transactions
SET description = regexp_replace(description, 'Resolva Credix ', 'Resolva ', 'g')
WHERE description LIKE '%Resolva Credix %';

UPDATE public.transactions
SET description = regexp_replace(description, '^Admin ', 'Resolva ')
WHERE description LIKE 'Admin %';

UPDATE public.notifications
SET title = regexp_replace(title, 'Resolva Credix', 'Resolva', 'g'),
    body  = regexp_replace(body,  'Resolva Credix', 'Resolva', 'g')
WHERE title ILIKE '%Resolva Credix%' OR body ILIKE '%Resolva Credix%';

-- Update RPCs
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(_user_id uuid, _amount numeric, _description text, _direction text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new NUMERIC;
  v_signed NUMERIC := CASE WHEN _direction = 'credit' THEN _amount ELSE -_amount END;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  UPDATE public.profiles
     SET balance = balance + v_signed
   WHERE user_id = _user_id
   RETURNING balance INTO v_new;

  IF v_new IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  IF v_new < 0 THEN
    UPDATE public.profiles SET balance = balance - v_signed WHERE user_id = _user_id;
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  INSERT INTO public.transactions(user_id, amount, type, description)
  VALUES (_user_id, v_signed, CASE WHEN _direction = 'credit' THEN 'admin_credit' ELSE 'admin_debit' END,
          COALESCE(_description, 'Resolva ' || _direction));

  PERFORM public.emit_notification(_user_id,
    CASE WHEN _direction = 'credit' THEN 'Funds credited by Resolva' ELSE 'Funds debited by Resolva' END,
    CASE WHEN _direction = 'credit' THEN '$' || _amount || ' has been credited to your account by Resolva. New balance: $' || v_new || '.'
         ELSE '$' || _amount || ' has been debited from your account by Resolva. New balance: $' || v_new || '.' END,
    'transaction', '/dashboard');

  RETURN json_build_object('new_balance', v_new, 'delta', v_signed);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_balance(_user_id uuid, _new_balance numeric, _description text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            COALESCE(_description, 'Resolva balance adjustment'));
  END IF;

  PERFORM public.emit_notification(_user_id,
    'Account balance updated',
    'Your balance was updated to $' || _new_balance || ' by Resolva.',
    'transaction', '/dashboard');

  RETURN json_build_object('old_balance', v_old, 'new_balance', _new_balance, 'delta', v_delta);
END;
$function$;
