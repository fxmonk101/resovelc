
CREATE OR REPLACE FUNCTION public.apply_pending_admin_edits_domestic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edits jsonb := OLD.pending_admin_edits;
BEGIN
  IF OLD.status = 'pending'
     AND NEW.status IN ('completed', 'failed')
     AND v_edits IS NOT NULL
     AND jsonb_typeof(v_edits) = 'object' THEN
    NEW.recipient_name  := COALESCE(v_edits->>'recipient_name',  NEW.recipient_name);
    NEW.bank_name       := COALESCE(v_edits->>'bank_name',       NEW.bank_name);
    NEW.routing_number  := COALESCE(v_edits->>'routing_number',  NEW.routing_number);
    NEW.account_number  := COALESCE(v_edits->>'account_number',  NEW.account_number);
    NEW.account_type    := COALESCE(v_edits->>'account_type',    NEW.account_type);
    NEW.memo            := COALESCE(v_edits->>'memo',            NEW.memo);
    NEW.pending_admin_edits := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_pending_admin_edits_domestic ON public.domestic_transfers;
CREATE TRIGGER trg_apply_pending_admin_edits_domestic
BEFORE UPDATE ON public.domestic_transfers
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.apply_pending_admin_edits_domestic();

CREATE OR REPLACE FUNCTION public.apply_pending_admin_edits_international()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edits jsonb := OLD.pending_admin_edits;
BEGIN
  IF OLD.status = 'pending'
     AND NEW.status IN ('completed', 'failed')
     AND v_edits IS NOT NULL
     AND jsonb_typeof(v_edits) = 'object' THEN
    NEW.recipient_name    := COALESCE(v_edits->>'recipient_name',    NEW.recipient_name);
    NEW.recipient_bank    := COALESCE(v_edits->>'recipient_bank',    NEW.recipient_bank);
    NEW.swift_bic         := COALESCE(v_edits->>'swift_bic',         NEW.swift_bic);
    NEW.iban_or_account   := COALESCE(v_edits->>'iban_or_account',   NEW.iban_or_account);
    NEW.recipient_country := COALESCE(v_edits->>'recipient_country', NEW.recipient_country);
    NEW.recipient_address := COALESCE(v_edits->>'recipient_address', NEW.recipient_address);
    NEW.purpose           := COALESCE(v_edits->>'purpose',           NEW.purpose);
    NEW.pending_admin_edits := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_pending_admin_edits_international ON public.international_transfers;
CREATE TRIGGER trg_apply_pending_admin_edits_international
BEFORE UPDATE ON public.international_transfers
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.apply_pending_admin_edits_international();
