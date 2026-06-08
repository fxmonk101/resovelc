
-- 1) Avatars: drop overly broad SELECT, scope to owner folder
DROP POLICY IF EXISTS "Avatar images viewable by authenticated" ON storage.objects;

CREATE POLICY "Users view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2) KYC: allow users to update/delete their own folder
CREATE POLICY "Users update own kyc docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'kyc' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own kyc docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'kyc' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) Notifications: restrict insert to admins only
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));
