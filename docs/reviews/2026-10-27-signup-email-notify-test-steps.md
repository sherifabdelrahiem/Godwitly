# Manual test steps — sign-up email alerts

Run these checks only after the project owner approves the deploy and database
changes. The examples contain no real secret or recipient address. Do not paste a
secret into a command, save it in shell history, or put it in this file.

## AC2 — Edge Function request checks

These commands make remote requests. Run them only in the approved test window.

Missing secret; expect HTTP `401` and no email:

```sh
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"id":"00000000-0000-4000-8000-000000000001","created_at":"2026-10-27T12:00:00Z"}' \
  'https://ijpvbxglhxktnkabjdif.supabase.co/functions/v1/notify-signup'
```

Wrong secret; expect HTTP `401` and no email:

```sh
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'x-webhook-secret: deliberately-wrong-value' \
  --data '{"id":"00000000-0000-4000-8000-000000000001","created_at":"2026-10-27T12:00:00Z"}' \
  'https://ijpvbxglhxktnkabjdif.supabase.co/functions/v1/notify-signup'
```

Wrong method; expect HTTP `405` and no email:

```sh
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  'https://ijpvbxglhxktnkabjdif.supabase.co/functions/v1/notify-signup'
```

Bad body needs the matching secret to get past authentication. Keep the secret on the
clipboard after setup. This command passes it to curl through standard input, not a
command argument, and does not print it. Expect HTTP `400` and no email, then clear
the clipboard:

```sh
{ printf 'header = "Content-Type: application/json"\n'; printf 'header = "x-webhook-secret: %s"\n' "$(pbpaste)"; } | \
  curl --config - --silent --show-error --output /dev/null --write-out '%{http_code}\n' \
  --request POST --data '{"id":"not-a-uuid","created_at":"not-a-date"}' \
  'https://ijpvbxglhxktnkabjdif.supabase.co/functions/v1/notify-signup'
pbcopy < /dev/null
```

## AC3 — an alert-path failure never aborts the insert

Run each probe as `postgres` in Dashboard → SQL Editor. Each probe rolls back all of
its changes. Use synthetic values only.

### AC3(a) — missing Vault secret

First confirm that `postgres` may delete the Vault row. Expect `true`:

```sql
select has_table_privilege('postgres', 'vault.secrets', 'DELETE');
```

Then run the probe:

```sql
begin;

delete from vault.secrets
where name = 'notify_signup_webhook_secret'
returning id;

insert into public.launch_signups (
  full_name, email, phone, job_title, message, language, consent
) values (
  'Test Person', 'probe@example.invalid', '+201000000000',
  'Test Role', null, 'en', true
)
returning id, created_at;

select id, created_at
from public.launch_signups
where email = 'probe@example.invalid';

rollback;
```

The insert and select must return the same row. In Dashboard → Logs → Postgres, find
a `notify-signup skipped` WARNING for the probe window. Do not expect the SQL editor
result pane to show that warning. Confirm afterward that no probe row remains.

### AC3(b) — enqueue throws

This is the production function body copied from the migration with only the
`net.http_post` call replaced by `raise exception 'probe';`:

```sql
begin;

create or replace function public.notify_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_secret text;
  request_id bigint;
begin
  begin
    select decrypted_secret
      into webhook_secret
      from vault.decrypted_secrets
      where name = 'notify_signup_webhook_secret'
      limit 1;

    if webhook_secret is null or btrim(webhook_secret) = '' then
      raise exception 'notify-signup webhook secret is missing';
    end if;

    raise exception 'probe';

    raise log 'notify-signup queued: request %, row %', request_id, new.id;
  exception when others then
    raise warning 'notify-signup skipped: %', sqlstate;
  end;

  return new;
end;
$$;

insert into public.launch_signups (
  full_name, email, phone, job_title, message, language, consent
) values (
  'Test Person', 'probe@example.invalid', '+201000000000',
  'Test Role', null, 'en', true
)
returning id, created_at;

select id, created_at
from public.launch_signups
where email = 'probe@example.invalid';

rollback;
```

