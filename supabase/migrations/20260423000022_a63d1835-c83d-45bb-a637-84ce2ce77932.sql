
-- Trigger: KYC status change → notification
CREATE OR REPLACE FUNCTION public.notify_kyc_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.emit_notification(NEW.user_id,
        'Identity verified ✓',
        'Your KYC verification has been approved. You now have full access to all banking features.',
        'kyc', '/dashboard');
      UPDATE public.profiles SET is_verified = true WHERE user_id = NEW.user_id;
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.emit_notification(NEW.user_id,
        'Verification needs attention',
        COALESCE('Your KYC was not approved: ' || NEW.admin_notes, 'Please re-submit your verification documents.'),
        'kyc', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_kyc_status ON public.kyc_submissions;
CREATE TRIGGER trg_notify_kyc_status
AFTER UPDATE ON public.kyc_submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_kyc_status_change();

-- Trigger: profile is_verified flips → notification
CREATE OR REPLACE FUNCTION public.notify_profile_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_verified = true AND COALESCE(OLD.is_verified, false) = false THEN
    PERFORM public.emit_notification(NEW.user_id,
      'Account verified',
      'Your account has been verified. Welcome to Resolva Credix!',
      'account', '/dashboard');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_profile_verified ON public.profiles;
CREATE TRIGGER trg_notify_profile_verified
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_profile_verified();

-- Trigger: deposit/credit transaction (top-up) → notification (skip admin_credit which already notifies)
CREATE OR REPLACE FUNCTION public.notify_transaction_topup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.amount > 0 AND NEW.type NOT IN ('admin_credit', 'admin_debit') THEN
    PERFORM public.emit_notification(NEW.user_id,
      'Account topped up',
      'A deposit of $' || NEW.amount || ' has been recorded: ' || NEW.description,
      'transaction', '/dashboard');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_topup ON public.transactions;
CREATE TRIGGER trg_notify_topup
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_transaction_topup();
