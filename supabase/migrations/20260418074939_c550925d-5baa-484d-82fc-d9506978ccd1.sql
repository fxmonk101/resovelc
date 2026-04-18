-- Auto-create profile + role on user signup using metadata from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _first text;
  _last text;
  _username text;
  _phone text;
  _country text;
  _account_type text;
BEGIN
  _first := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
  _last := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  _username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || substr(NEW.id::text,1,4));
  _phone := NEW.raw_user_meta_data->>'phone';
  _country := NEW.raw_user_meta_data->>'country';
  _account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'Checking Account');

  -- Ensure unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username)) LOOP
    _username := _username || floor(random()*1000)::int::text;
  END LOOP;

  INSERT INTO public.profiles (user_id, first_name, last_name, username, phone, country, account_type)
  VALUES (NEW.id, _first, _last, _username, _phone, _country, _account_type)
  ON CONFLICT DO NOTHING;

  -- Assign role
  IF lower(NEW.email) = 'warrenharry01@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop old single-purpose role-only trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Backfill profiles for any existing auth.users that have no profile (idempotent)
INSERT INTO public.profiles (user_id, first_name, last_name, username)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.email,'@',1)),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email,'@',1) || substr(u.id::text,1,6))
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT DO NOTHING;

-- Backfill roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
  CASE WHEN lower(u.email) = 'warrenharry01@gmail.com' THEN 'admin'::app_role ELSE 'user'::app_role END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT DO NOTHING;