-- Describe the table with the glossary term "Launch sign-up" (issue #7).
-- Metadata only: no data, permissions, policies or trigger change.

set lock_timeout = '5s';
set statement_timeout = '15s';

comment on table public.launch_signups is 'Launch sign-ups from the Godwitly landing page.';
