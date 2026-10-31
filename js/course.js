/*
  Small helpers for the Crash course pages. Nothing here talks to a server.

    1. Language (English <-> Arabic), chosen by js/course-language.js
    2. Mobile menu (open / close)
    3. Current year in the footer

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

/* ---------- 3. Footer year + start ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
applyLanguage(courseLanguage.current());
