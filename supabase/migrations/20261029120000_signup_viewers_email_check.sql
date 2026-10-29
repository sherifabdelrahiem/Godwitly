-- Tighten the Sign-up viewer address rule (dashboard plan D2, found in the local test on
-- 2026-10-29: "Viewer@Example.com," was accepted and saved with the comma).
-- The address may not contain "," or ";" anywhere, and the part after "@" must be
-- dot-separated labels of a-z, 0-9 and "-", so typos such as "viewer@example.com," or
-- "viewer@example.com." are refused. Whitespace is listed (space, \t \n \r \f \v) instead of
-- \s, because \s depends on the database locale and differs from JavaScript's.
-- js/dashboard.js EMAIL_PATTERN uses the same rule.
-- No data, permissions, policies or functions change. A row that breaks the new rule makes
-- this migration fail, so remove any such row first.

set lock_timeout = '5s';
set statement_timeout = '15s';

alter table private.signup_viewers
  drop constraint signup_viewers_email_check,
  add constraint signup_viewers_email_check
    check (email = lower(btrim(email)) and char_length(email) <= 254
           and email ~ '^[^@ \t\n\r\f\v,;]+@[a-z0-9-]+(\.[a-z0-9-]+)+$');
