/*
  The Godwitly account bar on the Crash course pages (spec #56, ticket #58).

  Loaded by js/accounts-boot.js after js/course.js, so it can use that script's page
  language (courseLanguage), courseStorage() and TRANSLATIONS. Preview-only until T10: it is
  not in deploy-files.txt (a project check keeps it out).
*/

// Sign in with Google, see the name, sign out. Signing in enrols in nothing. The bar stays
// hidden without this script. Under file:// Auth never starts and the bar explains why
// (js/accounts.js). The language switch re-translates whatever the bar shows.
(function setUpAccountBar() {
  const bar = document.querySelector("[data-account]");
  if (!bar) return;

  const parts = {
    out: bar.querySelector("[data-account-out]"),
    // The signed-in controls (name and Sign out) are in the header and, on narrow screens, the menu.
    signedIn: document.querySelectorAll("[data-account-signed-in]"),
    names: document.querySelectorAll("[data-account-name]"),
    note: bar.querySelector("[data-account-note]"),
    live: document.querySelector("[data-account-live]"),
  };

  const NOTES = {
    "unavailable-file": "account.needsWebsite",
    "unavailable-locks": "account.needsNewerBrowser",
    "unavailable-script": "account.unavailable",
  };

  // Removes the OAuth details from the address bar after Google sends the person back.
  function addressError() {
    return readOAuthError(window.location.search, window.location.hash);
  }
  function cleanAddress() {
    try {
      const clean = cleanOAuthAddress(window.location.href);
      if (clean !== null) window.history.replaceState(window.history.state, "", clean);
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

  // Announce a change of state (signed in <-> signed out) and any problem, once. The first
  // state a page learns about is not announced: the page itself is the news then.
  let previousStatus = "loading";
  let lastAnnouncedNote = "";
  function show(state) {
    const text = TRANSLATIONS[courseLanguage.current()];
    const noteKey = NOTES[state.status] || state.message;
    // If the keyboard focus is on a signed-in control that is about to hide (Sign out), remember it,
    // so focus can move to the Sign in button instead of being lost to the page body.
    const focusWasInSignedIn = Array.from(parts.signedIn).some((element) => element.contains(document.activeElement));
    // The bar (sign-in button and notice) is for signed-out people; signed in, the header has the controls.
    bar.hidden = state.status === "loading" || state.status === "signed-in";
    parts.out.hidden = state.status !== "signed-out";
    parts.signedIn.forEach((element) => {
      element.hidden = state.status !== "signed-in";
    });
    // The name is text only, isolated from the page direction by <bdi>.
    const name = state.status === "signed-in" ? state.name || text["account.nameMissing"] : "";
    parts.names.forEach((element) => {
      element.textContent = name;
    });
    if (focusWasInSignedIn && state.status === "signed-out") {
      const signIn = bar.querySelector('[data-account-action="sign-in"]');
      if (signIn && !bar.hidden) signIn.focus();
    }
    parts.note.hidden = !noteKey;
    if (noteKey) {
      parts.note.dataset.i18n = noteKey;
      parts.note.textContent = text[noteKey];
    } else {
      delete parts.note.dataset.i18n;
      parts.note.textContent = "";
    }
    parts.note.classList.toggle("is-error", Boolean(state.message));

    const changed = state.status !== previousStatus && previousStatus !== "loading";
    if (state.message && state.message !== lastAnnouncedNote) {
      parts.live.textContent = text[state.message];
    } else if (changed && (state.status === "signed-in" || state.status === "signed-out")) {
      parts.live.textContent = text[state.status === "signed-in" ? "account.signedInAnnounce" : "account.signedOutAnnounce"];
    }
    lastAnnouncedNote = state.message;
    if (state.status !== "loading") previousStatus = state.status;
  }

  document.querySelectorAll("[data-account-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.accountAction === "sign-in") account.signIn();
      else account.signOut();
    });
  });
  // Links that only make sense where accounts are enabled (the footer's Privacy link).
  document.querySelectorAll("[data-account-only]").forEach((element) => {
    element.hidden = false;
  });
  account.subscribe(show);
  // A language switch re-translates the bar's own text.
  document.querySelectorAll(".lang-switch__btn").forEach((button) => button.addEventListener("click", () => show(account.getState())));
  account.start();
  // File and unsupported states have no later event: show them straight away.
  show(account.getState());
})();
