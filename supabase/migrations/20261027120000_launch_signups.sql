-- "Get notified" sign-ups from the Godwitly landing page.
-- Visitors (the "anon" role, using the publishable key) may only ADD rows.
-- Nobody can read, change or delete rows with that key; the project owner
-- reads them in the Supabase dashboard.

create table public.launch_signups (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null check (full_name = btrim(full_name) and char_length(full_name) between 2 and 100),
  email       text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'
                                   and char_length(regexp_replace(phone, '[^0-9]', '', 'g')) between 7 and 15),
  job_title   text not null check (job_title = btrim(job_title) and char_length(job_title) between 2 and 100),
  message     text check (message is null or char_length(message) between 1 and 1000),
  language    text not null default 'en' check (language in ('en', 'ar')),
  consent     boolean not null check (consent)
);

comment on table public.launch_signups is 'Waitlist sign-ups from the Godwitly landing page contact form.';

alter table public.launch_signups enable row level security;

revoke all on public.launch_signups from anon, authenticated;
grant insert (full_name, email, phone, job_title, message, language, consent)
  on public.launch_signups to anon;

create policy "Visitors can sign up"
  on public.launch_signups
  for insert
  to anon
  with check (true); -- the CHECK rules on each column do the validation
