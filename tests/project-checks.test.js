// The checks in checks.js, run on the project's own files (spec #31).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  findParityProblems,
  findHtmlReferenceProblems,
  findScriptReferenceProblems,
  findStaleExceptions,
  findSyntaxProblems,
} = require("./checks.js");
const { TRANSLATIONS } = require("../js/translations.js");

const ROOT = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("English and Arabic translations match", () => {
  assert.ok(TRANSLATIONS && TRANSLATIONS.en && TRANSLATIONS.ar, "translations not loaded");
  assert.deepEqual(findParityProblems(TRANSLATIONS), []);
});

for (const page of ["index.html", "dashboard.html"]) {
  test(`every translation key named in ${page} exists in both languages`, () => {
    assert.deepEqual(findHtmlReferenceProblems(read(page), TRANSLATIONS), []);
  });
}

// The site's scripts, except the translations themselves.
const SCRIPTS = fs
  .readdirSync(path.join(ROOT, "js"))
  .filter((name) => name.endsWith(".js") && name !== "translations.js")
  .map((name) => `js/${name}`);

for (const file of SCRIPTS) {
  test(`every translation key named in ${file} exists in both languages`, () => {
    assert.deepEqual(findScriptReferenceProblems(read(file), TRANSLATIONS, { file }), []);
  });
}

test("every exception in the script exceptions list still matches its string", () => {
  const scripts = Object.fromEntries(SCRIPTS.map((file) => [file, read(file)]));
  assert.deepEqual(findStaleExceptions(scripts), []);
});

// Every project JavaScript file, found again on each run: all .js files in js/
// and tests/, at any depth. Vendored skills and the Deno Edge Function are
// outside these folders.
const listScripts = (folder) =>
  fs
    .readdirSync(path.join(ROOT, folder), { recursive: true })
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(folder, name));

test("every project JavaScript file parses", () => {
  const files = [...listScripts("js"), ...listScripts("tests")];
  assert.ok(files.includes(path.join("js", "form.js")) && files.includes(path.join("tests", "checks.js")));
  assert.deepEqual(findSyntaxProblems(files.map((file) => path.join(ROOT, file))), []);
});
