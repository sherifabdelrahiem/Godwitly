/*
  Small helpers for the landing page. Nothing here talks to a server.

    1. Language switcher (English <-> Arabic)
    2. Mobile menu (open / close)
    3. Product tabs (desktop only)
    4. Smooth scrolling for the section links
    5. Current year in the footer
*/

/* ---------- 1. Language switcher ---------- */

const STORAGE_KEY = "godwitly-language";
let currentLanguage = "en";

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

  // Picture descriptions: <img data-i18n-alt="key">
  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    const value = text[element.dataset.i18nAlt];
    if (value !== undefined) element.alt = value;
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

  updateMenuLabel();

  // Tell other scripts (the contact form) to re-translate their messages.
  document.dispatchEvent(new CustomEvent("godwitly:languagechange"));

  // Remember the choice for next time (some browsers block this for local files).
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    /* not saved — the page still works */
  }
}

function getStartLanguage() {
  // A link like index.html?lang=ar opens the Arabic version directly.
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

document.querySelectorAll(".lang-switch__btn").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

/* ---------- 2. Mobile menu ---------- */

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.getElementById("mobile-menu");

function isMenuOpen() {
  return menuButton.getAttribute("aria-expanded") === "true";
}

function updateMenuLabel() {
  const key = isMenuOpen() ? "a11y.menuClose" : "a11y.menuOpen";
  menuButton.setAttribute("aria-label", TRANSLATIONS[currentLanguage][key]);
}

function setMenuOpen(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  mobileMenu.hidden = !open;
  updateMenuLabel();
}

menuButton.addEventListener("click", () => setMenuOpen(!isMenuOpen()));

// Escape closes the menu and puts the keyboard focus back on the button.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isMenuOpen()) {
    setMenuOpen(false);
    menuButton.focus();
  }
});

/* ---------- 3. Product tabs (desktop) ---------- */

const tabs = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".product"));
const desktop = window.matchMedia("(min-width: 1024px)");
let activeTab = 0;

function showTab(index, moveFocus) {
  activeTab = index;
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) tab.focus();
  });
  panels.forEach((panel, i) => {
    // On mobile all cards are visible, so only hide panels on desktop.
    const hidden = desktop.matches && i !== index;
    panel.classList.toggle("is-hidden", hidden);
    panel.setAttribute("aria-hidden", String(hidden));
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showTab(index, false));
});

// Arrow keys move between tabs. In Arabic the arrows are swapped,
// because the tabs run from right to left.
document.querySelector(".tabs").addEventListener("keydown", (event) => {
  const last = tabs.length - 1;
  const rtl = document.documentElement.dir === "rtl";
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const back = rtl ? "ArrowRight" : "ArrowLeft";
  let next = null;
  if (event.key === forward) next = activeTab === last ? 0 : activeTab + 1;
  if (event.key === back) next = activeTab === 0 ? last : activeTab - 1;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = last;
  if (next === null) return;
  event.preventDefault();
  showTab(next, true);
});

desktop.addEventListener("change", () => showTab(activeTab, false));

/* ---------- 4. Smooth scrolling for section links ---------- */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (isMenuOpen()) setMenuOpen(false);
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    // Move keyboard focus too, so the next Tab continues from that section.
    target.focus({ preventScroll: true });
    history.replaceState(null, "", "#" + id);
  });
});

/* ---------- 5. Footer year + start ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
setLanguage(getStartLanguage());
showTab(0, false);
