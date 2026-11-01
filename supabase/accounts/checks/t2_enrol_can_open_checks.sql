-- SQL checks for supabase/accounts/migrations/20261101180000_enrol_and_can_open.sql
-- (ticket #59, spec #56 v5). Run in the godwitly-accounts project's SQL editor (or with the
-- Supabase MCP execute_sql) AFTER the PO has approved applying the migration. NEVER in the
-- "godwitly" project. One transaction, rolled back, so nothing is kept. Each check raises an
-- exception with its name if it fails; reaching the last line means all passed.

begin;

insert into auth.users (id, aud, role, email, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'check-a@example.invalid', '{"provider":"google","providers":["google"]}', now(), now()),
  ('00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'check-b@example.invalid', '{"provider":"google","providers":["google"]}', now(), now());
insert into auth.sessions (id, user_id, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000005a2', '00000000-0000-0000-0000-0000000000a2', now(), now()),
  ('00000000-0000-0000-0000-0000000005b2', '00000000-0000-0000-0000-0000000000b2', now(), now());

-- A Crash course with no released Lesson, to prove Enrol refuses it.
insert into private.crash_courses (id, test) values ('check-unreleased', false);
insert into private.lessons (course_id, number, title_key, summary, preview, required, released)
values ('check-unreleased', 1, 'x', 'x', false, true, false);

-- Account B is on the test Crash course's test list; account A is not.
insert into private.test_course_testers (course_id, user_id)
values ('test-course', '00000000-0000-0000-0000-0000000000b2');

create or replace function pg_temp.act_as(uid text, sid text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', uid, 'role', 'authenticated', 'session_id', sid,
    'app_metadata', jsonb_build_object('provider', 'google'),
    'amr', jsonb_build_array(jsonb_build_object('method', 'oauth', 'timestamp', 0))
  )::text, true);
end $$;
grant execute on function pg_temp.act_as(text, text) to public;

set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000005a2');

do $$
declare r text;
begin
  -- E1: Enrol is refused for a Crash course with no released Lesson, an unknown one, and a test
  -- Crash course the caller is not on the test list of.
  if public.enrol('check-unreleased') <> 'refused' then raise exception 'E1 failed: unreleased Crash course'; end if;
  if public.enrol('no-such-course') <> 'refused' then raise exception 'E1 failed: unknown Crash course'; end if;
  if public.enrol('test-course') <> 'refused' then raise exception 'E1 failed: test Crash course for a non-tester'; end if;

  -- E2: signing in alone enrolled nobody; Enrol is idempotent: first 'enrolled', then 'already'.
  if public.can_open('claude-beginners', 1) <> 'open' then raise exception 'E2 failed: Preview Lesson should open for a live session'; end if;
  if public.enrol('claude-beginners') <> 'enrolled' then raise exception 'E2 failed: first enrol'; end if;
  if public.enrol('claude-beginners') <> 'already' then raise exception 'E2 failed: second enrol should change nothing'; end if;

  -- E3: Can-open for a Lesson needing Enrolment: Lesson 2 of claude-beginners is not released.
  if public.can_open('claude-beginners', 2) <> 'locked' then raise exception 'E3 failed: unreleased Lesson opened'; end if;
  -- A wrong pairing or unknown Lesson is locked.
  if public.can_open('test-course', 99) <> 'locked' then raise exception 'E3 failed: unknown Lesson opened'; end if;
  if public.can_open('claude-beginners', 1) <> 'open' then raise exception 'E3 failed: Preview Lesson'; end if;
  -- Enrolled in claude-beginners gives nothing in the test Crash course.
  if public.can_open('test-course', 2) <> 'locked' then raise exception 'E3 failed: Enrolment in another Crash course opened the test Lesson'; end if;
end $$;

-- E4: the test-list account enrols in the test Crash course and then opens its protected Lesson.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000005b2');
do $$ begin
  if public.can_open('test-course', 2) <> 'locked' then raise exception 'E4 failed: opened before enrolling'; end if;
  if public.enrol('test-course') <> 'enrolled' then raise exception 'E4 failed: tester could not enrol'; end if;
  if public.can_open('test-course', 2) <> 'open' then raise exception 'E4 failed: Enrolled account could not open'; end if;
  if public.can_open('test-course', 1) <> 'open' then raise exception 'E4 failed: Preview Lesson'; end if;
end $$;

-- E5: another account's session id in the token locks everything (ids must match auth.sessions).
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000005a2');
do $$ begin
  if public.can_open('test-course', 2) <> 'locked' then raise exception 'E5 failed: mismatched session opened'; end if;
  if public.can_open('test-course', 1) <> 'locked' then raise exception 'E5 failed: mismatched session opened a Preview Lesson'; end if;
  if public.enrol('claude-beginners') <> 'no-session' then raise exception 'E5 failed: mismatched session enrolled'; end if;
end $$;

-- E6: a revoked session (removed from auth.sessions) locks an Enrolled account.
reset role;
delete from auth.sessions where id = '00000000-0000-0000-0000-0000000005b2';
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000005b2');
do $$ begin
  if public.can_open('test-course', 2) <> 'locked' then raise exception 'E6 failed: revoked session opened'; end if;
  if public.enrol('claude-beginners') <> 'no-session' then raise exception 'E6 failed: revoked session enrolled'; end if;
end $$;

-- E7: no client role reads or writes Enrolments or the test list directly.
do $$
declare t text;
begin
  foreach t in array array['enrolments','test_course_testers'] loop
    begin
      execute format('insert into private.%I select * from private.%I limit 0', t, t);
      raise exception 'E7 failed: authenticated could write private.%', t;
    exception when insufficient_privilege then null;
    end;
    begin
      execute format('select 1 from private.%I limit 1', t);
      raise exception 'E7 failed: authenticated could read private.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

-- E8: anon cannot call Enrol or Can-open, and the test Crash course is not in the public manifest.
reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);
do $$
begin
  begin
    perform public.enrol('claude-beginners');
    raise exception 'E8 failed: anon could call enrol';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.can_open('claude-beginners', 1);
    raise exception 'E8 failed: anon could call can_open';
  exception when insufficient_privilege then null;
  end;
  if (public.public_manifest()::text like '%test-course%') or (public.public_manifest()::text like '%test-locked-one%') then
    raise exception 'E8 failed: the test Crash course is public';
  end if;
end $$;

-- E9: deleting the Auth user removes its Enrolments and test-list rows (the later deletion ticket
-- relies on these cascades).
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-0000000000b2';
do $$ begin
  if exists (select 1 from private.enrolments where user_id = '00000000-0000-0000-0000-0000000000b2')
     or exists (select 1 from private.test_course_testers where user_id = '00000000-0000-0000-0000-0000000000b2') then
    raise exception 'E9 failed: records survived the account';
  end if;
end $$;

select 'all T2 SQL checks passed' as result;
rollback;
