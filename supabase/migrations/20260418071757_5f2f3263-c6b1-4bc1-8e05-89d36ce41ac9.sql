
-- 1. Update the new-user role trigger so that the designated admin email becomes admin automatically
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF lower(NEW.email) = 'warrenharry01@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 2. If the admin email already exists, promote them now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'warrenharry01@gmail.com'
ON CONFLICT DO NOTHING;

-- 3. Secure RPC to list every user (admins only)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  username text,
  account_number text,
  balance numeric,
  is_verified boolean,
  created_at timestamptz,
  is_admin boolean,
  loan_count bigint,
  grant_count bigint,
  card_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.first_name,
    p.last_name,
    p.username,
    p.account_number,
    p.balance,
    p.is_verified,
    p.created_at,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'admin') AS is_admin,
    (SELECT COUNT(*) FROM public.loan_applications l WHERE l.user_id = p.user_id),
    (SELECT COUNT(*) FROM public.grant_applications g WHERE g.user_id = p.user_id),
    (SELECT COUNT(*) FROM public.credit_cards c WHERE c.user_id = p.user_id)
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- 4. Secure RPC to find a user by email (for admin add-admin form)
CREATE OR REPLACE FUNCTION public.admin_find_user_by_email(_email text)
RETURNS TABLE (user_id uuid, email text, first_name text, last_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT p.user_id, u.email::text, p.first_name, p.last_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE lower(u.email) = lower(_email)
  LIMIT 1;
END;
$$;
