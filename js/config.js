/*
  Connection settings for the "Get notified" form on the landing page and
  for the Sign-up dashboard (dashboard.html).

  These two values come from the Supabase project "godwitly"
  (Supabase dashboard → Project Settings → API).

  The publishable key is meant to be public: on its own it can only ADD a
  row to the launch_signups table. Reading rows needs a signed-in Sign-up
  viewer, and the database rules (Row Level Security) enforce that. Nobody
  can change or delete entries with this key.
  Never put the secret / service_role key or the database password here.
*/
const SUPABASE_URL = "https://ijpvbxglhxktnkabjdif.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5NpWsPAwBChE1MsaFTdmuA_YDSG_Zta";
