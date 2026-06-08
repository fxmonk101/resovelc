-- Enhanced trigger functions that apply pending admin edits to transfers AND sync to master bank details
-- When a transfer transitions to Completed or Failed, this trigger:
-- 1. Applies pending_admin_edits to the transfer record itself
-- 2. Syncs the updated account/routing/IBAN/SWIFT fields to admin_user_bank_details

CREATE OR REPLACE FUNCTION public.apply_pending_admin_edits_domestic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_edits jsonb := OLD.pending_admin_edits;
  v_user_id uuid := NEW.user_id;
BEGIN
  IF OLD.status = 'pending'
     AND NEW.status IN ('completed', 'failed')
     AND v_edits IS NOT NULL
     AND jsonb_typeof(v_edits) = 'object' THEN
    -- Apply edits to transfer fields
    NEW.recipient_name  := COALESCE(v_edits->>'recipient_name',  NEW.recipient_name);
    NEW.bank_name       := COALESCE(v_edits->>'bank_name',       NEW.bank_name);
    NEW.routing_number  := COALESCE(v_edits->>'routing_number',  NEW.routing_number);
    NEW.account_number  := COALESCE(v_edits->>'account_number',  NEW.account_number);
    NEW.account_type    := COALESCE(v_edits->>'account_type',    NEW.account_type);
    NEW.memo            := COALESCE(v_edits->>'memo',            NEW.memo);
    NEW.pending_admin_edits := NULL;
    
    -- Sync the applied edits to the user's master bank details record
    INSERT INTO public.admin_user_bank_details (
      user_id, bank_name, account_holder, account_number, routing_number, account_type
    )
    VALUES (
      v_user_id,
      COALESCE(v_edits->>'bank_name', NEW.bank_name),
      COALESCE(v_edits->>'recipient_name', NEW.recipient_name),
      COALESCE(v_edits->>'account_number', NEW.account_number),
      COALESCE(v_edits->>'routing_number', NEW.routing_number),
      COALESCE(v_edits->>'account_type', NEW.account_type)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      bank_name = COALESCE(v_edits->>'bank_name', excluded.bank_name),
      account_holder = COALESCE(v_edits->>'recipient_name', excluded.account_holder),
      account_number = COALESCE(v_edits->>'account_number', excluded.account_number),
      routing_number = COALESCE(v_edits->>'routing_number', excluded.routing_number),
      account_type = COALESCE(v_edits->>'account_type', excluded.account_type),
      updated_at = now();
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
  v_user_id uuid := NEW.user_id;
BEGIN
  IF OLD.status = 'pending'
     AND NEW.status IN ('completed', 'failed')
     AND v_edits IS NOT NULL
     AND jsonb_typeof(v_edits) = 'object' THEN
    -- Apply edits to transfer fields
    NEW.recipient_name    := COALESCE(v_edits->>'recipient_name',    NEW.recipient_name);
    NEW.recipient_bank    := COALESCE(v_edits->>'recipient_bank',    NEW.recipient_bank);
    NEW.swift_bic         := COALESCE(v_edits->>'swift_bic',         NEW.swift_bic);
    NEW.iban_or_account   := COALESCE(v_edits->>'iban_or_account',   NEW.iban_or_account);
    NEW.recipient_country := COALESCE(v_edits->>'recipient_country', NEW.recipient_country);
    NEW.recipient_address := COALESCE(v_edits->>'recipient_address', NEW.recipient_address);
    NEW.purpose           := COALESCE(v_edits->>'purpose',           NEW.purpose);
    NEW.pending_admin_edits := NULL;
    
    -- Sync the applied edits to the user's master bank details record
    INSERT INTO public.admin_user_bank_details (
      user_id, swift_bic, iban, bank_address, bank_country
    )
    VALUES (
      v_user_id,
      COALESCE(v_edits->>'swift_bic', NEW.swift_bic),
      COALESCE(v_edits->>'iban_or_account', NEW.iban_or_account),
      COALESCE(v_edits->>'recipient_address', NEW.recipient_address),
      COALESCE(v_edits->>'recipient_country', NEW.recipient_country)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      swift_bic = COALESCE(v_edits->>'swift_bic', excluded.swift_bic),
      iban = COALESCE(v_edits->>'iban_or_account', excluded.iban),
      bank_address = COALESCE(v_edits->>'recipient_address', excluded.bank_address),
      bank_country = COALESCE(v_edits->>'recipient_country', excluded.bank_country),
      updated_at = now();
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
