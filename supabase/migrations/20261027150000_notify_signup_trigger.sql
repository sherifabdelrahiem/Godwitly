-- Best-effort owner alert after a "Get notified" sign-up.
-- The request contains only the row id and creation time, never visitor details.

create extension if not exists pg_net with schema extensions;

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

    select net.http_post(
      url := 'https://ijpvbxglhxktnkabjdif.supabase.co/functions/v1/notify-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', webhook_secret
      ),
      body := jsonb_build_object(
        'id', new.id,
        'created_at', new.created_at
      ),
      timeout_milliseconds := 5000
    ) into request_id;

    raise log 'notify-signup queued: request %, row %', request_id, new.id;
  exception when others then
    raise warning 'notify-signup skipped: %', sqlstate;
  end;

  return new;
end;
$$;

revoke execute on function public.notify_signup() from public, anon, authenticated;

create trigger notify_signup
after insert on public.launch_signups
for each row
execute function public.notify_signup();
