/*
  Connection settings for the contact form.

  These two values come from the Supabase project "godwitly"
  (Supabase dashboard → Project Settings → API).

  The publishable key is meant to be public: it can only ADD a row to the
  launch_signups table. The database rules (Row Level Security) stop anyone
  from reading, changing or deleting entries with it.
  Never put the secret / service_role key or the database password here.
*/
const SUPABASE_URL = "";
const SUPABASE_PUBLISHABLE_KEY = "";
