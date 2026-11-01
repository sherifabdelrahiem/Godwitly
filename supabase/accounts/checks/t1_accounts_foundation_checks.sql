-- SQL checks for supabase/accounts/migrations/20261101130000_accounts_foundation.sql
-- (ticket #58, spec #56 v5). Run in the godwitly-accounts project's SQL editor AFTER the PO has
-- approved applying the migration. NEVER in the "godwitly" project.
-- Everything runs in one transaction that is rolled back, so nothing is kept. Each check
-- raises an exception with its name if it fails; reaching the last line means all passed.

begin;

-- Two test accounts, one session each. The first session is recent, the second is old.
insert into auth.users (id, aud, role, email, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'check-a@example.invalid',
   '{"provider":"google","providers":["google"]}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'check-b@example.invalid',
   '{"provider":"google","providers":["google"]}', now(), now());

insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-0000000000a1', now(), now()),
  ('00000000-0000-0000-0000-0000000005b1', '00000000-0000-0000-0000-0000000000b1', now() - interval '1 hour', now());

do $$
begin
  -- C1: the account stores the notice version and server time at creation.
  if (select count(*) from private.account_state
       where user_id = '00000000-0000-0000-0000-0000000000a1'
         and notice_version = 'draft-1' and notice_accepted_at <= now()) <> 1 then
    raise exception 'C1 failed: account_state row missing or wrong';
  end if;
  -- C2: signing in enrols in nothing (there is no Enrolment table yet; nothing else was created).
  if (select count(*) from private.recorded_sign_ins) <> 0 then
    raise exception 'C2 failed: a sign-in was recorded before any call';
  end if;
end $$;

-- Helper: act as a signed-in account. claims are what the Auth server puts in the token.
create or replace function pg_temp.act_as(uid text, sid text, provider text, method text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', uid, 'role', 'authenticated', 'session_id', sid,
    'app_metadata', jsonb_build_object('provider', provider),
    'amr', jsonb_build_array(jsonb_build_object('method', method, 'timestamp', 0))
  )::text, true);
end $$;
grant execute on function pg_temp.act_as(text, text, text, text) to public;

-- C3: a recent Google OAuth session is counted once; a repeat (a refresh) changes nothing.
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000005a1', 'google', 'oauth');
do $$
declare first_call text; second_call text;
begin
  first_call := public.record_sign_in();
  second_call := public.record_sign_in();
  if first_call <> 'recorded' then raise exception 'C3 failed: first call gave %', first_call; end if;
  if second_call <> 'ignored' then raise exception 'C3 failed: repeat gave %', second_call; end if;
end $$;

-- C4: an older session (account B, one hour old) is not counted.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000005b1', 'google', 'oauth');
do $$ begin
  if public.record_sign_in() <> 'ignored' then raise exception 'C4 failed: an old session was counted'; end if;
end $$;

-- C5: a non-Google method or provider changes nothing.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000005a1', 'google', 'password');
do $$ begin
  if public.record_sign_in() <> 'ignored' then raise exception 'C5 failed: non-oauth was counted'; end if;
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000005a1', 'email', 'oauth');
do $$ begin
  if public.record_sign_in() <> 'ignored' then raise exception 'C5 failed: non-google provider was counted'; end if;
end $$;

-- C6: another account's session id in the token does not count (ids must match one auth.sessions row).
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000005a1', 'google', 'oauth');
do $$ begin
  if public.record_sign_in() <> 'ignored' then raise exception 'C6 failed: a mismatched session was counted'; end if;
end $$;

-- C7: no client role can write or read any table directly (valid session).
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000005a1', 'google', 'oauth');
do $$
declare t text;
begin
  foreach t in array array['crash_courses','lessons','checklist_items','account_state','recorded_sign_ins'] loop
    begin
      execute format('insert into private.%I select * from private.%I limit 0', t, t);
      raise exception 'C7 failed: authenticated could write private.%', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('select 1 from private.%I limit 1', t);
      raise exception 'C7 failed: authenticated could read private.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

-- C8: anon (no token) cannot record a sign-in or write, but can read the public manifest only.
reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$
declare m jsonb;
begin
  begin
    perform public.record_sign_in();
    raise exception 'C8 failed: anon could call record_sign_in';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from private.lessons;
    raise exception 'C8 failed: anon could delete lessons';
  exception when insufficient_privilege then null;
  end;
  m := public.public_manifest();
  if jsonb_array_length(m) <> 1 then raise exception 'C8 failed: expected one public Crash course'; end if;
  -- Coming-soon Lessons carry only their number and title key; released ones carry the items.
  if (m -> 0 -> 'lessons' -> 1) <> '{"number":2,"titleKey":"course.lesson2.title"}'::jsonb then
    raise exception 'C8 failed: a coming-soon Lesson shows more than its number and title key';
  end if;
  if jsonb_array_length(m -> 0 -> 'lessons' -> 0 -> 'items') <> 4 then
    raise exception 'C8 failed: Lesson 1 should list 4 items';
  end if;
end $$;

-- C9: a revoked or missing session is refused by Record sign-in (account A's session removed).
reset role;
delete from auth.sessions where id = '00000000-0000-0000-0000-0000000005a1';
delete from private.recorded_sign_ins;
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000005a1', 'google', 'oauth');
do $$ begin
  if public.record_sign_in() <> 'ignored' then raise exception 'C9 failed: a revoked session was counted'; end if;
end $$;

reset role;
select 'all T1 SQL checks passed' as result;
rollback;
