ALTER TABLE public.credit_cards
  ADD COLUMN IF NOT EXISTS daily_limit numeric,
  ADD COLUMN IF NOT EXISTS is_virtual boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Users update own cards" ON public.credit_cards;
CREATE POLICY "Users update own cards"
ON public.credit_cards
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own cards" ON public.credit_cards;
CREATE POLICY "Users insert own cards"
ON public.credit_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);