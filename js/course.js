/*
  Small helpers for the Crash course pages. Nothing here talks to a server.

    1. Language (English <-> Arabic), chosen by js/course-language.js
    2. Mobile menu (open / close)
    3. The Lesson list on Lesson pages (open / close on phones)
    4. The Self-check: choose an answer, see why it is right or wrong
    5. Current year in the footer

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

/* ---------- 5. Footer year + start ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
applyLanguage(courseLanguage.current());
