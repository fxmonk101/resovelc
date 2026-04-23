ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_type_check
CHECK (
  type = ANY (
    ARRAY[
      'credit'::text,
      'debit'::text,
      'transfer'::text,
      'admin_credit'::text,
      'admin_debit'::text,
      'international_transfer'::text,
      'card_payment'::text,
      'card_charge'::text
    ]
  )
);