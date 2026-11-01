/*
  Small helpers for the Crash course pages. Nothing here talks to a server.

    1. Language (English <-> Arabic), chosen by js/course-language.js
    2. Mobile menu (open / close)
    3. The Lesson list on Lesson pages (open / close on phones)
    4. The Self-check: choose an answer, see why it is right or wrong
    5. Code boxes: a Copy button that copies exactly the box's text
    6. Mac / Windows tabs: show one system's steps at a time
    7. The printable برشامة: a Print button (the print style is in css/course.css)
    8. Checklist progress: ticks remembered in this browser (js/course-progress.js)
    9. Current year in the footer

  Course pages do not load js/script.js, which saves the landing page's language
  on every visit and expects landing-page elements (the product tabs). The language
  here is remembered separately, only when the visitor presses a language button.

  The text-swapping and mobile-menu code below is deliberately a small copy of the
  matching parts of js/script.js: sharing it would mean changing the landing page's
  script, which spec #36 says must behave exactly as before. If you fix a bug in one
  copy, check the other.
*/

/* ---------- 1. Language ---------- */

const courseLanguage = createCourseLanguage({
  search: window.location.search,
  storage: courseStorage(),
});

// localStorage, or nothing when the browser blocks it (even reading the name can throw).
function courseStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return { getItem: () => null, setItem: () => {} };
  }
}

function applyLanguage(language) {
  const text = TRANSLATIONS[language];

  // Language + direction for the whole page: Arabic reads right-to-left.
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  // Visible text: <span data-i18n="key">
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = text[element.dataset.i18n];
    if (value !== undefined) element.textContent = value;
  });

  // Screen-reader labels: <nav data-i18n-aria-label="key">
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const value = text[element.dataset.i18nAriaLabel];
    if (value !== undefined) element.setAttribute("aria-label", value);
  });

  // Page description for search engines: <meta data-i18n-content="key">
  document.querySelectorAll("[data-i18n-content]").forEach((element) => {
    const value = text[element.dataset.i18nContent];
    if (value !== undefined) element.setAttribute("content", value);
  });

  // Show which language button is selected.
  document.querySelectorAll(".lang-switch__btn").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  });

  // Links to other course pages carry the language in their address, so it
  // stays even when the browser keeps nothing.
  document.querySelectorAll("a[data-course-link]").forEach((link) => {
    link.dataset.courseHref = link.dataset.courseHref || link.getAttribute("href");
    link.setAttribute("href", courseLanguage.link(link.dataset.courseHref));
  });

  updateMenuLabel(language);
}

document.querySelectorAll(".lang-switch__btn").forEach((button) => {
  button.addEventListener("click", () => {
    courseLanguage.select(button.dataset.lang);
    applyLanguage(courseLanguage.current());
    // Keep the address in step, so a reload shows the language just chosen.
    try {
      const address = new URL(window.location.href);
      address.searchParams.set("lang", courseLanguage.current());
      history.replaceState(null, "", address);
    } catch (error) {
      /* some browsers block this for local files: the page still works */
    }
  });
});

/* ---------- 2. Mobile menu ---------- */

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.getElementById("mobile-menu");

function isMenuOpen() {
  return menuButton.getAttribute("aria-expanded") === "true";
}

function updateMenuLabel(language) {
  const key = isMenuOpen() ? "a11y.menuClose" : "a11y.menuOpen";
  menuButton.setAttribute("aria-label", TRANSLATIONS[language][key]);
}

function setMenuOpen(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
  updateMenuLabel(courseLanguage.current());
}

menuButton.addEventListener("click", () => setMenuOpen(!isMenuOpen()));

// Escape closes the menu and puts the keyboard focus back on the button.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isMenuOpen()) {
    setMenuOpen(false);
    menuButton.focus();
  }
});

/* ---------- 3. Lesson list (Lesson pages only) ---------- */

// On phones the list of Lessons sits behind a "Lessons" button; on wider screens it is
// always open and the CSS hides the button. Without this script the list stays open.
const lessonNav = document.querySelector("[data-lesson-nav]");
if (lessonNav) {
  const toggle = lessonNav.querySelector(".lesson-nav__toggle");

  function setLessonNavOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    lessonNav.classList.toggle("is-open", open);
  }

  lessonNav.classList.add("lesson-nav--enhanced");
  toggle.addEventListener("click", () => setLessonNavOpen(toggle.getAttribute("aria-expanded") !== "true"));

  // Choosing a Lesson or a Section closes the list, so it does not cover the text.
  lessonNav.querySelectorAll(".lesson-nav__panel a").forEach((link) => {
    link.addEventListener("click", () => setLessonNavOpen(false));
  });

  // Escape closes the list and puts the keyboard focus back on the button.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true" && toggle.offsetParent !== null) {
      setLessonNavOpen(false);
      toggle.focus();
    }
  });
}

