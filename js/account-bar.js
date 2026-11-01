/*
  The Godwitly account bar on the Crash course pages (spec #56, ticket #58).

  Loaded by js/accounts-boot.js after js/course.js, so it can use that script's page
  language (courseLanguage), courseStorage() and TRANSLATIONS. Preview-only until T10: it is
  not in deploy-files.txt (a project check keeps it out).
*/

/* ---------- 10. Godwitly account bar (spec #56, ticket #58) ---------- */

// Sign in with Google, see the name, sign out. Signing in enrols in nothing. The bar stays
// hidden without this script. Under file:// Auth never starts and the bar explains why
// (js/accounts.js). The language switch re-translates whatever the bar shows.
(function setUpAccountBar() {
  const bar = document.querySelector("[data-account]");
  if (!bar) return;

  const parts = {
    out: bar.querySelector("[data-account-out]"),
    signedIn: bar.querySelector("[data-account-in]"),
    name: bar.querySelector("[data-account-name]"),
    note: bar.querySelector("[data-account-note]"),
    live: bar.querySelector("[data-account-live]"),
  };

  const NOTES = {
    "unavailable-file": "account.needsWebsite",
    "unavailable-locks": "account.needsNewerBrowser",
    "unavailable-script": "account.unavailable",
  };

  // Removes the OAuth details from the address bar after Google sends the person back.
  const OAUTH_PARAMS = ["code", "error", "error_code", "error_description", "state"];
  function addressError() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return query.get("error") || hash.get("error") || "";
  }
  function cleanAddress() {
    try {
      const url = new URL(window.location.href);
      OAUTH_PARAMS.forEach((name) => url.searchParams.delete(name));
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      if (OAUTH_PARAMS.some((name) => hash.has(name))) url.hash = "";
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    } catch (error) {
      /* some browsers block this for local files: the page still works */
    }
  }

  const account = createAccountSession({
    protocol: window.location.protocol,
    hasLocks: Boolean(navigator.locks),
    createClient: window.supabase && window.supabase.createClient,
    url: typeof ACCOUNTS_SUPABASE_URL === "string" ? ACCOUNTS_SUPABASE_URL : "",
    key: typeof ACCOUNTS_SUPABASE_PUBLISHABLE_KEY === "string" ? ACCOUNTS_SUPABASE_PUBLISHABLE_KEY : "",
    storage: courseStorage(),
    // Return to this page in the language being read, without any old OAuth details.
    // Google needs a full address, and courseLanguage.link() gives a relative one.
    pageAddress: () => new URL(courseLanguage.link(window.location.pathname), window.location.origin).href,
    readAddressError: addressError,
    cleanAddress,
  });

  let lastAnnounced = "";
  function show(state) {
    const text = TRANSLATIONS[courseLanguage.current()];
    const noteKey = NOTES[state.status] || state.message;
    bar.hidden = state.status === "loading";
    parts.out.hidden = state.status !== "signed-out";
    parts.signedIn.hidden = state.status !== "signed-in";
    // The name is text only, isolated from the page direction by <bdi>.
    parts.name.textContent = state.status === "signed-in" ? state.name || text["account.nameMissing"] : "";
    parts.note.hidden = !noteKey;
    if (noteKey) {
      parts.note.dataset.i18n = noteKey;
      parts.note.textContent = text[noteKey];
    } else {
      delete parts.note.dataset.i18n;
      parts.note.textContent = "";
    }
    parts.note.classList.toggle("is-error", Boolean(state.message));
    // One polite live region, never moving focus. Announce a change of state once.
    const announce = state.status === "signed-in" ? "account.signedInAnnounce" : state.status === "signed-out" ? "account.signedOutAnnounce" : "";
    if (announce && announce !== lastAnnounced) parts.live.textContent = text[announce];
    lastAnnounced = announce;
  }

  bar.querySelectorAll("[data-account-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.accountAction === "sign-in") account.signIn();
      else account.signOut();
    });
  });
  account.subscribe(show);
  // A language switch re-translates the bar's own text.
  document.querySelectorAll(".lang-switch__btn").forEach((button) => button.addEventListener("click", () => show(account.getState())));
  account.start();
  // File and unsupported states have no later event: show them straight away.
  show(account.getState());
})();
