/*
  Where Godwitly accounts may start (spec #56, ticket #58: "nothing account-related goes to
  production before T10"). Until T10 the sign-in loads only on the developer's own computer and
  on Cloudflare Pages preview addresses, never on the production address godwitly.pages.dev.
  At T10 this list changes (a reviewed change) when accounts go live.

  Loaded as a plain script on the course pages, and by the tests in tests/ (Node).
*/
const ACCOUNTS_PREVIEW_SUFFIX = ".godwitly.pages.dev";

function accountsAllowedOn(hostname) {
  const host = String(hostname).toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(ACCOUNTS_PREVIEW_SUFFIX);
}

// Node (the tests) reads the exports; the browser ignores this line.
if (typeof module !== "undefined") module.exports = { accountsAllowedOn };
