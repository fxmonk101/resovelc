ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
  CHECK (type = ANY (ARRAY['credit','debit','transfer','admin_credit','admin_debit','domestic_transfer','international_transfer','card_payment','card_charge']));