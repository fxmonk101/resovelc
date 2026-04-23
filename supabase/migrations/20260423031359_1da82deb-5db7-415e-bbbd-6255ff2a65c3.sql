create or replace function public.get_email_for_username(_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where p.username = _username
  limit 1;
$$;

grant execute on function public.get_email_for_username(text) to anon, authenticated;