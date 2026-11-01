/*
  Connection settings for Godwitly accounts on the Crash course pages (spec #56, ADR-0009).

  These two values come from the Supabase project "godwitly-accounts"
  (Supabase dashboard → Project Settings → API). It is a different project from the one
  in js/config.js, which belongs to the "Get notified" form and the Sign-up dashboard.
  The two never share accounts or access.

  The publishable key is meant to be public: what a signed-in person can do is decided by
  the database rules (Row Level Security) and the agreed functions, not by this key.
  Never put the secret / service_role key or the database password here.
*/
const ACCOUNTS_SUPABASE_URL = "https://otjvjshvwwljsdwyqoxk.supabase.co";
const ACCOUNTS_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oHJURDvS2pcYxryt3wAEbw_ItcTN79C";
