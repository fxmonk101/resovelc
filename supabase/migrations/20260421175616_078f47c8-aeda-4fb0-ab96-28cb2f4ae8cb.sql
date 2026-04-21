
-- =========================================================================
-- 1. Notifications
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general', -- transaction | approval | security | general
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their notifications" ON public.notifications;
CREATE POLICY "Users see their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users mark their notifications" ON public.notifications;
CREATE POLICY "Users mark their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Helper: emit a notification (security definer so RPCs can call it for any user)
CREATE OR REPLACE FUNCTION public.emit_notification(
  _user_id UUID, _title TEXT, _body TEXT, _category TEXT DEFAULT 'general', _link TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n_id UUID;
BEGIN
  INSERT INTO public.notifications(user_id, title, body, category, link)
  VALUES (_user_id, _title, _body, _category, _link)
  RETURNING id INTO n_id;
  RETURN n_id;
END;
$$;

-- =========================================================================
-- 2. Enhanced KYC: doc type + back/passport/proof-of-address
-- =========================================================================
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'drivers_license',
  ADD COLUMN IF NOT EXISTS id_back_url TEXT,
  ADD COLUMN IF NOT EXISTS passport_info_url TEXT,
  ADD COLUMN IF NOT EXISTS proof_of_address_url TEXT;

-- =========================================================================
-- 3. International transfers
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.international_transfers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL,
  reference          TEXT NOT NULL DEFAULT ('INT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  recipient_name     TEXT NOT NULL,
  recipient_bank     TEXT NOT NULL,
  swift_bic          TEXT NOT NULL,
  iban_or_account    TEXT NOT NULL,
  recipient_country  TEXT NOT NULL,
  recipient_address  TEXT,
  currency           TEXT NOT NULL DEFAULT 'USD',
  amount             NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  fee                NUMERIC(14,2) NOT NULL DEFAULT 0,
  exchange_rate      NUMERIC(14,6) NOT NULL DEFAULT 1,
  purpose            TEXT,
  status             TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  admin_notes        TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_int_transfers_user ON public.international_transfers(user_id, created_at DESC);

ALTER TABLE public.international_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own intl transfers" ON public.international_transfers;
CREATE POLICY "Users select own intl transfers" ON public.international_transfers
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users create their intl transfers" ON public.international_transfers;
CREATE POLICY "Users create their intl transfers" ON public.international_transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update intl transfers" ON public.international_transfers;
CREATE POLICY "Admins update intl transfers" ON public.international_transfers
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 4. Submit international transfer (debits balance, queues for processing)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.user_submit_international_transfer(
  _recipient_name TEXT, _recipient_bank TEXT, _swift_bic TEXT, _iban TEXT,
  _country TEXT, _recipient_address TEXT, _currency TEXT, _amount NUMERIC,
  _purpose TEXT
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  v_balance NUMERIC;
  v_fee NUMERIC := GREATEST(25, _amount * 0.005); -- $25 or 0.5%, whichever larger
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

  INSERT INTO public.transactions(user_id, amount, type, description)
  VALUES (uid, -v_total, 'international_transfer', 'International wire to ' || _recipient_name || ' (' || _country || ') · ' || v_ref);

  PERFORM public.emit_notification(uid, 'International transfer submitted',
    'Your wire of ' || _currency || ' ' || _amount || ' to ' || _recipient_name || ' is processing. Reference ' || v_ref || '.',
    'transaction', '/dashboard');

  RETURN json_build_object('id', v_id, 'reference', v_ref, 'fee', v_fee, 'total', v_total);
END;
$$;

-- =========================================================================
-- 5. Admin balance adjuster (always reads latest, never overwrites)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  _user_id UUID, _amount NUMERIC, _description TEXT, _direction TEXT
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
          COALESCE(_description, 'Admin ' || _direction));

  PERFORM public.emit_notification(_user_id,
    CASE WHEN _direction = 'credit' THEN 'Funds credited to your account' ELSE 'Funds debited from your account' END,
    CASE WHEN _direction = 'credit' THEN '$' || _amount || ' has been credited. New balance: $' || v_new || '.'
         ELSE '$' || _amount || ' has been debited. New balance: $' || v_new || '.' END,
    'transaction', '/dashboard');

  RETURN json_build_object('new_balance', v_new, 'delta', v_signed);
END;
$$;
