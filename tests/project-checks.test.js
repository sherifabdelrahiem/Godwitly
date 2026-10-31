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
} = require("./checks.js");
const { TRANSLATIONS } = require("../js/translations.js");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("English and Arabic translations match", () => {
  assert.ok(TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.ar, "translations not loaded");
  assert.deepEqual(findParityProblems(TRANSLATIONS), []);
});

for (const page of ["index.html", "dashboard.html", "crash-course/index.html"]) {
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
