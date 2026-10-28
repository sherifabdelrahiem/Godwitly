/*
  The Sign-up dashboard (dashboard.html).

    1. Cairo dates (the day and week each sign-up belongs to)
    2. Language switcher (English <-> Arabic)
    3. What the page is doing right now (one state object)
    4. Signing in and out (Google, through Supabase Auth)
    5. Loading the data (role first, then the sign-ups page by page)
    6. Figures, chart and the Launch sign-ups list
    7. Access (Project owner only)
    8. Showing the page: render()
    9. Start

  Safety rules for this file:
    - Every value from a Launch sign-up or a Sign-up viewer goes into the page
      with textContent or createElement, never as HTML.
    - Emails and phone numbers are plain text, not mailto: or tel: links.
    - Nothing from a sign-up is written to the console or to storage.
    - Error texts from Supabase or Google are never shown; each problem shows
      a dash.* message from js/translations.js.

  Everything is wrapped in one function, so the only global this file creates
  is window.GodwitlyDashboardDates (two pure date helpers, used by the checks
  in the plan). The Supabase library already declares a global "supabase", so
  the connection is called "client".
*/
(function () {
  "use strict";

  /* ---------- 1. Cairo dates ---------- */
  // Days and weeks follow the Cairo calendar (Africa/Cairo), whatever the
  // computer's own time zone is. Weeks start on Sunday.

  const CAIRO_DATE = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    numberingSystem: "latn",
  });

  // Supabase sends times like 2026-10-28T12:34:56.123456+00:00. Some browsers only
  // read 3 digits after the seconds, so the extra digits are dropped first.
  function toDate(isoString) {
    return new Date(String(isoString).replace(/(\.\d{3})\d+/, "$1"));
  }

  // The Cairo calendar day of a moment, as 'YYYY-MM-DD'.
  function dayKey(isoString) {
    const parts = {};
    CAIRO_DATE.formatToParts(toDate(isoString)).forEach((part) => {
      parts[part.type] = part.value;
    });
    return parts.year + "-" + parts.month + "-" + parts.day;
  }

  // Moves a 'YYYY-MM-DD' day by whole calendar days (plain calendar sums, no clock time).
  function shiftDay(key, days) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
  }

  // The Sunday that starts the Cairo week of a moment, as 'YYYY-MM-DD'.
  function weekKey(isoString) {
    const [year, month, day] = dayKey(isoString).split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
    return new Date(Date.UTC(year, month - 1, day - weekday)).toISOString().slice(0, 10);
  }

  window.GodwitlyDashboardDates = Object.freeze({ dayKey, weekKey });

  /* ---------- 2. Language switcher ---------- */

  const STORAGE_KEY = "godwitly-language";
  // Latin digits in both languages, like the phone numbers and emails in the list.
  const LOCALES = { en: "en-GB", ar: "ar-EG-u-nu-latn" };
  let currentLanguage = "en";

  // Text for a key in the current language. "{name}" parts are filled from values.
  function t(key, values) {
    let text = TRANSLATIONS[currentLanguage][key];
    if (text === undefined) text = TRANSLATIONS.en[key] || key;
    Object.keys(values || {}).forEach((name) => {
      text = text.split("{" + name + "}").join(values[name]);
    });
    return text;
  }

  function saveLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      /* not saved — the page still works */
    }
  }

  function setLanguage(language) {
    const text = TRANSLATIONS[language];
    if (!text) return;
    currentLanguage = language;

    // Language + direction for the whole page: Arabic reads right-to-left.
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    // Visible text: <span data-i18n="key">
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = text[element.dataset.i18n];
      if (value !== undefined) element.textContent = value;
    });

    // Screen-reader labels: <div data-i18n-aria-label="key">
    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      const value = text[element.dataset.i18nAriaLabel];
      if (value !== undefined) element.setAttribute("aria-label", value);
    });

    // Meta tags: <meta data-i18n-content="key">
    document.querySelectorAll("[data-i18n-content]").forEach((element) => {
      const value = text[element.dataset.i18nContent];
      if (value !== undefined) element.setAttribute("content", value);
    });

    // Example text inside empty boxes: <input data-i18n-placeholder="key">
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const value = text[element.dataset.i18nPlaceholder];
      if (value !== undefined) element.setAttribute("placeholder", value);
    });

    // Show which language button is selected.
    document.querySelectorAll(".lang-switch__btn").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === language));
    });

    saveLanguage(language);

    // Dates, numbers and chart labels are written by render(), so draw them again.
    // A language switch never starts a new load.
    render();
  }

  function getStartLanguage() {
    // A link like dashboard.html?lang=ar opens the Arabic version directly.
    const fromAddress = new URLSearchParams(window.location.search).get("lang");
    if (fromAddress && TRANSLATIONS[fromAddress]) return fromAddress;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch (error) {
      /* storage not available */
    }
    return "en";
  }

  function formatNumber(number) {
    return new Intl.NumberFormat(LOCALES[currentLanguage]).format(number);
  }

  // Date and time of a moment, in Cairo time.
  function formatDateTime(isoString) {
    return new Intl.DateTimeFormat(LOCALES[currentLanguage], {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(toDate(isoString));
  }

  // Date only, in Cairo time.
  function formatDate(isoString) {
    return new Intl.DateTimeFormat(LOCALES[currentLanguage], {
      timeZone: "Africa/Cairo",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(toDate(isoString));
  }

  // A 'YYYY-MM-DD' day key as a short label such as "28 Oct". The key is already a
  // Cairo day, so it is printed as a plain calendar date (UTC, no shifting).
  function formatDayKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(LOCALES[currentLanguage], {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  /* ---------- 3. What the page is doing right now ---------- */

  const PAGE_SIZE = 1000; // rows per request; at or below the project's "Max rows" setting
  const COLUMNS = "id, created_at, full_name, email, phone, job_title, message, language, consent";
  // OAuth details that Supabase or Google may add to the address after sign-in.
  const OAUTH_PARAMS = ["error", "error_code", "error_description", "sb"];
  // Keep this the same as the email CHECK rule on private.signup_viewers.
  const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  // Access messages shown in red.
  const ACCESS_ERRORS = ["dash.accessInvalid", "dash.accessFailed"];

  let client = null; // the Supabase connection, created in start()

  // Goes up on every new load (first load or Try again), on Sign out, and on any
  // switch to "no access", "signed out" or "error". A reply that comes back after
  // the number changed belongs to an old load and is dropped without touching state.
  let loadGeneration = 0;

  // render() draws the page from this.
  let state = {
    view: "loading", // "offline" | "loading" | "signedOut" | "noAccess" | "error" | "dashboard"
    hasSession: false,
    signingOut: false,
    role: null, // "owner" | "viewer"
    rows: [], // the Launch sign-ups, newest first
    figures: null, // worked out once per load, see computeFigures()
    search: "",
    chartMode: "day", // "day" | "week"
    viewers: [], // Access list (Project owner only)
    accessBusy: false,
    accessMessage: "", // translation key for the line under the Access form
    confirming: null, // the email whose Remove is waiting for "Yes, remove"
  };

  function setState(changes) {
    state = { ...state, ...changes };
    render();
  }

  const byId = (id) => document.getElementById(id);
  const main = byId("main");
  const searchInput = byId("dash-search");
  const viewerInput = byId("dash-viewer-email");
  const viewerAddButton = document.querySelector(".dash-access__add");

  // Empties every place that can hold sign-up or viewer details.
  function clearData() {
    state = {
      ...state,
      role: null,
      rows: [],
      figures: null,
      search: "",
      viewers: [],
      accessBusy: false,
      accessMessage: "",
      confirming: null,
    };
    searchInput.value = "";
    viewerInput.value = "";
    viewerInput.removeAttribute("aria-invalid");
    ["dash-cards", "dash-chart", "dash-rows", "dash-viewers"].forEach((id) => byId(id).replaceChildren());
    byId("dash-list-status").textContent = "";
    byId("dash-access-status").textContent = "";
    byId("dash-chart-note").textContent = "";
  }

  // Stops any load in progress and shows "signed out", "no access" or "error"
  // with no sign-up details left on the page.
  function stopAndShow(view, changes) {
    loadGeneration += 1;
    clearData();
    setState({ view, ...changes });
  }

  /* ---------- 4. Signing in and out ---------- */

  // Reads an OAuth error from the address (query and #hash) before it is removed.
  function readAddressError() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return query.get("error") || hash.get("error") || "";
  }

  // Removes the OAuth details from the address bar, so they are not bookmarked or
  // shared. The rest of the address (for example ?lang=ar) stays.
  function cleanAddress() {
    const url = new URL(window.location.href);
    let changed = false;
    OAUTH_PARAMS.forEach((name) => {
      if (url.searchParams.has(name)) {
        url.searchParams.delete(name);
        changed = true;
      }
    });
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    if (OAUTH_PARAMS.some((name) => hash.has(name))) {
      OAUTH_PARAMS.forEach((name) => hash.delete(name));
      url.hash = hash.toString();
      changed = true;
    }
    if (changed) window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }

  async function signIn() {
    if (!client) return;
    // Remember the language, so it survives the round trip to Google.
    saveLanguage(currentLanguage);
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) stopAndShow("error");
    } catch (error) {
      stopAndShow("error");
    }
  }

  async function signOut() {
    // Clear the page straight away; replies still on their way are dropped.
    stopAndShow("signedOut", { hasSession: false, signingOut: true });
    let failed = false;
    try {
      if (client) failed = Boolean((await client.auth.signOut()).error);
    } catch (error) {
      failed = true;
    }
    // If the sign-out request failed (for example offline), still forget the
    // session in this tab, so a reload does not sign the person back in.
    if (failed) forgetSession();
    setState({ signingOut: false });
  }

  function forgetSession() {
    try {
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith("sb-"))
        .forEach((key) => window.sessionStorage.removeItem(key));
    } catch (error) {
      /* storage not available */
    }
  }

  /* ---------- 5. Loading the data ---------- */

  // Reads every Launch sign-up, newest first, PAGE_SIZE rows at a time. Each next
  // page asks only for rows strictly older than the last row received, so a new
  // sign-up arriving during the load cannot shift a page. Returns null when the
  // load became stale; throws when a request fails.
  async function readAllSignups(isCurrent) {
    const rowsById = new Map();
    let last = null;
    for (;;) {
      let query = client
        .from("launch_signups")
        .select(COLUMNS)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);
      if (last) {
        // created_at is used exactly as Supabase sent it (full precision).
        const time = last.created_at;
        query = query.or("created_at.lt." + time + ",and(created_at.eq." + time + ",id.lt." + last.id + ")");
      }
      const { data, error } = await query;
      if (!isCurrent()) return null;
      if (error || !Array.isArray(data)) throw new Error("load failed");
      // Safety net: never show the same sign-up twice.
      data.forEach((row) => {
        if (!rowsById.has(row.id)) rowsById.set(row.id, row);
      });
      if (data.length < PAGE_SIZE) break;
      last = data[data.length - 1];
    }
    return Array.from(rowsById.values());
  }

  // First load and Try again. The role is checked before every load, so a removed
  // Sign-up viewer sees "no access", never an empty list.
  async function load() {
    loadGeneration += 1;
    const generation = loadGeneration;
    const isCurrent = () => generation === loadGeneration;
    setState({ view: "loading" });

    try {
      const { data: sessionData } = await client.auth.getSession();
      if (!isCurrent()) return;
      if (!sessionData || !sessionData.session) {
        stopAndShow("signedOut", { hasSession: false });
        return;
      }
      setState({ hasSession: true });

      const roleResult = await client.rpc("dashboard_role");
      if (!isCurrent()) return;
      if (roleResult.error) throw new Error("role failed");
      const role = roleResult.data;
      if (role !== "owner" && role !== "viewer") {
        stopAndShow("noAccess");
        return;
      }

      const rows = await readAllSignups(isCurrent);
      if (rows === null) return;

      // Check the role again: a Sign-up viewer removed during the load gets empty pages,
      // and must see "no access", not the empty state or part of the list.
      const recheck = await client.rpc("dashboard_role");
      if (!isCurrent()) return;
      if (recheck.error) throw new Error("role failed");
      if (recheck.data !== "owner" && recheck.data !== "viewer") {
        stopAndShow("noAccess");
        return;
      }

      let viewers = [];
      if (role === "owner") {
        const viewersResult = await client.rpc("list_signup_viewers");
        if (!isCurrent()) return;
        if (viewersResult.error || !Array.isArray(viewersResult.data)) throw new Error("access list failed");
        viewers = viewersResult.data;
      }

      const loadedAt = new Date().toISOString();
      setState({
        view: "dashboard",
        role,
        rows,
        figures: computeFigures(rows, loadedAt),
        viewers,
        accessBusy: false,
        accessMessage: "",
        confirming: null,
      });
    } catch (error) {
      if (isCurrent()) stopAndShow("error");
    }
  }

  function retry() {
    // Without the Supabase library (for example the CDN was down) only a reload helps.
    if (!client) {
      window.location.reload();
      return;
    }
    load();
  }

  /* ---------- 6. Figures, chart and the Launch sign-ups list ---------- */

  // A small helper: an element with a class and some text (always as text, never HTML).
  function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  // Counts sign-ups per bucket. Every bucket in range is listed, including zeros.
  function countPer(rows, keyOf, keys) {
    const counts = new Map(keys.map((key) => [key, 0]));
    rows.forEach((row) => {
      const key = keyOf(row.created_at);
      if (counts.has(key)) counts.set(key, counts.get(key) + 1);
    });
    return keys.map((key) => ({ key, count: counts.get(key) }));
  }

  function computeFigures(rows, nowIso) {
    // The last 30 Cairo days, today included, oldest first.
    const today = dayKey(nowIso);
    const dayKeys = [];
    for (let i = 29; i >= 0; i -= 1) dayKeys.push(shiftDay(today, -i));

    // The last 12 Sunday-start weeks, this week included, oldest first.
    const thisWeek = weekKey(nowIso);
    const weekKeys = [];
    for (let i = 11; i >= 0; i -= 1) weekKeys.push(shiftDay(thisWeek, -7 * i));

    return {
      total: rows.length,
      // Lower-case, because the same person may sign up twice (ADR-0003).
      unique: new Set(rows.map((row) => String(row.email).toLowerCase())).size,
      english: rows.filter((row) => row.language === "en").length,
      arabic: rows.filter((row) => row.language === "ar").length,
      withMessage: rows.filter((row) => row.message !== null && row.message !== "").length,
      days: countPer(rows, dayKey, dayKeys),
      weeks: countPer(rows, weekKey, weekKeys),
    };
  }

  function renderFigures() {
    const figures = state.figures;
    const cards = [
      ["dash.figTotal", figures.total],
      ["dash.figUnique", figures.unique],
      ["dash.figEnglish", figures.english],
      ["dash.figArabic", figures.arabic],
      ["dash.figMessage", figures.withMessage],
    ];
    const fragment = document.createDocumentFragment();
    cards.forEach(([key, value]) => {
      const card = el("div", "dash-card");
      card.append(el("dt", "dash-card__label", t(key)), el("dd", "dash-card__value", formatNumber(value)));
      fragment.append(card);
    });
    byId("dash-cards").replaceChildren(fragment);
  }

  function renderChart() {
    const weekly = state.chartMode === "week";
    const buckets = weekly ? state.figures.weeks : state.figures.days;
    const largest = Math.max(0, ...buckets.map((bucket) => bucket.count));

    document.querySelectorAll(".dash-toggle__btn").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.chart === state.chartMode));
    });
    byId("dash-chart-note").textContent = t(weekly ? "dash.chartWeeksNote" : "dash.chartDaysNote");

    const chart = byId("dash-chart");
    chart.setAttribute("aria-label", t(weekly ? "dash.chartWeekLabel" : "dash.chartDayLabel"));
    const fragment = document.createDocumentFragment();
    buckets.forEach((bucket) => {
      const label = weekly ? t("dash.weekOf", { date: formatDayKey(bucket.key) }) : formatDayKey(bucket.key);
      const item = el("li", "dash-bar");
      const track = el("div", "dash-bar__track");
      track.setAttribute("aria-hidden", "true");
      const fill = el("div", "dash-bar__fill");
      // The width is set here (allowed by the page's CSP); 0 when every bucket is 0.
      fill.style.width = largest === 0 ? "0%" : (bucket.count / largest) * 100 + "%";
      track.append(fill);
      item.append(el("span", "dash-bar__label", label), track, el("span", "dash-bar__count", formatNumber(bucket.count)));
      fragment.append(item);
    });
    chart.replaceChildren(fragment);
  }

  // Search: full name, email, phone, job title and message, ignoring upper/lower case.
  function matchesSearch(row, term) {
    return [row.full_name, row.email, row.phone, row.job_title, row.message].some(
      (value) => value !== null && value !== undefined && String(value).toLowerCase().includes(term)
    );
  }

  // One table cell. On phones the label is shown above the value (the row is a card);
  // from 768px the labels are hidden and the table header names the columns.
  function addCell(row, labelKey, value, options) {
    const settings = options || {};
    const cell = document.createElement("td");
    if (settings.className) cell.className = settings.className;
    const text = el("span", "dash-cell__value", value);
    if (settings.dir) text.dir = settings.dir;
    cell.append(el("span", "dash-cell__label", t(labelKey)), text);
    row.append(cell);
  }

  function signupRow(signup) {
    const row = document.createElement("tr");
    const hasMessage = signup.message !== null && signup.message !== "";
    addCell(row, "dash.colDate", formatDateTime(signup.created_at));
    addCell(row, "dash.colName", signup.full_name, { dir: "auto" });
    addCell(row, "dash.colEmail", signup.email, { dir: "ltr" });
    addCell(row, "dash.colPhone", signup.phone, { dir: "ltr" });
    addCell(row, "dash.colJob", signup.job_title, { dir: "auto" });
    addCell(row, "dash.colLanguage", t(signup.language === "ar" ? "dash.langAr" : "dash.langEn"));
    addCell(row, "dash.colConsent", t(signup.consent ? "dash.yes" : "dash.no"));
    addCell(row, "dash.colMessage", hasMessage ? signup.message : t("dash.noMessage"), {
      dir: hasMessage ? "auto" : "",
      className: hasMessage ? "dash-col-message" : "dash-col-message is-empty",
    });
    return row;
  }

  function renderList() {
    const term = state.search.trim().toLowerCase();
    const shown = term ? state.rows.filter((row) => matchesSearch(row, term)) : state.rows;

    const status = byId("dash-list-status");
    let message = t("dash.count", { shown: formatNumber(shown.length), total: formatNumber(state.rows.length) });
    if (state.rows.length === 0) message = t("dash.empty");
    else if (shown.length === 0) message = t("dash.noResults");
    status.textContent = message;
    status.classList.toggle("is-empty", shown.length === 0);

    byId("dash-table-wrap").hidden = shown.length === 0;
    const fragment = document.createDocumentFragment();
    shown.forEach((signup) => fragment.append(signupRow(signup)));
    byId("dash-rows").replaceChildren(fragment);
  }

  /* ---------- 7. Access (Project owner only) ---------- */

  // Reads the Access list again after a change. Returns the new list, the old one if
  // reading failed, or null when the reply belongs to an old load.
  async function readViewers(generation) {
    let result = null;
    try {
      result = await client.rpc("list_signup_viewers");
    } catch (error) {
      result = null;
    }
    if (generation !== loadGeneration) return null;
    return result && !result.error && Array.isArray(result.data) ? result.data : state.viewers;
  }

  async function addViewer(event) {
    event.preventDefault();
    if (state.accessBusy) return;

    // A light check first, with the same rule as the database (which checks again).
    const email = viewerInput.value.trim().toLowerCase();
    if ([...email].length > 254 || !EMAIL_PATTERN.test(email)) {
      viewerInput.setAttribute("aria-invalid", "true");
      setState({ accessMessage: "dash.accessInvalid", confirming: null });
      viewerInput.focus();
      return;
    }
    viewerInput.removeAttribute("aria-invalid");

    const generation = loadGeneration;
    setState({ accessBusy: true, accessMessage: "dash.accessWorking", confirming: null });

    let message = "dash.accessFailed";
    let changed = false;
    try {
      const { data, error } = await client.rpc("add_signup_viewer", { viewer_email: email });
      if (generation !== loadGeneration) return;
      if (error && error.code === "23514") message = "dash.accessInvalid"; // refused by the CHECK rule
      else if (!error && data === "exists") message = "dash.accessExists";
      else if (!error && data === "added") {
        message = "dash.accessAdded";
        changed = true;
        viewerInput.value = "";
      }
    } catch (error) {
      if (generation !== loadGeneration) return;
    }

    let viewers = state.viewers;
    if (changed) {
      viewers = await readViewers(generation);
      if (viewers === null) return;
    }
    if (message === "dash.accessInvalid") viewerInput.setAttribute("aria-invalid", "true");
    setState({ viewers, accessBusy: false, accessMessage: message });
    // The button was disabled while busy, so focus fell to the page; bring it back.
    viewerInput.focus();
  }

  async function removeViewer(email) {
    if (state.accessBusy) return;
    const generation = loadGeneration;
    setState({ accessBusy: true, accessMessage: "dash.accessWorking", confirming: null });

    let message = "dash.accessFailed";
    let changed = false;
    try {
      const { data, error } = await client.rpc("remove_signup_viewer", { viewer_email: email });
      if (generation !== loadGeneration) return;
      if (!error && data === "removed") message = "dash.accessRemoved";
      else if (!error && data === "not_found") message = "dash.accessNotFound";
      changed = !error;
    } catch (error) {
      if (generation !== loadGeneration) return;
    }

    let viewers = state.viewers;
    if (changed) {
      viewers = await readViewers(generation);
      if (viewers === null) return;
    }
    setState({ viewers, accessBusy: false, accessMessage: message });
    viewerInput.focus();
  }

  // Finds the button for one viewer after the list was drawn again.
  function focusViewerButton(email, action) {
    const buttons = byId("dash-viewers").querySelectorAll("button");
    const match = Array.from(buttons).find((button) => button.dataset.email === email && button.dataset.action === action);
    if (match) match.focus();
  }

  function viewerButton(className, textKey, email, action, onClick) {
    const button = el("button", "pill " + className, t(textKey));
    button.type = "button";
    button.disabled = state.accessBusy;
    button.dataset.email = email;
    button.dataset.action = action;
    button.addEventListener("click", onClick);
    return button;
  }

  function viewerItem(viewer) {
    const item = el("li", "dash-viewer");
    const info = el("div", "dash-viewer__info");
    const email = el("span", "dash-viewer__email", viewer.email);
    email.dir = "ltr";
    const role = t(viewer.is_owner ? "dash.accessOwner" : "dash.accessViewer");
    const added = t("dash.accessAddedOn", { date: formatDate(viewer.added_at) });
    info.append(email, el("span", "dash-viewer__meta", role + " · " + added));
    item.append(info);

    // The Project owner row has no Remove.
    if (viewer.is_owner) return item;

    if (state.confirming === viewer.email) {
      // Remove asks once more before it does anything.
      const confirm = el("div", "dash-confirm");
      confirm.append(
        el("span", "dash-confirm__text", t("dash.accessConfirm")),
        viewerButton("dash-pill-small dash-pill-danger", "dash.accessConfirmYes", viewer.email, "confirm", () =>
          removeViewer(viewer.email)
        ),
        viewerButton("dash-pill-small pill--outline", "dash.accessCancel", viewer.email, "cancel", () => {
          setState({ confirming: null });
          focusViewerButton(viewer.email, "remove");
        })
      );
      item.append(confirm);
    } else {
      const remove = viewerButton("dash-pill-small pill--outline", "dash.accessRemove", viewer.email, "remove", () => {
        setState({ confirming: viewer.email, accessMessage: "" });
        focusViewerButton(viewer.email, "cancel");
      });
      remove.setAttribute("aria-label", t("dash.accessRemoveLabel", { email: viewer.email }));
      item.append(remove);
    }
    return item;
  }

  function renderAccess() {
    const fragment = document.createDocumentFragment();
    state.viewers.forEach((viewer) => fragment.append(viewerItem(viewer)));
    byId("dash-viewers").replaceChildren(fragment);

    const status = byId("dash-access-status");
    status.textContent = state.accessMessage ? t(state.accessMessage) : "";
    status.classList.toggle("is-error", ACCESS_ERRORS.includes(state.accessMessage));
    viewerAddButton.disabled = state.accessBusy;
    viewerAddButton.setAttribute("aria-busy", String(state.accessBusy));
  }

  /* ---------- 8. Showing the page ---------- */

  const VIEWS = {
    offline: "dash-offline",
    loading: "dash-loading",
    signedOut: "dash-signed-out",
    noAccess: "dash-no-access",
    error: "dash-error",
    dashboard: "dash-content",
  };

  function render() {
    Object.entries(VIEWS).forEach(([view, id]) => {
      byId(id).hidden = state.view !== view;
    });

    // The header's Sign out shows while someone is signed in. "No access" has its own.
    const headerSignOut = document.querySelector(".dash-header .dash-signout");
    headerSignOut.hidden = !state.hasSession || !["loading", "error", "dashboard"].includes(state.view);
    document.querySelectorAll('[data-action="sign-in"]').forEach((button) => {
      button.disabled = state.signingOut;
    });

    const showDashboard = state.view === "dashboard" && state.figures !== null;
    if (showDashboard) {
      renderFigures();
      renderChart();
      renderList();
    }

    const access = byId("dash-access");
    access.hidden = !(showDashboard && state.role === "owner");
    if (!access.hidden) renderAccess();

    // If the focused button was just hidden, move focus to the main area instead of losing it.
    const active = document.activeElement;
    if (active && active !== document.body && active.closest("[hidden]")) main.focus({ preventScroll: true });
  }

  /* ---------- 9. Start ---------- */

  document.querySelectorAll(".lang-switch__btn").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  document.querySelectorAll('[data-action="sign-in"]').forEach((button) => button.addEventListener("click", signIn));
  document.querySelectorAll('[data-action="sign-out"]').forEach((button) => button.addEventListener("click", signOut));
  document.querySelectorAll('[data-action="retry"]').forEach((button) => button.addEventListener("click", retry));
  document.querySelectorAll(".dash-toggle__btn").forEach((button) => {
    button.addEventListener("click", () => setState({ chartMode: button.dataset.chart }));
  });
  searchInput.addEventListener("input", () => setState({ search: searchInput.value }));
  byId("dash-access-form").addEventListener("submit", addViewer);

  async function start() {
    setLanguage(getStartLanguage());

    // Google sign-in has to come back to a real web address, so the dashboard
    // does nothing from a file on the computer (ADR-0005).
    if (window.location.protocol === "file:") {
      setState({ view: "offline" });
      return;
    }

    // The Supabase library did not load (for example the CDN is down).
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      stopAndShow("error");
      return;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: "pkce",
        storage: window.sessionStorage, // closing the tab or the browser signs out
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    // After the Google round trip the address may carry an error. "access_denied"
    // means a refused account or a cancel at Google (they look the same): "no
    // access". Any other error: "error". The error text itself is never shown.
    const addressError = readAddressError();
    let startError = null;
    try {
      startError = (await client.auth.initialize()).error;
    } catch (error) {
      startError = error;
    }
    cleanAddress();

    // If the session ends on its own (for example it was revoked), show "signed out".
    client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && state.view !== "signedOut") stopAndShow("signedOut", { hasSession: false });
    });

    const details = startError && startError.details ? startError.details : {};
    const oauthError = addressError || details.error || "";
    if (oauthError === "access_denied") stopAndShow("noAccess", { hasSession: false });
    else if (oauthError || startError) stopAndShow("error");
    else load();
  }

  start();
})();