/* ---------- 4. Self-check (Lesson pages only) ---------- */

// Each question is a group of answer buttons. Choosing one shows whether it is right and
// why; a wrong choice also shows the correct answer and why. Nothing is scored or saved,
// and choosing again just replaces the feedback. The feedback box is always on the page
// (empty until the first choice) so screen readers announce what is put into it. Without this script the explanations
// stay visible under every answer, so the Lesson still reads.
document.querySelectorAll(".self-check__item").forEach((item) => {
  const options = [...item.querySelectorAll(".self-check__option")];
  const feedback = item.querySelector(".self-check__feedback");
  const whyOf = (option) => option.parentElement.querySelector(".self-check__why");
  const textOf = (option) => option.querySelector(".self-check__text").textContent;

  item.classList.add("self-check__item--enhanced");
  item.querySelectorAll(".self-check__why").forEach((why) => (why.hidden = true));

  function choose(chosen) {
    const answer = options.find((option) => option.dataset.correct === "true");
    const right = chosen === answer;

    options.forEach((option) => {
      option.setAttribute("aria-pressed", String(option === chosen));
      option.classList.toggle("is-right", option === chosen && right);
      option.classList.toggle("is-wrong", option === chosen && !right);
      option.classList.toggle("is-answer", option === answer && !right);
    });

    const parts = [whyOf(chosen).cloneNode(true)];
    if (!right) {
      const label = document.createElement("strong");
      label.dataset.i18n = "course.selfCheck.correctAnswer";
      label.textContent = TRANSLATIONS[courseLanguage.current()]["course.selfCheck.correctAnswer"];
      const correct = document.createElement("p");
      correct.className = "self-check__correct";
      const answerWhy = whyOf(answer).cloneNode(true);
      answerWhy.hidden = false;
      correct.append(label, " ", textOf(answer), " ", answerWhy);
      parts.push(correct);
    }
    parts.forEach((part) => (part.hidden = false));
    feedback.replaceChildren(...parts);
    feedback.className = "self-check__feedback " + (right ? "is-right" : "is-wrong");
  }

  options.forEach((option) => option.addEventListener("click", () => choose(option)));
});

/* ---------- 5. Code boxes (Lesson pages only) ---------- */

// Each box holds one prompt or command in <code>. The Copy button is added here, not written
// in the HTML, so a visitor without this script never sees a button that does nothing.
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      /* blocked: fall through to the older way */
    }
  }
  // The older way, for browsers that keep the clipboard from local files.
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.append(helper);
  helper.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  helper.remove();
  return copied;
}

document.querySelectorAll(".code-box").forEach((box) => {
  const code = box.querySelector("code");
  if (!code) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-box__copy";
  button.dataset.i18n = "course.copy";
  // The message sits next to the button and is announced to screen readers.
  const status = document.createElement("span");
  status.className = "code-box__status";
  status.setAttribute("role", "status");
  box.prepend(button, status);

  let clearTimer;
  button.addEventListener("click", async () => {
    const copied = await copyText(code.textContent);
    const key = copied ? "course.copied" : "course.copyFailed";
    // Kept as a key, so switching language while it shows translates it too.
    status.dataset.i18n = key;
    status.textContent = TRANSLATIONS[courseLanguage.current()][key];
    status.classList.toggle("is-failed", !copied);
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      delete status.dataset.i18n;
      status.replaceChildren();
    }, 4000);
  });
});

/* ---------- 6. Mac / Windows tabs (Lesson pages only) ---------- */