The insert and select must return the same row. In Dashboard → Logs → Postgres, find
a `notify-signup skipped` WARNING for the probe window. Confirm afterward that the
function definition is restored and no probe row remains.

## AC4 — Resend rejects the send

In Dashboard → Edge Functions → Secrets, temporarily replace `RESEND_API_KEY` with an
invalid value. Insert one synthetic row in Dashboard → SQL Editor, note its returned
UUID, and confirm the insert commits:

```sql
insert into public.launch_signups (
  full_name, email, phone, job_title, message, language, consent
) values (
  'Test Person', 'resend-probe@example.invalid', '+201000000000',
  'Test Role', null, 'en', true
)
returning id, created_at;
```

Then run these two correlated checks. First find the HTTP `502` and note its numeric
request ID:

```sql
select id, status_code, error_msg, created
from net._http_response
where status_code = 502
order by created desc;
```

Then search Dashboard → Logs → Postgres for
`notify-signup queued: request <request-id>` and confirm that log line has the UUID
returned by the insert. Restore the correct `RESEND_API_KEY` first, then repeat AC1.

## AC5 — duplicate delivery within 24 hours

1. Open Dashboard → Edge Functions → `notify-signup` → Test.
2. Choose POST and add `x-webhook-secret` with the matching value from the clipboard.
3. Use body
   `{"id":"00000000-0000-4000-8000-000000000002","created_at":"2026-10-27T12:00:00Z"}`.
4. Send the identical request twice within 24 hours. Expect HTTP `200` both times but
   exactly one email, because both calls use the same Resend idempotency key.
5. Clear the clipboard with `pbcopy < /dev/null`.

## AC6 — trigger-function privileges

Run in Dashboard → SQL Editor. Expect `false` for every row:

```sql
select role_name,
       has_function_privilege(role_name, 'public.notify_signup()', 'EXECUTE') as can_execute
from (values ('anon'), ('authenticated')) as roles(role_name);
```

## AC7 — no committed secret or recipient address

Set the two placeholders below to short fragments from the real values; never paste
either complete value into the terminal. Run from the repository root. Every command
must produce no output. The first pair checks the working tree and the second pair
checks every revision reachable from the branch.

```sh
git grep --fixed-strings 'SECRET_FRAGMENT' -- . ':(exclude)docs/reviews/2026-10-27-signup-email-notify-test-steps.md'
git grep --fixed-strings 'RECIPIENT_FRAGMENT' -- . ':(exclude)docs/reviews/2026-10-27-signup-email-notify-test-steps.md'
git log --all --format='%H' | xargs git grep --fixed-strings 'SECRET_FRAGMENT'
git log --all --format='%H' | xargs git grep --fixed-strings 'RECIPIENT_FRAGMENT'
```

Also inspect Dashboard → Edge Functions → `notify-signup` → Logs for the test window.
For AC8, confirm logs show only row IDs, outcomes and HTTP statuses, with no request
or response bodies.

## Clean up

After all checks, replace the two UUID placeholders below with the UUIDs returned by
the AC1 English and Arabic form submissions. Run the delete in Dashboard → SQL Editor.
It also removes any committed AC3 or AC4 probe rows if a probe was interrupted before
its rollback or cleanup:

```sql
delete from public.launch_signups
where email in ('probe@example.invalid', 'resend-probe@example.invalid')
   or id in (
     '<AC1-EN-RETURNED-UUID>'::uuid,
     '<AC1-AR-RETURNED-UUID>'::uuid
   );

select id, email
from public.launch_signups
where email in ('probe@example.invalid', 'resend-probe@example.invalid')
   or id in (
     '<AC1-EN-RETURNED-UUID>'::uuid,
     '<AC1-AR-RETURNED-UUID>'::uuid
   );
```

The final `select` must return no rows.
