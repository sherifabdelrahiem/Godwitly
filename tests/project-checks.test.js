// The checks in checks.js, run on the project's own files (spec #31).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  findParityProblems,
  findHtmlReferenceProblems,
  findScriptReferenceProblems,
  findExceptionListProblems,
  findSyntaxProblems,
  findCourseHubProblems,
  findHubChecklistProblems,
  findCourseLessonProblems,
} = require("./checks.js");
const { LESSONS } = require("./course-lessons.js");
const { TRANSLATIONS } = require("../js/translations.js");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("English and Arabic translations match", () => {
  assert.ok(TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.ar, "translations not loaded");
  assert.deepEqual(findParityProblems(TRANSLATIONS), []);
});

// The hub and every Lesson that is released (its page exists).
const RELEASED_PAGES = LESSONS.filter((lesson) => lesson.released).map((lesson) => `crash-course/${lesson.page}`);

for (const page of ["index.html", "dashboard.html", "crash-course/index.html", ...RELEASED_PAGES]) {
  test(`every translation key named in ${page} exists in both languages`, () => {
    assert.deepEqual(findHtmlReferenceProblems(read(page), TRANSLATIONS), []);
  });
}

// Every .js file in a folder, at any depth, found again on each run.
const listScripts = (folder) =>
  fs
    .readdirSync(path.join(ROOT, folder), { recursive: true })
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(folder, name));

// The site's scripts, except the translations themselves.
const SCRIPTS = listScripts("js").filter((file) => file !== path.join("js", "translations.js"));

for (const file of SCRIPTS) {
  test(`every translation key named in ${file} exists in both languages`, () => {
    assert.deepEqual(findScriptReferenceProblems(read(file), TRANSLATIONS, { file }), []);
  });
}

test("every exception in the script exceptions list has a reason and still matches its string", () => {
  const scripts = Object.fromEntries(SCRIPTS.map((file) => [file, read(file)]));
  assert.deepEqual(findExceptionListProblems(scripts), []);
});

// Every project JavaScript file: all .js files in js/ and tests/. Vendored
// skills and the Deno Edge Function are outside these folders.
test("every project JavaScript file parses", () => {
  const files = [...listScripts("js"), ...listScripts("tests")];
  assert.ok(files.includes(path.join("js", "form.js")) && files.includes(path.join("tests", "checks.js")));
  assert.deepEqual(findSyntaxProblems(files.map((file) => path.join(ROOT, file))), []);
});

test("the real hub shows the agreed Lessons, in order, with the agreed availability", () => {
  assert.deepEqual(findCourseHubProblems(read("crash-course/index.html"), LESSONS), []);
});

test("the real hub card of each released Lesson lists the items of its Lesson page", () => {
  const pages = Object.fromEntries(
    LESSONS.filter((lesson) => lesson.released).map((lesson) => [lesson.number, read(`crash-course/${lesson.page}`)]),
  );
  assert.deepEqual(findHubChecklistProblems(read("crash-course/index.html"), LESSONS, pages), []);
});

test("every agreed Lesson has a title in both languages", () => {
  for (const { titleKey } of LESSONS) {
    for (const language of Object.keys(TRANSLATIONS)) {
      assert.ok(TRANSLATIONS[language][titleKey], `${titleKey} missing in ${language}`);
    }
  }
});

for (const { number, page } of LESSONS.filter((lesson) => lesson.released)) {
  test(`the real Lesson ${number} page passes the Lesson page rules`, () => {
    const file = `crash-course/${page}`;
    const exists = (target) => fs.existsSync(path.join(ROOT, target));
    assert.deepEqual(
      findCourseLessonProblems(read(file), { file, courseDir: "crash-course", lessons: LESSONS, exists }),
      [],
    );
  });
}