// Each panel is one system's steps, named by data-tab-label. Without this script every
// panel stays visible under its own title, so the steps still read. With it, one panel
// shows at a time. Left/Right (swapped when the tabs read right to left), Home and End move between the tabs.
document.querySelectorAll("[data-tabs]").forEach((group, groupIndex) => {
  const panels = [...group.querySelectorAll(":scope > .tabs__panel")];
  if (panels.length < 2) return;

  const list = document.createElement("div");
  list.className = "tabs__list";
  list.setAttribute("role", "tablist");
  list.dataset.i18nAriaLabel = "course.tabs.label";

  const tabs = panels.map((panel, i) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tabs__tab";
    tab.setAttribute("role", "tab");
    tab.id = `tabs-${groupIndex}-tab-${i}`;
    tab.textContent = panel.dataset.tabLabel;
    panel.id = panel.id || `tabs-${groupIndex}-panel-${i}`;
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    list.append(tab);
    return tab;
  });

  function select(index, focus) {
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      // The Lesson text is right to left even when the page is not, so ask the tabs themselves.
      const rtl = getComputedStyle(list).direction === "rtl";
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const backward = rtl ? "ArrowRight" : "ArrowLeft";
      const moves = {
        [forward]: (i + 1) % tabs.length,
        [backward]: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (event.key in moves) {
        event.preventDefault();
        select(moves[event.key], true);
      }
    });
  });

  group.classList.add("tabs--enhanced");
  group.prepend(list);
  select(0, false);
});

/* ---------- 7. Printable برشامة (Lesson pages that have one) ---------- */

document.querySelectorAll(".barshama").forEach((sheet) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "barshama__print";
  button.dataset.i18n = "course.print";
  button.addEventListener("click", () => window.print());
  sheet.append(button);
});

/* ---------- 8. Checklist progress ---------- */

// Ticks are remembered in this browser only (js/course-progress.js). A Lesson shows its done
// mark in the sidebar, and on the hub card, only when every item is ticked; the Lesson page
// also shows the celebration then. Without storage, ticking still works for the visit.
const courseProgress = createCourseProgress(courseStorage());

function showCompleteMark(lessonId, complete) {
  const lessonNumber = lessonId.replace("lesson-", "");
  document.querySelectorAll(`[data-lesson="${lessonNumber}"] [data-complete-mark]`).forEach((mark) => {
    mark.hidden = !complete;
  });
}

// The region is always on the page and empty until the Lesson is complete, so a screen reader
// that watches it announces what is put in. The line keeps its key, so a language switch
// translates it too.
function showCelebration(region, complete) {
  if (!complete) return region.replaceChildren();
  if (region.firstChild) return;
  const bird = document.createElement("img");
  bird.className = "celebration__bird";
  bird.src = region.dataset.bird;
  bird.alt = "";
  const line = document.createElement("p");
  // The Lesson section is right to left, but the line follows the page's language.
  line.dir = "auto";
  const words = document.createElement("strong");
  words.dataset.i18n = "course.celebration";
  words.textContent = TRANSLATIONS[courseLanguage.current()]["course.celebration"];
  line.append(words);
  region.append(bird, line);
}

document.querySelectorAll("[data-checklist]").forEach((list) => {
  const lessonId = list.dataset.checklist;
  const boxes = [...list.querySelectorAll("input[data-item]")];
  const checklist = courseProgress.open(lessonId, boxes.map((box) => box.dataset.item));
  const celebration = document.querySelector("[data-celebration]");

  function showProgress() {
    showCompleteMark(lessonId, checklist.isComplete());
    if (celebration) showCelebration(celebration, checklist.isComplete());
  }

  boxes.forEach((box) => {
    box.checked = checklist.isTicked(box.dataset.item);
    box.addEventListener("change", () => {
      checklist.set(box.dataset.item, box.checked);
      showProgress();
    });
  });
  showProgress();
});

// The hub has no checklist: each Lesson card asks what its Lesson page saved.
// The hub judges each card by the Lesson's current items (the card lists the same
// identifiers as the Lesson page) and the saved ticks.
function showHubMarks() {
  document.querySelectorAll(".lesson-card[data-checklist-items]").forEach((card) => {
    const lessonId = "lesson-" + card.dataset.lesson;
    const itemIds = card.dataset.checklistItems.split(/\s+/).filter(Boolean);
    showCompleteMark(lessonId, courseProgress.isLessonComplete(lessonId, itemIds));
  });
}

if (!document.querySelector("[data-checklist]")) {
  showHubMarks();
  // Coming back with the browser's Back button can show the hub from memory: ask again.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) showHubMarks();
  });
}

/* ---------- 9. Footer year + start ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
applyLanguage(courseLanguage.current());

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
    parts.note.classList.toggle("is-error", state.message === "account.signInFailed");
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
