-- Godwitly accounts, foundation (spec #56 v5, ticket #58 / T1, ADR-0009).
-- FOR THE "godwitly-accounts" SUPABASE PROJECT ONLY. Never apply this to the "godwitly"
-- project (the form and the Sign-up dashboard). It lives in supabase/accounts/ for that reason.
--
-- What it creates:
--   1. private tables: the Crash course definitions loaded from courses/claude-beginners.js
--      (courses, Lessons, checklist items), one account-state row per Godwitly account (notice
--      version and server time at creation, last_used_at) and the sign-in records.
--   2. Record sign-in, and public_manifest (the public part of the manifest, spec #56).
--   3. No client role can write any table: nothing is granted to anon or authenticated, the
--      tables are in a schema the Data API does not expose, and row-level security is on.
-- Enrolment, ticks, deletion and the Course report come in later tickets.
--
-- The notice version below is a DRAFT marker: the privacy page wording is not approved.
-- Replace it (a new migration) when the PO approves the wording.

set lock_timeout = '5s';
set statement_timeout = '15s';

-- 1. A schema the Data API does not expose.

create schema if not exists private;
revoke all on schema private from public;

-- 2. Crash course definitions (loaded from the manifest; each manifest change is its own
--    migration). Composite keys stop Lessons and items crossing Crash courses.

create table private.crash_courses (
  id    text primary key check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  test  boolean not null default false
);

create table private.lessons (
  course_id  text     not null references private.crash_courses (id),
  number     integer  not null check (number > 0),
  title_key  text     not null,
  summary    text     not null,
  preview    boolean  not null,
  required   boolean  not null,
  released   boolean  not null,
  primary key (course_id, number)
);

create table private.checklist_items (
  course_id      text     not null,
  lesson_number  integer  not null,
  id             text     not null check (id ~ '^[a-z0-9][a-z0-9-]*$'),
  required       boolean  not null,
  retired        boolean  not null default false,
  primary key (course_id, lesson_number, id),
  foreign key (course_id, lesson_number) references private.lessons (course_id, number)
);

comment on table private.checklist_items is
  'A retired item stays here, is never tickable and never counts. An id is never reused.';

-- 3. One row per Godwitly account: the privacy notice it saw and when (server time), and
--    the private last_used_at. Removed with the Auth user.

create table private.account_state (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  notice_version       text        not null,
  notice_accepted_at   timestamptz not null default now(),
  last_used_at         timestamptz not null default now()
);

-- Sessions already counted as a sign-in. A Google sign-in makes a new session; a token
-- refresh keeps the same session id, so it can never qualify twice.
create table private.recorded_sign_ins (
  session_id   uuid primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  recorded_at  timestamptz not null default now()
);

alter table private.crash_courses       enable row level security;
alter table private.lessons             enable row level security;
alter table private.checklist_items     enable row level security;
alter table private.account_state       enable row level security;
alter table private.recorded_sign_ins   enable row level security;

-- No policy and no grant: no client role reads or writes these tables directly.
revoke all on private.crash_courses, private.lessons, private.checklist_items,
              private.account_state, private.recorded_sign_ins
  from public, anon, authenticated;

-- 4. The notice version a new account records. DRAFT marker until the PO approves the wording.

create or replace function private.current_notice_version()
returns text
language sql
immutable
set search_path = ''
as $$ select 'draft-1'::text; $$;

-- A new Auth user (a first Google sign-in) gets its account-state row, with the notice
-- version and the server time. Signing in enrols in nothing.
create or replace function private.on_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.account_state (user_id, notice_version)
  values (new.id, private.current_notice_version());
  return new;
end;
$$;

revoke execute on function private.on_user_created() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.on_user_created();

-- 5. True only for a live Google OAuth session that is not anonymous (the same test as the
--    Sign-up dashboard, ADR-0005).
create or replace function private.is_google_oauth_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (c.claims -> 'app_metadata' ->> 'provider') = 'google'
    and coalesce((c.claims ->> 'is_anonymous')::boolean, false) = false
    and exists (
      select 1
        from jsonb_array_elements(
               case when jsonb_typeof(c.claims -> 'amr') = 'array' then c.claims -> 'amr' else '[]'::jsonb end
             ) as amr(entry)
       where (amr.entry ->> 'method') = 'oauth'
    ),
    false)
  from (select auth.jwt() as claims) as c;
$$;

revoke execute on function private.is_google_oauth_session() from public, anon;
grant execute on function private.is_google_oauth_session() to authenticated;

-- 6. Record sign-in (spec #56, "Functions the site calls"). The account and session ids come
--    from the verified token only, never from the request, and must match one row of
--    auth.sessions. Under a per-account lock it counts a Google sign-in once: the session
--    must be created within the last 10 minutes and not recorded before. It then moves
--    last_used_at forward with server time, at most once per account per day.
--    Returns 'recorded' or 'ignored'; a repeat, an older session or a non-Google method
--    changes nothing.
create or replace function private.record_sign_in()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller    uuid := auth.uid();
  claims    jsonb := auth.jwt();
  session_uuid uuid;
  inserted  integer;
begin
  if caller is null or not private.is_google_oauth_session() then
    return 'ignored';
  end if;

  begin
    session_uuid := (claims ->> 'session_id')::uuid;
  exception when others then
    return 'ignored';
  end;
  if session_uuid is null then
    return 'ignored';
  end if;

  -- One account at a time: this lock is also taken by every later action that touches
  -- last_used_at, and by account deletion.
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));

  -- The session must exist for this account (so it is live) and be recent.
  if not exists (
    select 1 from auth.sessions as s
     where s.id = session_uuid
       and s.user_id = caller
       and s.created_at > now() - interval '10 minutes'
  ) then
    return 'ignored';
  end if;

  insert into private.recorded_sign_ins (session_id, user_id)
  values (session_uuid, caller)
  on conflict (session_id) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    return 'ignored';
  end if;

  update private.account_state as a
     set last_used_at = now()
   where a.user_id = caller
     and a.last_used_at < now() - interval '1 day';

  return 'recorded';
