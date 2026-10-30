// Course language selection (spec #36, Seam 3): which language a Crash course page opens in,
// what is saved, and how links between course pages carry it.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createCourseLanguage } = require("../js/course-language.js");

// A storage that behaves like localStorage, and records what was written.
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

test("a valid ?lang= in the address wins over a saved course choice", () => {
  const storage = fakeStorage({ "godwitly-course-language": "ar" });
  const course = createCourseLanguage({ search: "?lang=en", storage });
  assert.equal(course.current(), "en");
});

test("a saved course choice is used when the address has no ?lang=", () => {
  const storage = fakeStorage({ "godwitly-course-language": "en" });
  const course = createCourseLanguage({ search: "", storage });
  assert.equal(course.current(), "en");
});

// A storage that refuses every read and write, like a blocked browser or a private window.
const blockedStorage = {
  getItem: () => {
    throw new Error("storage blocked");
  },
  setItem: () => {
    throw new Error("storage blocked");
  },
};

test("a storage read that throws gives Arabic, or the address language", () => {
  assert.equal(createCourseLanguage({ search: "", storage: blockedStorage }).current(), "ar");
  assert.equal(createCourseLanguage({ search: "?lang=en", storage: blockedStorage }).current(), "en");
});

test("an invalid ?lang= is ignored and the saved choice decides", () => {
  const storage = fakeStorage({ "godwitly-course-language": "en" });
  assert.equal(createCourseLanguage({ search: "?lang=fr", storage }).current(), "en");
  assert.equal(createCourseLanguage({ search: "?lang=", storage }).current(), "en");
});

test("an invalid ?lang= with nothing saved gives Arabic", () => {
  assert.equal(createCourseLanguage({ search: "?lang=fr", storage: fakeStorage() }).current(), "ar");
});

test("nothing saved gives Arabic", () => {
  assert.equal(createCourseLanguage({ search: "", storage: fakeStorage() }).current(), "ar");
});

test("only the site's own saved language present still gives Arabic", () => {
  // The landing page saves this on every visit; course pages must not read it.
  const storage = fakeStorage({ "godwitly-language": "en" });
  assert.equal(createCourseLanguage({ search: "", storage }).current(), "ar");
});

test("a ?lang= in the address is never saved", () => {
  const storage = fakeStorage();
  createCourseLanguage({ search: "?lang=en", storage }).current();
  assert.deepEqual(storage.data, {});
});

test("choosing a language changes the current one and saves it under the course's own name", () => {
  const storage = fakeStorage();
  const course = createCourseLanguage({ search: "", storage });
  course.select("en");
  assert.equal(course.current(), "en");
  assert.deepEqual(storage.data, { "godwitly-course-language": "en" });
  // The site's own saved language is left alone.
  assert.equal("godwitly-language" in storage.data, false);
});

test("the saved choice is used on the next visit", () => {
  const storage = fakeStorage();
  createCourseLanguage({ search: "", storage }).select("en");
  assert.equal(createCourseLanguage({ search: "", storage }).current(), "en");
});

test("when saving fails, choosing a language still changes it for the visit", () => {
  const course = createCourseLanguage({ search: "", storage: blockedStorage });
  course.select("en");
  assert.equal(course.current(), "en");
});

test("choosing a language that does not exist changes nothing and saves nothing", () => {
  const storage = fakeStorage();
  const course = createCourseLanguage({ search: "", storage });
  course.select("fr");
  assert.equal(course.current(), "ar");
  assert.deepEqual(storage.data, {});
});

test("a link to another course page carries the current language in its address", () => {
  const course = createCourseLanguage({ search: "", storage: fakeStorage() });
  assert.equal(course.link("lesson-1/index.html"), "lesson-1/index.html?lang=ar");
  course.select("en");
  assert.equal(course.link("lesson-1/index.html"), "lesson-1/index.html?lang=en");
});

test("a link keeps its other parameters and its #section, and replaces an older ?lang=", () => {
  const course = createCourseLanguage({ search: "?lang=en", storage: fakeStorage() });
  assert.equal(course.link("index.html?lang=ar"), "index.html?lang=en");
  assert.equal(course.link("index.html?step=2"), "index.html?step=2&lang=en");
  assert.equal(course.link("lesson-2/index.html#install"), "lesson-2/index.html?lang=en#install");
});

test("a link to somewhere that is not a course page is left as it is", () => {
  const course = createCourseLanguage({ search: "?lang=en", storage: fakeStorage() });
  assert.equal(course.link("https://claude.ai/download"), "https://claude.ai/download");
  assert.equal(course.link("mailto:hello@example.com"), "mailto:hello@example.com");
});
