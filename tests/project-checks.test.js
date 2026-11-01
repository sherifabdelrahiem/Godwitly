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
  findManifestChecklistProblems,
  findCourseLessonProblems,
  findManifestProblems,
  findPublicPartProblems,
  findDeployListProblems,
  findAccountsDeployProblems,
  ACCOUNT_MATERIAL,
} = require("./checks.js");
const { MANIFESTS, publicPart } = require("../courses/manifest.js");
const { TRANSLATIONS } = require("../js/translations.js");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("English and Arabic translations match", () => {
  assert.ok(TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.ar, "translations not loaded");
  assert.deepEqual(findParityProblems(TRANSLATIONS), []);
});

// The Claude Crash Course for Beginners, from its manifest (spec #56, ticket #57). Each Lesson's
// page is lesson-N/index.html in the Crash course folder.
const COURSE = MANIFESTS.find(({ manifest }) => manifest.id === "claude-beginners").manifest;
const LESSONS = COURSE.lessons.map(({ number, titleKey, released }) => ({
  number,
  titleKey,
  released,
  page: `lesson-${number}/index.html`,
}));

// The hub and every Lesson that is released (its page exists).
const RELEASED_PAGES = LESSONS.filter((lesson) => lesson.released).map((lesson) => `${COURSE.folder}/${lesson.page}`);

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

// Every project JavaScript file: all .js files in js/, courses/ and tests/. Vendored
// skills and the Deno Edge Function are outside these folders.
test("every project JavaScript file parses", () => {
  const files = [...listScripts("js"), ...listScripts("courses"), ...listScripts("tests")];
  assert.ok(files.includes(path.join("js", "form.js")) && files.includes(path.join("tests", "checks.js")));
  assert.deepEqual(findSyntaxProblems(files.map((file) => path.join(ROOT, file))), []);
});

test("the real hub shows the agreed Lessons, in order, with the agreed availability", () => {
  assert.deepEqual(findCourseHubProblems(read("crash-course/index.html"), LESSONS), []);
});

test("the real hub cards and Lesson pages list the manifest's checklist items and required flags", () => {
  const pages = Object.fromEntries(
    LESSONS.filter((lesson) => lesson.released).map((lesson) => [lesson.number, read(`${COURSE.folder}/${lesson.page}`)]),
  );
  assert.deepEqual(findManifestChecklistProblems(COURSE, read(`${COURSE.folder}/index.html`), pages), []);
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

for (const { file, manifest } of MANIFESTS) {
  test(`the manifest ${file} follows the manifest rules`, () => {
    assert.deepEqual(findManifestProblems(manifest), []);
  });

  test(`the public part of ${file} holds only the agreed fields`, () => {
    assert.deepEqual(findPublicPartProblems(publicPart(manifest), manifest), []);
  });
}

test("there is one test Crash course: one released Preview Lesson, one released Lesson that needs Enrolment, no public part", () => {
  const testCourses = MANIFESTS.filter(({ manifest }) => manifest.test);
  assert.equal(testCourses.length, 1);
  const { lessons } = testCourses[0].manifest;
  assert.deepEqual(
    lessons.map(({ preview, released }) => ({ preview, released })),
    [{ preview: true, released: true }, { preview: false, released: true }],
  );
  assert.equal(publicPart(testCourses[0].manifest), null);
});

test("each Lesson's summary is its Arabic hub outcome, word for word (the PO, 2026-11-01)", () => {
  for (const { number, summary } of COURSE.lessons) {
    assert.equal(summary, TRANSLATIONS.ar[`course.lesson${number}.outcome`], `Lesson ${number}'s summary`);
  }
});

test("the production deploy file list holds no test Crash course material and no manifest, and only plain paths", () => {
  const paths = read("deploy-files.txt").split(/\r?\n/).filter((line) => line.trim() !== "");
  assert.ok(paths.includes("crash-course/index.html") && paths.includes("index.html"), "deploy-files.txt not read");
  assert.deepEqual(findDeployListProblems(paths, MANIFESTS), []);
});

test("the production deploy list holds no Godwitly accounts material (preview-only until T10)", () => {
  const paths = read("deploy-files.txt").split(/\r?\n/).filter((line) => line.trim() !== "");
  assert.deepEqual(findAccountsDeployProblems(paths), []);
});

test("the preview deploy list is the production list plus all the accounts material, and no test or manifest material", () => {
  const production = read("deploy-files.txt").split(/\r?\n/).filter((line) => line.trim() !== "");
  const preview = read("deploy-files.preview.txt").split(/\r?\n/).filter((line) => line.trim() !== "");
  assert.deepEqual(preview.filter((entry) => !production.includes(entry)).sort(), [...ACCOUNT_MATERIAL].sort());
  assert.deepEqual(findDeployListProblems(preview, MANIFESTS), []);
});

test("the accounts migrations load every Lesson and checklist item of the real manifest, field for field", () => {
  const dir = path.join(ROOT, "supabase/accounts/migrations");
  const sql = fs.readdirSync(dir).filter((name) => name.endsWith(".sql")).map((name) => fs.readFileSync(path.join(dir, name), "utf8")).join("\n");
  const lessonRows = [...sql.matchAll(/\('([^']*)', (\d+), '([^']*)', '((?:[^']|'')*)', (true|false), (true|false), (true|false)\)/g)].map((m) => ({
    course: m[1], number: Number(m[2]), titleKey: m[3], summary: m[4].replace(/''/g, "'"), preview: m[5] === "true", required: m[6] === "true", released: m[7] === "true",
  }));
  const itemRows = [...sql.matchAll(/\('([^']*)', (\d+), '([^']*)', (true|false), (true|false)\)/g)].map((m) => ({
    course: m[1], lesson: Number(m[2]), id: m[3], required: m[4] === "true", retired: m[5] === "true",
  }));
  assert.ok(lessonRows.length > 0 && itemRows.length > 0, "no inserts found in the accounts migrations");
  const real = MANIFESTS.filter(({ manifest }) => !manifest.test);
  for (const { manifest } of real) {
    for (const lesson of manifest.lessons) {
      const row = lessonRows.find((r) => r.course === manifest.id && r.number === lesson.number);
      assert.ok(row, `${manifest.id} Lesson ${lesson.number} is not in the accounts migrations`);
      assert.deepEqual(
        [row.titleKey, row.summary, row.preview, row.required, row.released],
        [lesson.titleKey, lesson.summary, lesson.preview, lesson.required, lesson.released],
        `${manifest.id} Lesson ${lesson.number} differs from the manifest`,
      );
      for (const item of lesson.items) {
        const itemRow = itemRows.find((r) => r.course === manifest.id && r.lesson === lesson.number && r.id === item.id);
        assert.ok(itemRow, `${manifest.id} Lesson ${lesson.number} item ${item.id} is not in the accounts migrations`);
        assert.deepEqual([itemRow.required, itemRow.retired], [item.required, Boolean(item.retired)], `item ${item.id} differs`);
      }
    }
  }
  // Nothing test-only is loaded into the accounts project by these migrations.
  for (const { manifest } of MANIFESTS.filter(({ manifest }) => manifest.test)) {
    assert.equal(lessonRows.some((r) => r.course === manifest.id), false, `test course ${manifest.id} is in a migration`);
  }
});
