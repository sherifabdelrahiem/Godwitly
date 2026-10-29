-- Sign-up dashboard: let the Project owner and the Sign-up viewers they choose read
-- Launch sign-ups after signing in with Google (docs/plans/2026-10-28-signup-dashboard.md,
-- ADR-0005).
-- - private.signup_viewers is the list of who may see Launch sign-ups. Only the
--   Project owner can change it, through the dashboard's Access section.
-- - A row-level security policy checks that list on every read of launch_signups, and
--   accepts only a session that came from a Google OAuth sign-in.
-- - The "Before User Created" Auth hook refuses anyone not on the list at first sign-in.
-- Launch sign-ups stay read-only on the dashboard: this migration gives authenticated
-- SELECT only and grants no INSERT, UPDATE or DELETE to anon or authenticated. Deleting
-- junk rows and the yearly clean-up stay in the Supabase dashboard.
-- The Project owner row is NOT inserted here, so no email address is ever in Git. The
-- PO adds it by hand in the SQL editor (runbook step 3 in the plan).

set lock_timeout = '5s';
set statement_timeout = '15s';

-- 1. A schema the Data API does not expose (api.schemas = public, graphql_public).

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

-- 2. Who may see Launch sign-ups. Emails are stored lower-case, exactly as Google
--    reports them. There is exactly one Project owner (the partial unique index).

create table private.signup_viewers (
  email     text primary key
            check (email = lower(btrim(email)) and char_length(email) <= 254
                   and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_owner  boolean not null default false,
  added_at  timestamptz not null default now()
);

create unique index signup_viewers_one_owner on private.signup_viewers (is_owner) where is_owner;

comment on table private.signup_viewers is
  'Sign-up viewers and the one Project owner allowed into the Sign-up dashboard.';

alter table private.signup_viewers enable row level security;

-- Nobody reads the list directly except the Auth hook. Signed-in people reach it only
-- through the private functions below, which run as the table owner.
revoke all on private.signup_viewers from public, anon, authenticated;
grant select on private.signup_viewers to supabase_auth_admin;

create policy "Auth hook can read the list"
  on private.signup_viewers
  for select
  to supabase_auth_admin
  using (true);

-- 3. Private helpers. They run as their owner (security definer), so each one uses an
--    empty search_path and fully qualified names.

-- The caller's email, lower-case, but only for a Google OAuth session that is not
-- anonymous. Anything else (no session, a password or one-time-code session, another
-- provider) gives null, which matches no row in the list.
create or replace function private.caller_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (c.claims -> 'app_metadata' ->> 'provider') = 'google'
     and coalesce((c.claims ->> 'is_anonymous')::boolean, false) = false
     and exists (
       select 1
         from jsonb_array_elements(
                case when jsonb_typeof(c.claims -> 'amr') = 'array'
                     then c.claims -> 'amr'
                     else '[]'::jsonb
                end
              ) as amr(entry)
        where (amr.entry ->> 'method') = 'oauth'
     )
    then lower(c.claims ->> 'email')
  end
  from (select auth.jwt() as claims) as c;
$$;

revoke execute on function private.caller_email() from public, anon;
grant execute on function private.caller_email() to authenticated;

-- True when the caller is on the list (a Sign-up viewer or the Project owner).
create or replace function private.is_signup_viewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from private.signup_viewers as v
     where v.email = private.caller_email()
  );
$$;

revoke execute on function private.is_signup_viewer() from public, anon;
grant execute on function private.is_signup_viewer() to authenticated;

-- True only for the Project owner.
create or replace function private.is_project_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from private.signup_viewers as v
     where v.email = private.caller_email()
       and v.is_owner
  );
$$;

revoke execute on function private.is_project_owner() from public, anon;
grant execute on function private.is_project_owner() to authenticated;

-- What the dashboard should show: 'owner', 'viewer' or 'none'.
create or replace function private.dashboard_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when private.is_project_owner() then 'owner'
    when private.is_signup_viewer() then 'viewer'
    else 'none'
  end;
$$;

revoke execute on function private.dashboard_role() from public, anon;
grant execute on function private.dashboard_role() to authenticated;

