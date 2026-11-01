/*
  Godwitly account sign-in for the Crash course pages (spec #56, ticket #58, ADR-0009).

  What it does: signs a Course taker in with Google, says who is signed in, and signs
  them out. Signing in enrols in nothing. It talks to the "godwitly-accounts" Supabase
  project only, under its own storage key, and never touches the Sign-up dashboard's
  session, the language choice or any other saved value.

  The browser-specific parts (the Supabase library, the page address, storage) are handed
  in, so the tests in tests/accounts.test.js can run it with fakes.

  Loaded as a plain script on the course pages, and by the tests in tests/ (Node).
*/
const ACCOUNTS_STORAGE_KEY = "godwitly-accounts-auth";

// OAuth details Google/Supabase may leave in the address after the round trip.
const ACCOUNTS_OAUTH_PARAMS = ["code", "error", "error_code", "error_description", "state"];

// The OAuth error in the query or #hash of an address ("" if none), read before cleaning.
function readOAuthError(search, hash) {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(String(hash).replace(/^#/, ""));
  return query.get("error") || fragment.get("error") || "";
}

// The same address without the OAuth details (the rest, such as ?lang=ar, stays), as a
// path + query + hash. Returns null when there was nothing to remove.
function cleanOAuthAddress(href) {
  const url = new URL(href);
  let changed = false;
  ACCOUNTS_OAUTH_PARAMS.forEach((name) => {
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name);
      changed = true;
    }
  });
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  if (ACCOUNTS_OAUTH_PARAMS.some((name) => fragment.has(name))) {
    ACCOUNTS_OAUTH_PARAMS.forEach((name) => fragment.delete(name));
    const rest = fragment.toString();
    url.hash = rest;
    changed = true;
  }
  return changed ? url.pathname + url.search + url.hash : null;
}

/*
  status:
    "unavailable-file"   the page was opened from a file: Auth never starts
    "unavailable-locks"  this browser can't coordinate tabs safely: signed-in features stay off
    "unavailable-script" the Supabase library did not load (offline, or blocked)
    "loading"            waiting for the browser's saved session
    "signed-out" | "signed-in"
*/
// The sign-in pattern follows js/dashboard.js (PKCE, wait for initialize(), read and then remove
// the OAuth details from the address, account picker every time). That code is tied to the
// dashboard's own project and session, and spec #56 leaves the dashboard unchanged, so this is
// a separate module rather than a shared one.
// `readAddressError()` returns an OAuth error found in the address ("" if none);
// `cleanAddress()` removes the OAuth details from the address bar.
function createAccountSession({
  protocol,
  hasLocks,
  createClient,
  url,
  key,
  storage,
  pageAddress,
  readAddressError = () => "",
  cleanAddress = () => {},
}) {
  let state = { status: "loading", name: "", message: "" };
  let client = null;
  const listeners = new Set();
  let recordedThisPage = false;

  function setState(next) {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener(state));
  }

  // Google may send the name as "full_name" or "name". Nothing is copied out of Auth.
  function nameOf(session) {
    const meta = (session && session.user && session.user.user_metadata) || {};
    const name = meta.full_name || meta.name || "";
    return typeof name === "string" ? name.trim() : "";
  }

  // Removes only this project's keys, including the sign-in code verifier.
  function removeAccountKeys() {
    try {
      const names = [];
      for (let i = 0; i < storage.length; i++) names.push(storage.key(i));
      names
        .filter((name) => name === ACCOUNTS_STORAGE_KEY || name.startsWith(ACCOUNTS_STORAGE_KEY + "-"))
        .forEach((name) => storage.removeItem(name));
    } catch (error) {
      /* storage blocked: nothing was kept there */
    }
  }

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async start() {
      if (protocol === "file:") return setState({ status: "unavailable-file" });
      if (!hasLocks) return setState({ status: "unavailable-locks" });
      if (!createClient) return setState({ status: "unavailable-script" });

      client = createClient(url, key, {
        auth: {
          storageKey: ACCOUNTS_STORAGE_KEY,
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      // The page waits for the saved session (INITIAL_SESSION) before deciding the person
      // is signed out. Nothing is awaited inside the callback, as the library advises.
      client.auth.onAuthStateChange((event, session) => {
        // A completed Google sign-in is reported to the server once per page load (Record
        // sign-in). The server decides whether it counts: a refresh, an old session or a
        // non-Google method changes nothing there. Never awaited inside the callback.
        if (event === "SIGNED_IN" && session && !recordedThisPage) {
          recordedThisPage = true;
          setTimeout(() => {
            Promise.resolve(client.rpc("record_sign_in")).catch(() => {});
          }, 0);
        }
        if (session) setState({ status: "signed-in", name: nameOf(session), message: "" });
        else setState({ status: "signed-out", name: "" });
      });

      // Coming back from Google, the address may carry an error (a refused or cancelled
      // sign-in looks the same). Its text is never shown, only our own message.
      const addressError = readAddressError();
      let startError = null;
      try {
        startError = (await client.auth.initialize()).error;
      } catch (error) {
        startError = error;
      }
      cleanAddress();
      if (addressError || startError) setState({ message: "account.signInFailed" });
    },

    async signIn() {
      if (!client) return;
      setState({ message: "" });
      try {
        const { error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: pageAddress(), queryParams: { prompt: "select_account" } },
        });
        if (error) setState({ message: "account.signInFailed" });
      } catch (error) {
        setState({ message: "account.signInFailed" });
      }
    },

    // Enrol in a Crash course (spec #56, "Functions the site calls"). Free and immediate; asking
    // again changes nothing. Success is reported only when the server says "enrolled" or
    // "already"; anything else, including an error or a timeout, is a failure the page can show.
    async enrol(courseId) {
      if (!client) return { ok: false };
      try {
        const { data, error } = await client.rpc("enrol", { p_course: courseId });
        return { ok: !error && (data === "enrolled" || data === "already") };
      } catch (error) {
        return { ok: false };
      }
    },

    async signOut() {
      if (!client) return;
      // Signed out on this device either way. If the server could not be told, the page says so,
      // because the session may still be valid elsewhere until it expires.
      let revoked = true;
      try {
        revoked = !(await client.auth.signOut({ scope: "local" })).error;
      } catch (error) {
        revoked = false;
      }
      removeAccountKeys();
      setState({ status: "signed-out", name: "", message: revoked ? "" : "account.signOutIncomplete" });
    },
  };
}

// Node (the tests) reads the exports; the browser ignores this line.
if (typeof module !== "undefined") module.exports = { ACCOUNTS_STORAGE_KEY, createAccountSession, readOAuthError, cleanOAuthAddress };
