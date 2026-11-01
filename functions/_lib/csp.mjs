// The Content-Security-Policy for every gate response (spec #56, "The gate"). _headers gives the
// same text to the static Crash course pages; a project check compares the two.
export const CSP =
  "default-src 'none'; " +
  "script-src 'self' https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js; " +
  "style-src 'self' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; " +
  "img-src 'self' data:; " +
  "connect-src 'self' https://otjvjshvwwljsdwyqoxk.supabase.co; " +
  "frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'";