-- The Access list, newest first. Project owner only.
create or replace function private.list_signup_viewers()
returns table (email text, is_owner boolean, added_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_project_owner() then
    raise exception 'Only the Project owner can manage Sign-up viewers.'
      using errcode = '42501';
  end if;

  return query
    select v.email, v.is_owner, v.added_at
      from private.signup_viewers as v
     order by v.added_at desc, v.email;
end;
$$;

revoke execute on function private.list_signup_viewers() from public, anon;
grant execute on function private.list_signup_viewers() to authenticated;

-- Add a Sign-up viewer. Project owner only. Returns 'added', or 'exists' when the
-- address is already on the list. An invalid address fails the CHECK rule (23514).
-- It can never add a Project owner.
create or replace function private.add_signup_viewer(viewer_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  added_count integer;
begin
  if not private.is_project_owner() then
    raise exception 'Only the Project owner can manage Sign-up viewers.'
      using errcode = '42501';
  end if;

  -- A missing address becomes '', so it fails the CHECK rule like any invalid address.
  insert into private.signup_viewers (email, is_owner)
  values (lower(btrim(coalesce(viewer_email, ''))), false)
  on conflict (email) do nothing;

  get diagnostics added_count = row_count;

  if added_count = 1 then
    return 'added';
  end if;
  return 'exists';
end;
$$;

revoke execute on function private.add_signup_viewer(text) from public, anon;
grant execute on function private.add_signup_viewer(text) to authenticated;

-- Remove a Sign-up viewer. Project owner only. Returns 'removed', or 'not_found' when
-- the address is not on the list. The Project owner row is never removed.
create or replace function private.remove_signup_viewer(viewer_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed_count integer;
begin
  if not private.is_project_owner() then
    raise exception 'Only the Project owner can manage Sign-up viewers.'
      using errcode = '42501';
  end if;

  delete from private.signup_viewers as v
   where v.email = lower(btrim(viewer_email))
     and not v.is_owner;

  get diagnostics removed_count = row_count;

  if removed_count = 1 then
    return 'removed';
  end if;
  return 'not_found';
end;
$$;

revoke execute on function private.remove_signup_viewer(text) from public, anon;
grant execute on function private.remove_signup_viewer(text) to authenticated;

-- 4. The dashboard's RPC calls. Each one runs as the caller (security invoker) and only
--    calls its private twin, so no security definer code sits in an exposed schema.

create or replace function public.dashboard_role()
returns text
language sql
stable
set search_path = ''
as $$
  select private.dashboard_role();
$$;

revoke execute on function public.dashboard_role() from public, anon;
grant execute on function public.dashboard_role() to authenticated;

create or replace function public.list_signup_viewers()
returns table (email text, is_owner boolean, added_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select v.email, v.is_owner, v.added_at
    from private.list_signup_viewers() as v;
$$;

revoke execute on function public.list_signup_viewers() from public, anon;
grant execute on function public.list_signup_viewers() to authenticated;

create or replace function public.add_signup_viewer(viewer_email text)
returns text
language sql
set search_path = ''
as $$
  select private.add_signup_viewer(viewer_email);
$$;

revoke execute on function public.add_signup_viewer(text) from public, anon;
grant execute on function public.add_signup_viewer(text) to authenticated;

create or replace function public.remove_signup_viewer(viewer_email text)
returns text
language sql
set search_path = ''
as $$
  select private.remove_signup_viewer(viewer_email);
$$;

revoke execute on function public.remove_signup_viewer(text) from public, anon;
grant execute on function public.remove_signup_viewer(text) to authenticated;

-- 5. Sign-up viewers may read Launch sign-ups. Nothing else changes for anon or
--    authenticated: anon may still only insert, and authenticated gets SELECT only.

grant select on public.launch_signups to authenticated;

create policy "Sign-up viewers can read sign-ups"
  on public.launch_signups
  for select
  to authenticated
  using ((select private.is_signup_viewer()));

-- 6. Auth hook "Before User Created". Supabase Auth calls it as supabase_auth_admin
--    before it creates an account. It allows only a Google sign-in whose email is on the
--    list; anyone else is refused and no account is created. It is not security definer
--    (Supabase's advice): it reads the list through the grant and policy in step 2.
--    It lives in public so the dashboard's hook picker lists it; revoking EXECUTE keeps
--    it out of the Data API.

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if (event -> 'user' -> 'app_metadata' ->> 'provider') = 'google'
     and exists (
       select 1
         from private.signup_viewers as v
        where v.email = lower(event -> 'user' ->> 'email')
     ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'This Google account is not allowed.'
    )
  );
end;
$$;

revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
