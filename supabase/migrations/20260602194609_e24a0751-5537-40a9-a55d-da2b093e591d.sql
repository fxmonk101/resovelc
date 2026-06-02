
-- 1. credit_cards: remove user self-insert/update
DROP POLICY IF EXISTS "Users insert own cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Users update own cards" ON public.credit_cards;

-- 2. contact_messages: admins can read
CREATE POLICY "Admins read contact messages"
ON public.contact_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. domestic_transfers: explicit user insert (matches international_transfers)
CREATE POLICY "Users create their domestic transfers"
ON public.domestic_transfers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Email queue helpers: set search_path and lock down execute
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 5. Avatars bucket: restrict listing to authenticated users (file URLs still public)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images viewable by authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
