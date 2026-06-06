
CREATE TABLE public.admin_user_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name text,
  account_holder text,
  account_number text,
  routing_number text,
  account_type text,
  swift_bic text,
  iban text,
  bank_address text,
  bank_country text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_user_bank_details TO authenticated;
GRANT ALL ON public.admin_user_bank_details TO service_role;

ALTER TABLE public.admin_user_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all bank details"
  ON public.admin_user_bank_details FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert bank details"
  ON public.admin_user_bank_details FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bank details"
  ON public.admin_user_bank_details FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bank details"
  ON public.admin_user_bank_details FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_user_bank_details_updated_at
  BEFORE UPDATE ON public.admin_user_bank_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