end;
$$;

revoke execute on function private.record_sign_in() from public, anon;
grant execute on function private.record_sign_in() to authenticated;

-- 7. The public part of the manifest (spec #56): for released Lessons the number, title key,
--    summary, the three flags and the current items' ids with their required flags; for
--    coming-soon Lessons the number and title key only. Test Crash courses and retired
--    items are never included.
create or replace function private.public_manifest()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'lessons', (
        select coalesce(jsonb_agg(
          case when l.released then
            jsonb_build_object(
              'number', l.number, 'titleKey', l.title_key, 'summary', l.summary,
              'preview', l.preview, 'required', l.required, 'released', l.released,
              'items', (
                select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'required', i.required) order by i.id), '[]'::jsonb)
                  from private.checklist_items as i
                 where i.course_id = l.course_id and i.lesson_number = l.number and not i.retired
              ))
          else
            jsonb_build_object('number', l.number, 'titleKey', l.title_key)
          end
          order by l.number), '[]'::jsonb)
          from private.lessons as l
         where l.course_id = c.id
      )
    ) order by c.id), '[]'::jsonb)
  from private.crash_courses as c
 where not c.test;
$$;

revoke execute on function private.public_manifest() from public;
grant execute on function private.public_manifest() to anon, authenticated;

-- 8. The calls the site makes. Each runs as the caller (security invoker) and only calls its
--    private twin, so no security definer code sits in an exposed schema.
grant usage on schema private to anon, authenticated;

create or replace function public.record_sign_in()
returns text
language sql
set search_path = ''
as $$ select private.record_sign_in(); $$;

revoke execute on function public.record_sign_in() from public, anon;
grant execute on function public.record_sign_in() to authenticated;

create or replace function public.public_manifest()
returns jsonb
language sql
stable
set search_path = ''
as $$ select private.public_manifest(); $$;

revoke execute on function public.public_manifest() from public;
grant execute on function public.public_manifest() to anon, authenticated;

-- 9. The Crash course definitions, loaded from courses/claude-beginners.js. The test Crash
--    course is not loaded here (it comes with the ticket that tests the lock).

insert into private.crash_courses (id, test) values ('claude-beginners', false);

insert into private.lessons (course_id, number, title_key, summary, preview, required, released) values
  ('claude-beginners', 1, 'course.lesson1.title', 'تفهم يعني إيه Claude و Claude Code و Skills، وتعرف المصطلحات الأساسية.', true, true, true),
  ('claude-beginners', 2, 'course.lesson2.title', 'يبقى عندك حساب Claude Pro وتطبيق Claude Desktop، وتعرف تكلّمه كويس.', false, true, false),
  ('claude-beginners', 3, 'course.lesson3.title', 'تفتح مجلد، وتستخدم Plan mode، وتقرا قبل ما توافق.', false, true, false),
  ('claude-beginners', 4, 'course.lesson4.title', 'تبني صفحة لبيزنس وتحسّن تصميمها.', false, true, false),
  ('claude-beginners', 5, 'course.lesson5.title', 'تحفظ شغلك على GitHub بـ git.', false, true, false),
  ('claude-beginners', 6, 'course.lesson6.title', 'تكتب ملف قواعد المشروع وspec يقدر كلود يبني منه.', false, true, false),
  ('claude-beginners', 7, 'course.lesson7.title', 'تشغّل الباك إند بتاعك على Railway.', false, true, false),
  ('claude-beginners', 8, 'course.lesson8.title', 'تضيف لوحة تحكم بتسجيل دخول وتنبيهات بالإيميل.', false, true, false),
  ('claude-beginners', 9, 'course.lesson9.title', 'تتأكد بالدليل إن الشغل خلص فعلًا.', false, true, false);

insert into private.checklist_items (course_id, lesson_number, id, required, retired) values
  ('claude-beginners', 1, 'explain-claude-help', true, false),
  ('claude-beginners', 1, 'chat-vs-code', true, false),
  ('claude-beginners', 1, 'plan-mode', true, false),
  ('claude-beginners', 1, 'skill-example', true, false);
