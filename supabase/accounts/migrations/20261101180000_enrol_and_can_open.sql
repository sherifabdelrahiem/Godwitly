-- Godwitly accounts, Enrol and Can-open (spec #56 v5, ticket #59 / T2a, ADR-0009, ADR-0010).
-- FOR THE "godwitly-accounts" SUPABASE PROJECT ONLY. Never apply this to the "godwitly" project.
--
-- What it creates:
--   1. Enrolments (one per account and Crash course) and the test Crash course's test list.
--   2. private.session_is_live(): the token's session still exists for that account.
--   3. Enrol: authenticated, live session; refuses a Crash course with no released Lesson and a
--      test Crash course unless the caller is on its test list; idempotent.
--   4. Can-open (the gate only): 'open' only for a released Lesson of that Crash course, on a live
--      session, that is a Preview Lesson or whose Crash course the caller is Enrolled in.
--   5. The test Crash course, loaded from courses/test-course.js (dummy text; test = true, so it is
--      never in public_manifest).
-- No client role can write or read these tables directly. Ticks, deletion and the Course report
-- come in later tickets.

set lock_timeout = '5s';
set statement_timeout = '15s';

-- 1. Tables.

create table private.enrolments (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  course_id    text        not null references private.crash_courses (id),
  enrolled_at  timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- Who may enrol in a test Crash course. Rows are added by hand by the Project owner, never in Git.
create table private.test_course_testers (
  course_id  text not null references private.crash_courses (id),
  user_id    uuid not null references auth.users (id) on delete cascade,
  primary key (course_id, user_id)
);

alter table private.enrolments          enable row level security;
alter table private.test_course_testers enable row level security;
revoke all on private.enrolments, private.test_course_testers from public, anon, authenticated;

-- 2. The token's session still exists for the token's account.
create or replace function private.session_is_live()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller       uuid := auth.uid();
  session_uuid uuid;
begin
  if caller is null then
    return false;
  end if;
  begin
    session_uuid := (auth.jwt() ->> 'session_id')::uuid;
  exception when others then
    return false;
  end;
  if session_uuid is null then
    return false;
  end if;
  return exists (select 1 from auth.sessions as s where s.id = session_uuid and s.user_id = caller);
end;
$$;

revoke execute on function private.session_is_live() from public, anon;
grant execute on function private.session_is_live() to authenticated;

-- 3. Enrol. Returns 'enrolled', 'already', 'refused' or 'no-session'.
create or replace function private.enrol(p_course text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller   uuid := auth.uid();
  is_test  boolean;
  inserted integer;
begin
  if caller is null or not private.session_is_live() then
    return 'no-session';
  end if;

  -- One account at a time (the same lock as Record sign-in, Can-open and, later, deletion).
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));

  select c.test into is_test from private.crash_courses as c where c.id = p_course;
  if not found then
    return 'refused';
  end if;
  if not exists (select 1 from private.lessons as l where l.course_id = p_course and l.released) then
    return 'refused'; -- no released Lesson: not a released Crash course
  end if;
  if is_test and not exists (
    select 1 from private.test_course_testers as t where t.course_id = p_course and t.user_id = caller
  ) then
    return 'refused';
  end if;

  insert into private.enrolments (user_id, course_id) values (caller, p_course)
  on conflict (user_id, course_id) do nothing;
  get diagnostics inserted = row_count;

  -- Counts as use at most once a day, and only a real Enrolment or a repeat after a day.
  update private.account_state as a
     set last_used_at = now()
   where a.user_id = caller
     and a.last_used_at < now() - interval '1 day';

  return case when inserted = 1 then 'enrolled' else 'already' end;
end;
$$;

revoke execute on function private.enrol(text) from public, anon;
grant execute on function private.enrol(text) to authenticated;

-- 4. Can-open. Returns 'open' or 'locked'. The gate resolves the Crash course and Lesson from the
--    requested path and passes them in; nothing comes from a query parameter.
create or replace function private.can_open(p_course text, p_lesson integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller    uuid := auth.uid();
  is_preview boolean;
begin
  if caller is null or not private.session_is_live() then
    return 'locked';
  end if;

  select l.preview into is_preview
    from private.lessons as l
   where l.course_id = p_course and l.number = p_lesson and l.released;
  if not found then
    return 'locked';
  end if;

  -- A Preview Lesson or a refused request is not use of the account. Opening a Lesson the caller is
  -- Enrolled in moves last_used_at, at most once a day, under the same per-account lock.
  if is_preview then
    return 'open';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  if exists (select 1 from private.enrolments as e where e.user_id = caller and e.course_id = p_course) then
    update private.account_state as a
       set last_used_at = now()
     where a.user_id = caller
       and a.last_used_at < now() - interval '1 day';
    return 'open';
  end if;
  return 'locked';
end;
$$;

revoke execute on function private.can_open(text, integer) from public, anon;
grant execute on function private.can_open(text, integer) to authenticated;

-- The calls the site makes: invoker wrappers that only call their private twins.
create or replace function public.enrol(p_course text)
returns text
language sql
set search_path = ''
as $$ select private.enrol(p_course); $$;

revoke execute on function public.enrol(text) from public, anon;
grant execute on function public.enrol(text) to authenticated;

create or replace function public.can_open(p_course text, p_lesson integer)
returns text
language sql
set search_path = ''
as $$ select private.can_open(p_course, p_lesson); $$;

revoke execute on function public.can_open(text, integer) from public, anon;
grant execute on function public.can_open(text, integer) to authenticated;

-- 5. The test Crash course, from courses/test-course.js (dummy text only).
insert into private.crash_courses (id, test) values ('test-course', true);

insert into private.lessons (course_id, number, title_key, summary, preview, required, released) values
  ('test-course', 1, 'testcourse.lesson1.title', 'درس تجريبي مفتوح، نص للاختبار فقط.', true, true, true),
  ('test-course', 2, 'testcourse.lesson2.title', 'درس تجريبي يحتاج الالتحاق، نص للاختبار فقط.', false, true, true);

insert into private.checklist_items (course_id, lesson_number, id, required, retired) values
  ('test-course', 1, 'test-open-one', true, false),
  ('test-course', 1, 'test-open-two', false, false),
  ('test-course', 2, 'test-locked-one', true, false);
