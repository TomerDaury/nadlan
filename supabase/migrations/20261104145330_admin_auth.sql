-- Agent authorization (PRD F7, ARCHITECTURE §2.7).

-- Allowed agent emails. Filled manually per environment (SQL Editor).
create table public.admin_users (
  email text primary key check (email = lower(email))
);

-- RLS on with no policies: no browser access at all.
alter table public.admin_users enable row level security;

-- True when the signed-in user's email is in admin_users.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Auth Hook "Before User Created": reject sign-up of any email not in admin_users.
-- Enabled manually in Supabase Dashboard → Authentication → Hooks.
create function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  user_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
begin
  if exists (select 1 from public.admin_users where email = user_email) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'אין לך הרשאת גישה לממשק הניהול'
    )
  );
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant select on table public.admin_users to supabase_auth_admin;

-- The auth service reads admin_users through RLS as well; allow only that role.
create policy "auth admin reads admin_users"
  on public.admin_users
  as permissive
  for select
  to supabase_auth_admin
  using (true);
