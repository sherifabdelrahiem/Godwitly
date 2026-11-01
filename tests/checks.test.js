// The checks in checks.js, on small examples written here (spec #31).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  findParityProblems,
  findHtmlReferenceProblems,
  findScriptReferenceProblems,
  findExceptionListProblems,
  findSyntaxProblems,
  findCourseHubProblems,
  findManifestChecklistProblems,
  findManifestProblems,
  findPublicPartProblems,
  findDeployListProblems,
  findCourseLessonProblems,
} = require("./checks.js");
const { publicPart } = require("../courses/manifest.js");

test("parity: reports a key that only one language has", () => {
  const problems = findParityProblems({
    en: { "nav.home": "Home", "nav.why": "Why Godwitly" },
    ar: { "nav.home": "الرئيسية" },
  });
  assert.deepEqual(problems, ['"nav.why" is missing in ar']);
});

test("parity: reports text that is empty, only spaces, or not a string", () => {
  const problems = findParityProblems({
    en: { "a.one": "", "a.two": "  ", "a.three": 3, "a.four": "Fine" },
    ar: { "a.one": "واحد", "a.two": "اثنان", "a.three": "ثلاثة", "a.four": "جيد" },
  });
  assert.deepEqual(problems, [
    '"a.one" in en is blank',
    '"a.two" in en is blank',
    '"a.three" in en is blank',
  ]);
});

test("parity: reports a key whose {placeholders} differ between the languages", () => {
  const problems = findParityProblems({
    en: { "form.left": "Characters left: {n}", "dash.count": "Showing {shown} of {total}" },
    ar: { "form.left": "الأحرف المتبقية", "dash.count": "يُعرض {total} من أصل {shown}" },
  });
  assert.deepEqual(problems, ['"form.left" uses {n} in en but nothing in ar']);
});

const SMALL = {
  en: { "nav.home": "Home", "a11y.menu": "Menu" },
  ar: { "nav.home": "الرئيسية", "a11y.menu": "القائمة" },
};

test("pages: reports a data-i18n key that doesn't exist", () => {
  const html = '<a data-i18n="nav.home">Home</a> <a data-i18n="nav.hmoe">Home</a>';
  assert.deepEqual(findHtmlReferenceProblems(html, SMALL), [
    'data-i18n "nav.hmoe": no such key in en',
    'data-i18n "nav.hmoe": no such key in ar',
  ]);
});

test("pages: ignores references inside HTML comments, on one line or several", () => {
  const html = [
    '<!-- e.g. <span data-i18n="...">  -->',
    "<!--",
    '  <img data-i18n-alt="old.picture">',
    "-->",
    '<a data-i18n="nav.home">Home</a>',
  ].join("\n");
  assert.deepEqual(findHtmlReferenceProblems(html, SMALL), []);
});

test("pages: checks every data-i18n-* attribute, including ones added later", () => {
  const html =
    '<nav data-i18n-aria-label="a11y.menu"></nav> <input data-i18n-placeholder="a11y.find"> <b data-i18n-title="nav.gone"></b>';
  assert.deepEqual(findHtmlReferenceProblems(html, SMALL), [
    'data-i18n-placeholder "a11y.find": no such key in en',
    'data-i18n-placeholder "a11y.find": no such key in ar',
    'data-i18n-title "nav.gone": no such key in en',
    'data-i18n-title "nav.gone": no such key in ar',
  ]);
});

// Scripts are checked as text; `file` only labels the problems.
const scriptProblems = (source, exceptions = []) =>
  findScriptReferenceProblems(source, SMALL, { file: "js/x.js", exceptions });

test("scripts: reports a key-shaped string that isn't a key, with its line", () => {
  const source = 'const a = t("nav.home");\nconst b = t("nav.hmoe");';
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:2: "nav.hmoe" looks like a translation key but there is no such key in en, ar',
  ]);
});

test("scripts: skips comments, and isn't fooled by quotes inside regular expressions", () => {
  const source = [
    '// old: t("nav.gone")',
    '/* also old: t("nav.gone2") */',
    "const quote = /\"/g; const apostrophe = /'/;",
    'const label = t("nav.typo");',
    "const ok = t(`a11y.menu`);",
  ].join("\n");
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:4: "nav.typo" looks like a translation key but there is no such key in en, ar',
  ]);
});

test("scripts: also checks template strings with no ${} slots", () => {
  assert.deepEqual(scriptProblems("t(`nav.hmoe`);"), [
    'js/x.js:1: "nav.hmoe" looks like a translation key but there is no such key in en, ar',
  ]);
});

test("scripts R1: rejects a key prefix such as \"dash.\" joined to something", () => {
  const source = [
    'const a = t("dash." + name);',
    "const b = t(`dash.${name}`);",
    'const c = t("dash.".concat(name));',
    'const d = "Saved." + note + "etc. " + more;', // near-misses: allowed
  ].join("\n");
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:1: key built from pieces (R1): "dash." followed by +',
    'js/x.js:2: key built from pieces (R1): "dash." followed by ${',
    'js/x.js:3: key built from pieces (R1): "dash." followed by .concat(',
  ]);
});

test("scripts R2: rejects \".word\" straight after a template slot", () => {
  const source = [
    "const a = t(`${ns}.title`);",
    "const b = `Total: ${n}.`;", // near-miss: allowed
    "const c = `${n} .note`;", // near-miss: allowed
  ].join("\n");
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:1: key built from pieces (R2): ".title" straight after ${…}',
  ]);
});

test("scripts R3: rejects a \".word\" string straight after +", () => {
  const source = [
    'const a = t(ns + ".title");',
    'const b = count + ". Next";', // near-miss: allowed
    'const c = sentence + ".";', // near-miss: allowed
    'const d = list.querySelector(".field");', // near-miss: not after +
  ].join("\n");
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:1: key built from pieces (R3): ".title" straight after +',
  ]);
});

test("scripts: an exception lets one dotted string that isn't a key through, in its own file only", () => {
  const exceptions = [{ text: "config.js", file: "js/x.js", reason: "a file name, not a key" }];
  assert.deepEqual(scriptProblems('load("config.js");', exceptions), []);
  assert.deepEqual(
    findScriptReferenceProblems('load("config.js");', SMALL, { file: "js/y.js", exceptions }),
    ['js/y.js:1: "config.js" looks like a translation key but there is no such key in en, ar'],
  );
});

test("scripts: reports an exception that no longer matches anything", () => {
  const scripts = { "js/x.js": 'load("config.js");', "js/y.js": 'load("other.js");' };
  const exceptions = [
    { text: "config.js", file: "js/x.js", reason: "still used" },
    { text: "old.js", file: "js/x.js", reason: "removed since" },
    { text: "config.js", file: "js/gone.js", reason: "file deleted" },
  ];
  assert.deepEqual(findExceptionListProblems(scripts, exceptions), [
    'exception "old.js" in js/x.js matches nothing; remove it',
    'exception "config.js" in js/gone.js matches nothing; remove it',
  ]);
});

// Limits (spec #31): these ways of building a key aren't detected (see the
// Limits list in checks.js). This test records that, so nobody claims the
// checker catches every dynamic key.
test("scripts: documented limits, these built keys pass unnoticed", () => {
  const source = [
    't([ns, "title"].join("."));',
    "t(ns + sep + name);",
    't(ns + "." + name);',
    "t(`${ns}.${name}`);",
    'const p = "nav."; t(p + name);',
    'key += ".title";',
  ].join("\n");
  assert.deepEqual(scriptProblems(source), []);
});

test("syntax: checks each file on its own, so a broken file after a good one is caught", () => {
  // Temporary files outside the repository; nothing broken is ever committed.
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "godwitly-syntax-"));
  try {
    const good = path.join(folder, "good.js");
    const broken = path.join(folder, "broken.js");
    fs.writeFileSync(good, "const fine = 1;\n");
    fs.writeFileSync(broken, "const broken = ;\n");
    const problems = findSyntaxProblems([good, broken]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /broken\.js: SyntaxError/);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test("scripts: tells division from a regular expression after ++, --, await, else, throw, yield and do, and after properties with those names", () => {
  const source = [
    'const half = count++ / 2; t("nav.typo1"); const third = 1 / 3;',
    'const left = count-- / 2; t("nav.typo2"); const fifth = 1 / 5;',
    'async function a() { return await /"/.source + t("nav.typo3"); }',
    'if (ok) run(); else /"/.test(s); t("nav.typo4");',
    'function fail() { throw /"/.source + t("nav.typo5"); }',
    'function* gen() { yield /"/.source; t("nav.typo6"); }',
    'do /"/.test(s); while (t("nav.typo7"));',
    'const ratio = options.do / 2; t("nav.typo8"); const r = options.yield / 3;',
  ].join("\n");
  assert.deepEqual(
    scriptProblems(source).map((problem) => problem.match(/"(nav\.\w+)"/)[1]),
    ["nav.typo1", "nav.typo2", "nav.typo3", "nav.typo4", "nav.typo5", "nav.typo6", "nav.typo7", "nav.typo8"],
  );
});

test("scripts: counts lines after a backslash line break in a template or string", () => {
  const source = 'const s = `a\\\n b`;\nconst q = "c\\\nd";\nt("nav.typo");';
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:5: "nav.typo" looks like a translation key but there is no such key in en, ar',
  ]);
});

test("scripts: an exception lifts only the key check, never R1-R3", () => {
  const exceptions = [{ text: "dash.", file: "js/x.js", reason: "trying to hide a built key" }];
  assert.deepEqual(scriptProblems('t("dash." + name);', exceptions), [
    'js/x.js:1: key built from pieces (R1): "dash." followed by +',
  ]);
});

test("scripts: reports an exception without a reason", () => {
  const scripts = { "js/x.js": 'load("config.js");' };
  const exceptions = [{ text: "config.js", file: "js/x.js", reason: "  " }];
  assert.deepEqual(findExceptionListProblems(scripts, exceptions), [
    'exception "config.js" in js/x.js has no reason; add one',
  ]);
});

test("pages: checks single-quoted and unquoted attribute values too", () => {
  const html = "<a data-i18n='nav.one'>x</a> <b data-i18n=nav.two>y</b> <i data-i18n=\"nav.home\">z</i>";
  assert.deepEqual(findHtmlReferenceProblems(html, SMALL), [
    'data-i18n "nav.one": no such key in en',
    'data-i18n "nav.one": no such key in ar',
    'data-i18n "nav.two": no such key in en',
    'data-i18n "nav.two": no such key in ar',
  ]);
});

test("scripts: counts the line break that ends an unfinished regular expression", () => {
  const source = 'x = /ab\n; t("nav.typo");';
  assert.deepEqual(scriptProblems(source), [
    'js/x.js:2: "nav.typo" looks like a translation key but there is no such key in en, ar',
  ]);
});

test("pages: reads attribute names in any case, with digits, but not text inside other values", () => {
  const html = [
    '<a DATA-I18N="nav.one">x</a>',
    '<b data-i18n-x2="nav.two">y</b>',
    "<i title='data-i18n=nav.three'>z</i>",
  ].join("\n");
  assert.deepEqual(findHtmlReferenceProblems(html, SMALL), [
    'DATA-I18N "nav.one": no such key in en',
    'DATA-I18N "nav.one": no such key in ar',
    'data-i18n-x2 "nav.two": no such key in en',
    'data-i18n-x2 "nav.two": no such key in ar',
  ]);
});

// ---- Course check, the manifest's checklist items match the hub and the Lesson page (spec #56, ticket #57) ----

const itemsCard = (n, items) =>
  `<li class="lesson-card" data-lesson="${n}"${items === undefined ? "" : ` data-checklist-items="${items}"`}><a href="x" data-course-link></a></li>`;
const itemsHub = (...cards) => `<main><ol class="lesson-list">${cards.join("")}</ol></main>`;
// Each item is "id" (required) or "id:false" (not required); "id:" leaves the flag out.
const itemsLesson = (...items) =>
  `<ul data-checklist="lesson-1">${items
    .map((item) => {
      const [id, flag = "true"] = item.split(":");
      return `<li><input type="checkbox" data-item="${id}"${flag ? ` data-required="${flag}"` : ""}></li>`;
    })
    .join("")}</ul>`;
const itemsManifest = (items, { released = true } = {}) => ({
  id: "example",
  lessons: [
    { number: 1, released, items },
    { number: 2, released: false, items: [] },
  ],
});
const AB = itemsManifest([{ id: "a", required: true }, { id: "b", required: true }]);

test("manifest items: a card and a page with the manifest's items and flags pass, in any order", () => {
  const manifest = itemsManifest([{ id: "a", required: true }, { id: "b", required: false }, { id: "old", required: true, retired: true }]);
  const pages = { 1: itemsLesson("b:false", "a") };
  assert.deepEqual(findManifestChecklistProblems(manifest, itemsHub(itemsCard(1, "a b")), pages), []);
  assert.deepEqual(findManifestChecklistProblems(manifest, itemsHub(itemsCard(1, "b a")), pages), []);
});

test("manifest items: a card that lacks or differs from the manifest's items is reported", () => {
  const pages = { 1: itemsLesson("a", "b") };
  assert.deepEqual(findManifestChecklistProblems(AB, itemsHub(itemsCard(1)), pages), [
    "Lesson 1's hub card has no checklist items (data-checklist-items)",
  ]);
  assert.deepEqual(findManifestChecklistProblems(AB, itemsHub(itemsCard(1, "a")), pages), [
    'Lesson 1\'s hub card lists the items "a" but the manifest has "a b"',
  ]);
  assert.deepEqual(findManifestChecklistProblems(AB, itemsHub(itemsCard(1, "a b new")), pages), [
    'Lesson 1\'s hub card lists the items "a b new" but the manifest has "a b"',
  ]);
});

test("manifest items: a page that lacks or differs from the manifest's items is reported", () => {
  const hub = itemsHub(itemsCard(1, "a b"));
  assert.deepEqual(findManifestChecklistProblems(AB, hub, { 1: itemsLesson("a") }), [
    'Lesson 1\'s page has the items "a" but the manifest has "a b"',
  ]);
  assert.deepEqual(findManifestChecklistProblems(AB, hub, { 1: itemsLesson("a", "b", "c") }), [
    'Lesson 1\'s page has the items "a b c" but the manifest has "a b"',
  ]);
});

test("manifest items: a retired item on the card or the page is reported", () => {
  const manifest = itemsManifest([{ id: "a", required: true }, { id: "old", required: true, retired: true }]);
  assert.deepEqual(findManifestChecklistProblems(manifest, itemsHub(itemsCard(1, "a old")), { 1: itemsLesson("a", "old") }), [
    'Lesson 1\'s hub card lists the items "a old" but the manifest has "a"',
    'Lesson 1\'s page has the items "a old" but the manifest has "a"',
  ]);
});

test("manifest items: a page item whose required flag is missing or differs from the manifest is reported", () => {
  const manifest = itemsManifest([{ id: "a", required: true }, { id: "b", required: false }]);
  const hub = itemsHub(itemsCard(1, "a b"));
  assert.deepEqual(findManifestChecklistProblems(manifest, hub, { 1: itemsLesson("a:false", "b:true") }), [
    'Lesson 1\'s item "a" is marked data-required="false" on its page but the manifest says true',
    'Lesson 1\'s item "b" is marked data-required="true" on its page but the manifest says false',
  ]);
  assert.deepEqual(findManifestChecklistProblems(manifest, hub, { 1: itemsLesson("a:", "b:yes") }), [
    'Lesson 1\'s item "a" has no data-required="true" or "false" on its page',
    'Lesson 1\'s item "b" has no data-required="true" or "false" on its page',
  ]);
});

test("manifest items: a repeated identifier on the card does not hide a missing one", () => {
  const manifest = itemsManifest(["a", "b", "c"].map((id) => ({ id, required: true })));
  assert.deepEqual(findManifestChecklistProblems(manifest, itemsHub(itemsCard(1, "a a b")), { 1: itemsLesson("a", "b", "c") }), [
    'Lesson 1\'s hub card lists the items "a a b" but the manifest has "a b c"',
  ]);
});

test("manifest items: only the Lesson list's cards count, and data-checklist-items is not read as the checklist", () => {
  const pages = { 1: `<li data-checklist-items="x">${itemsLesson("a", "b")}` };
  const sidebarFirst = `<ul><li data-lesson="1">sidebar</li></ul>${itemsHub(itemsCard(1, "a b"))}`;
  assert.deepEqual(findManifestChecklistProblems(AB, sidebarFirst, pages), []);
});

test("manifest items: a released Lesson without a card is reported; unreleased Lessons need no items", () => {
  assert.deepEqual(findManifestChecklistProblems(AB, itemsHub(itemsCard(2)), { 1: itemsLesson("a", "b") }), [
    "Lesson 1 has no card on the hub, so its checklist items cannot be compared",
  ]);
  const unreleased = itemsManifest([{ id: "a", required: true }], { released: false });
  assert.deepEqual(findManifestChecklistProblems(unreleased, itemsHub(itemsCard(1), itemsCard(2)), {}), []);
});

// ---- Course check, the manifest itself, its public part and the deploy list (spec #56, ticket #57) ----

const lessonOf = (number, extra = {}) => ({
  number,
  titleKey: `course.lesson${number}.title`,
  summary: "ملخص",
  preview: false,
  required: true,
  released: false,
  items: [],
  ...extra,
});
const goodManifest = () => ({
  id: "example",
  folder: "example-course",
  test: false,
  lessons: [
    lessonOf(1, { preview: true, released: true, items: [{ id: "a", required: true }, { id: "old", required: true, retired: true }] }),
    lessonOf(2, { items: [{ id: "secret", required: true }] }),
  ],
});

test("manifest: a well-formed manifest passes", () => {
  assert.deepEqual(findManifestProblems(goodManifest()), []);
});

test("manifest: reports Lessons that are not numbered 1, 2, 3 in order", () => {
  const manifest = goodManifest();
  manifest.lessons = [manifest.lessons[1], manifest.lessons[0]];
  assert.deepEqual(findManifestProblems(manifest), ["Lessons are numbered 2, 1 but should be 1, 2"]);
});

test("manifest: reports a missing id or folder, and flags that are not true or false", () => {
  const manifest = { ...goodManifest(), id: "", folder: undefined, test: "no" };
  manifest.lessons[0] = { ...manifest.lessons[0], preview: "yes" };
  manifest.lessons[0].items = [{ id: "a", required: 1 }];
  assert.deepEqual(findManifestProblems(manifest), [
    "the manifest has no id",
    "the manifest has no folder",
    "the manifest's test flag must be true or false",
    "Lesson 1's preview flag must be true or false",
    'Lesson 1\'s item "a" has a required flag that is not true or false',
  ]);
});

test("manifest: reports a Lesson with no title key or summary", () => {
  const manifest = goodManifest();
  manifest.lessons[1] = { ...manifest.lessons[1], titleKey: "", summary: " " };
  assert.deepEqual(findManifestProblems(manifest), ["Lesson 2 has no title key", "Lesson 2 has no summary"]);
});

test("manifest: reports an item id used twice in a Crash course, including a retired one used again", () => {
  const manifest = goodManifest();
  manifest.lessons[1].items.push({ id: "old", required: true });
  manifest.lessons[0].items.push({ id: "", required: true });
  assert.deepEqual(findManifestProblems(manifest), [
    "Lesson 1 has an item with no id",
    'the item id "old" is used more than once (a retired id is never reused)',
  ]);
});

test("manifest: reports a missing Lesson list or item list, and a Lesson number that is not a whole number, without failing", () => {
  assert.deepEqual(findManifestProblems({ id: "x", folder: "x", test: false }), ["the manifest has no Lesson list"]);
  const manifest = goodManifest();
  manifest.lessons[0] = { ...manifest.lessons[0], number: "1" };
  delete manifest.lessons[1].items;
  assert.deepEqual(findManifestProblems(manifest), [
    'Lessons are numbered "1", 2 but should be 1, 2',
    "Lesson 2 has no item list",
  ]);
});

test("public part: reports a missing public part for a Crash course that is not a test", () => {
  assert.deepEqual(findPublicPartProblems(null, goodManifest()), ["the Crash course example has no public part"]);
});

test("public part: what publicPart gives for a real manifest passes", () => {
  assert.deepEqual(findPublicPartProblems(publicPart(goodManifest()), goodManifest()), []);
});

test("public part: reports any field beyond the agreed ones", () => {
  const part = publicPart(goodManifest());
  part.folder = "example-course";
  part.lessons[0].page = "lesson-1/index.html";
  part.lessons[0].items[0].retired = false;
  part.lessons[1].summary = "ملخص";
  assert.deepEqual(findPublicPartProblems(part, goodManifest()), [
    'the public part has the field "folder", which is not public',
    'Lesson 1 in the public part has the field "page", which is not public',
    'Lesson 1\'s item "a" in the public part has the field "retired", which is not public',
    'Lesson 2 in the public part has the field "summary", which is not public',
  ]);
});

test("public part: reports retired items and the items of unreleased Lessons", () => {
  const part = publicPart(goodManifest());
  part.lessons[0].items.push({ id: "old", required: true });
  part.lessons[1].items = [{ id: "secret", required: true }];
  assert.deepEqual(findPublicPartProblems(part, goodManifest()), [
    'Lesson 1\'s item "old" in the public part is retired',
    'Lesson 2 in the public part has the field "items", which is not public',
  ]);
});

test("public part: reports a public part for a test Crash course", () => {
  const manifest = { ...goodManifest(), test: true };
  assert.deepEqual(findPublicPartProblems({ id: "example", lessons: [] }, manifest), [
    "the test Crash course example has a public part; it must have none",
  ]);
  assert.deepEqual(findPublicPartProblems(null, manifest), []);
});

const TEST_COURSE = { file: "courses/test-course.js", manifest: { ...goodManifest(), id: "test-course", folder: "test-course", test: true } };
const REAL_COURSE = { file: "courses/example.js", manifest: goodManifest() };

test("deploy list: a list without test Crash course material passes", () => {
  assert.deepEqual(findDeployListProblems(["index.html", "css", "js", "crash-course"], [REAL_COURSE, TEST_COURSE]), []);
});

test("deploy list: reports the test Crash course's folder or manifest, or a folder holding either", () => {
  assert.deepEqual(findDeployListProblems(["js", "test-course"], [TEST_COURSE]), [
    'the deploy file list has "test-course", which holds test Crash course material (test-course)',
  ]);
  assert.deepEqual(findDeployListProblems(["test-course/lesson-1/", "courses"], [TEST_COURSE]), [
    'the deploy file list has "test-course/lesson-1/", which holds test Crash course material (test-course)',
    'the deploy file list has "courses", which holds test Crash course material (courses/test-course.js)',
  ]);
  assert.deepEqual(findDeployListProblems(["a/../test-course", "test-course/."], [TEST_COURSE]), [
    'the deploy file list has "a/../test-course"; an entry is one plain path, with no spaces, patterns or pathspec magic',
    'the deploy file list has "test-course/."; an entry is one plain path, with no spaces, patterns or pathspec magic',
  ]);
});

test("deploy list: reports any manifest file, or a folder holding one, since a manifest holds more than is public", () => {
  assert.deepEqual(findDeployListProblems(["courses/example.js", "js"], [REAL_COURSE, TEST_COURSE]), [
    'the deploy file list has "courses/example.js", which holds a Crash course manifest (courses/example.js)',
  ]);
});

test("deploy list: reports an entry the deploy command would read differently: spaces, pattern characters or a pathspec", () => {
  assert.deepEqual(findDeployListProblems(["index.html test-course", " js", "test-*", ":(glob)**", "css"], [TEST_COURSE]), [
    'the deploy file list has "index.html test-course"; an entry is one plain path, with no spaces, patterns or pathspec magic',
    'the deploy file list has " js"; an entry is one plain path, with no spaces, patterns or pathspec magic',
    'the deploy file list has "test-*"; an entry is one plain path, with no spaces, patterns or pathspec magic',
    'the deploy file list has ":(glob)**"; an entry is one plain path, with no spaces, patterns or pathspec magic',
  ]);
});

test("deploy list: reports an entry git would read as an option, or one that leaves or restarts the path", () => {
  const plain = (entry) => `the deploy file list has "${entry}"; an entry is one plain path, with no spaces, patterns or pathspec magic`;
  const entries = ["-o", "x.tar", "--prefix", "./", ".", "..", "../x", "/test-course", ".hidden"];
  assert.deepEqual(findDeployListProblems(entries, [TEST_COURSE]), ["-o", "--prefix", "./", ".", "..", "../x", "/test-course", ".hidden"].map(plain));
});

test("deploy list: reports an empty list", () => {
  assert.deepEqual(findDeployListProblems([], [TEST_COURSE]), ["the deploy file list is empty"]);
});

// ---- Course check, hub rules (spec #36, Seam 1) ----

const LIST = [
  { number: 1, titleKey: "course.lesson1.title", released: true, page: "lesson-1/index.html" },
  { number: 2, titleKey: "course.lesson2.title", released: false, page: "lesson-2/index.html" },
  { number: 3, titleKey: "course.lesson3.title", released: false, page: "lesson-3/index.html" },
];

const hubCard = (n, { link } = {}) => {
  const title = `<h3 data-i18n="course.lesson${n}.title">Lesson ${n}</h3>`;
  const body = link
    ? `<a href="${link}" data-course-link>${title}</a>`
    : `${title}<span data-i18n="course.soon">Coming soon</span>`;
  return `<li class="lesson-card" data-lesson="${n}">${body}</li>`;
};
const hubPage = (cards, date = "2026-10-30") =>
  `<main><time datetime="${date}">30 October 2026</time><ol class="lesson-list">${cards.join("")}</ol></main>`;
const goodCards = () => [hubCard(1, { link: "lesson-1/index.html" }), hubCard(2), hubCard(3)];

test("hub: the agreed Lessons in order with the agreed availability pass", () => {
  assert.deepEqual(findCourseHubProblems(hubPage(goodCards()), LIST), []);
});

test("hub: reports a missing Lesson card", () => {
  const problems = findCourseHubProblems(hubPage([goodCards()[0], goodCards()[2]]), LIST);
  assert.deepEqual(problems, ["Lesson 2 has no card on the hub"]);
});

test("hub: reports cards in the wrong order", () => {
  const [one, two, three] = goodCards();
  const problems = findCourseHubProblems(hubPage([two, one, three]), LIST);
  assert.deepEqual(problems, ["Lesson cards are in the order 2, 1, 3 but should be 1, 2, 3"]);
});

test("hub: reports a card for a Lesson that is not in the agreed list", () => {
  const problems = findCourseHubProblems(hubPage([...goodCards(), hubCard(4)]), LIST);
  assert.deepEqual(problems, ["the hub has a card for Lesson 4, which is not in the agreed list"]);
});

test("hub: reports an unreleased Lesson shown as a link", () => {
  const [one, , three] = goodCards();
  const linked = hubCard(2).replace(/<h3.*<\/h3>/, (title) => `<a href="lesson-2/index.html" data-course-link>${title}</a>`);
  const problems = findCourseHubProblems(hubPage([one, linked, three]), LIST);
  assert.deepEqual(problems, ["Lesson 2 is not released but its card is a link"]);
});

test("hub: reports an unreleased Lesson card without the coming-soon label", () => {
  const [one, , three] = goodCards();
  const bare = '<li class="lesson-card" data-lesson="2"><h3 data-i18n="course.lesson2.title">Two</h3></li>';
  assert.deepEqual(findCourseHubProblems(hubPage([one, bare, three]), LIST), [
    'Lesson 2 is not released but its card does not say "course.soon"',
  ]);
});

test("hub: reports a released Lesson that is not a link to its page", () => {
  const [, two, three] = goodCards();
  const asText = findCourseHubProblems(hubPage([hubCard(1), two, three]), LIST);
  assert.deepEqual(asText, ["Lesson 1 is released but its card is not a link"]);
  const wrong = findCourseHubProblems(hubPage([hubCard(1, { link: "lesson-2/index.html" }), two, three]), LIST);
  assert.deepEqual(wrong, ['Lesson 1 links to "lesson-2/index.html" but its page is "lesson-1/index.html"']);
});

test("hub: reports a released Lesson link that does not carry the language", () => {
  const [, two, three] = goodCards();
  const plain = '<li class="lesson-card" data-lesson="1"><a href="lesson-1/index.html"><h3 data-i18n="course.lesson1.title">One</h3></a></li>';
  assert.deepEqual(findCourseHubProblems(hubPage([plain, two, three]), LIST), [
    "Lesson 1 links to a course page without data-course-link, so the language would be lost",
  ]);
});

test("hub: reports a card with the wrong title key", () => {
  const [one, , three] = goodCards();
  const wrong = hubCard(2).replace("course.lesson2.title", "course.lesson3.title");
  assert.deepEqual(findCourseHubProblems(hubPage([one, wrong, three]), LIST), [
    'Lesson 2 uses the title "course.lesson3.title" but should use "course.lesson2.title"',
  ]);
});

test("hub: reports a missing or invalid last-checked date", () => {
  assert.deepEqual(findCourseHubProblems(hubPage(goodCards(), "2026-02-30"), LIST), [
    'the last-checked date "2026-02-30" is not a real calendar date (use YYYY-MM-DD)',
  ]);
  assert.deepEqual(findCourseHubProblems(hubPage(goodCards(), "30 October"), LIST), [
    'the last-checked date "30 October" is not a real calendar date (use YYYY-MM-DD)',
  ]);
  const noDate = hubPage(goodCards()).replace(/<time[^>]*>.*?<\/time>/, "");
  assert.deepEqual(findCourseHubProblems(noDate, LIST), ["the hub has no last-checked date (<time datetime>)"]);
});

test("hub: reports a page with no Lesson list", () => {
  assert.deepEqual(findCourseHubProblems("<main><time datetime=\"2026-10-30\"></time></main>", LIST), [
    "the hub has no Lesson list (<ol class=\"lesson-list\">)",
  ]);
});

test("hub: reads the title from the card's heading, not from other text before it", () => {
  const [one, two, three] = goodCards();
  const withNumber = two.replace("<h3", '<span data-i18n="course.lesson2.number">2</span><h3');
  assert.deepEqual(findCourseHubProblems(hubPage([one, withNumber, three]), LIST), []);
});

// ---- Course check, Lesson page rules (spec #36, Seam 1; ticket #39) ----
// A good Lesson page is built from small parts here, then each test breaks one part.

const COURSE_DIR = "crash-course";
const LESSON_LIST = [
  { number: 1, titleKey: "course.lesson1.title", released: true, page: "lesson-1/index.html" },
  { number: 2, titleKey: "course.lesson2.title", released: false, page: "lesson-2/index.html" },
  { number: 3, titleKey: "course.lesson3.title", released: false, page: "lesson-3/index.html" },
];
const lessonFile = (n) => `${COURSE_DIR}/lesson-${n}/index.html`;

const sidebarEntry = (lesson, current) =>
  lesson.released
    ? `<li data-lesson="${lesson.number}"><a href="../lesson-${lesson.number}/index.html" data-course-link${
        current ? ' aria-current="page"' : ""
      }><span data-i18n="${lesson.titleKey}">Title</span></a>${
        current ? '<ul><li><a href="#intro">Intro</a></li></ul>' : ""
      }</li>`
    : `<li data-lesson="${lesson.number}"><span data-i18n="${lesson.titleKey}">Title</span><span data-i18n="course.soon">Soon</span></li>`;
const sidebarOf = (entries) => `<nav data-lesson-nav><ol>${entries.join("")}</ol></nav>`;
const goodSidebar = (list, n) => sidebarOf(list.map((lesson) => sidebarEntry(lesson, lesson.number === n)));

const pagerLink = (kind, href) => `<a data-pager="${kind}" href="${href}" data-course-link>Link</a>`;
const goodPager = (list, n) => {
  const items = [n === 1 ? pagerLink("hub", "../index.html") : pagerLink("prev", `../lesson-${n - 1}/index.html`)];
  const next = list.find((lesson) => lesson.number === n + 1);
  if (next && next.released) items.push(pagerLink("next", `../lesson-${next.number}/index.html`));
  else if (next) {
    items.push('<span data-pager="soon">Soon</span>');
    if (n !== 1) items.push(pagerLink("hub", "../index.html"));
  }
  return `<nav data-lesson-pager>${items.join("")}</nav>`;
};

const goodMain = () =>
  '<main><p class="course-en-only" data-i18n="course.lesson.arabicNotice">Available in Arabic</p>' +
  '<div id="intro" class="lesson-part" lang="ar" dir="rtl"><h1>Title</h1><time datetime="2026-10-31">31 October</time></div>' +
  '<section class="lesson-part" lang="ar" dir="rtl"><ul data-checklist="lesson-1">' +
  '<li><label><input type="checkbox" data-item="explain-claude"> One</label></li>' +
  '<li><label><input type="checkbox" data-item="chat-or-code"> Two</label></li></ul></section></main>';

const lessonPage = ({
  list = LESSON_LIST,
  n = 1,
  sidebar = goodSidebar(list, n),
  pager = goodPager(list, n),
  main = goodMain(),
} = {}) => `<body>${sidebar}${main}${pager}</body>`;
const lessonProblems = (html, { n = 1, list = LESSON_LIST, exists = () => true } = {}) =>
  findCourseLessonProblems(html, { file: lessonFile(n), courseDir: COURSE_DIR, lessons: list, exists });

test("lesson page: a sidebar with the agreed Lessons passes", () => {
  assert.deepEqual(lessonProblems(lessonPage()), []);
});

test("lesson page: reports a page that is not one of the agreed Lesson pages", () => {
  assert.deepEqual(lessonProblems(lessonPage(), { n: 9 }), [
    "crash-course/lesson-9/index.html is not one of the agreed Lesson pages",
  ]);
});

test("lesson page: reports a page with no sidebar", () => {
  const html = lessonPage({ sidebar: "" });
  assert.deepEqual(lessonProblems(html), ["the Lesson page has no sidebar (<nav data-lesson-nav>)"]);
});

test("lesson page: reports a missing, extra or misordered Lesson in the sidebar", () => {
  const entries = LESSON_LIST.map((lesson) => sidebarEntry(lesson, lesson.number === 1));
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([entries[0], entries[2]]) })), [
    "Lesson 2 is not in the sidebar",
  ]);
  const extra = sidebarEntry({ number: 4, titleKey: "course.lesson4.title", released: false }, false);
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([...entries, extra]) })), [
    "the sidebar has Lesson 4, which is not in the agreed list",
  ]);
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([entries[0], entries[2], entries[1]]) })), [
    "sidebar Lessons are in the order 1, 3, 2 but should be 1, 2, 3",
  ]);
});

test("lesson page: reports an unreleased Lesson shown as a link, or without the coming-soon label", () => {
  const entries = LESSON_LIST.map((lesson) => sidebarEntry(lesson, lesson.number === 1));
  const linked = entries[1].replace(/<span data-i18n="course.lesson2.title">Title<\/span>/, (title) => `<a href="../lesson-2/index.html" data-course-link>${title}</a>`);
  const html = lessonPage({ sidebar: sidebarOf([entries[0], linked, entries[2]]) });
  assert.deepEqual(lessonProblems(html), [
    "Lesson 2 is not released but the sidebar links to it",
    "the Lesson page links to Lesson 2, which is not released",
  ]);
  const bare = '<li data-lesson="2"><span data-i18n="course.lesson2.title">Title</span></li>';
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([entries[0], bare, entries[2]]) })), [
    'Lesson 2 is not released but its sidebar entry does not say "course.soon"',
  ]);
});

test("lesson page: reports a released Lesson that is not a link to its page", () => {
  const entries = LESSON_LIST.map((lesson) => sidebarEntry(lesson, lesson.number === 1));
  const asText = '<li data-lesson="1"><span data-i18n="course.lesson1.title">Title</span></li>';
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([asText, entries[1], entries[2]]) })), [
    "Lesson 1 is released but its sidebar entry is not a link",
    "Lesson 1 is the current Lesson but its sidebar entry is not marked aria-current=\"page\"",
    "Lesson 1 is the current Lesson but its sidebar entry does not list its Sections",
  ]);
  const wrong = entries[0].replace('href="../lesson-1/index.html"', 'href="../lesson-2/index.html"');
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([wrong, entries[1], entries[2]]) })), [
    'Lesson 1 links to "../lesson-2/index.html" in the sidebar, which is not its page "crash-course/lesson-1/index.html"',
    "the Lesson page links to Lesson 2, which is not released",
  ]);
});

test("lesson page: reports a wrong title key or a current Lesson that is not marked or expanded", () => {
  const entries = LESSON_LIST.map((lesson) => sidebarEntry(lesson, lesson.number === 1));
  const wrongTitle = entries[1].replace("course.lesson2.title", "course.lesson3.title");
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([entries[0], wrongTitle, entries[2]]) })), [
    'Lesson 2 uses the sidebar title "course.lesson3.title" but should use "course.lesson2.title"',
  ]);
  const plain = entries[0].replace(' aria-current="page"', "").replace(/<ul>.*<\/ul>/, "");
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([plain, entries[1], entries[2]]) })), [
    "Lesson 1 is the current Lesson but its sidebar entry is not marked aria-current=\"page\"",
    "Lesson 1 is the current Lesson but its sidebar entry does not list its Sections",
  ]);
});

test("lesson page: reports a sidebar Section link that points to no heading on the page", () => {
  const entries = LESSON_LIST.map((lesson) => sidebarEntry(lesson, lesson.number === 1));
  const broken = entries[0].replace('href="#intro"', 'href="#nowhere"');
  assert.deepEqual(lessonProblems(lessonPage({ sidebar: sidebarOf([broken, entries[1], entries[2]]) })), [
    'the sidebar Section link "#nowhere" points to nothing on the page',
  ]);
});

const READY = LESSON_LIST.map((lesson) => ({ ...lesson, released: lesson.number <= 2 })); // Lessons 1-2 released
const ALL_READY = LESSON_LIST.map((lesson) => ({ ...lesson, released: true }));

test("pager: follows the boundary rules for the first, a middle and the last Lesson", () => {
  assert.deepEqual(lessonProblems(lessonPage({ list: READY, n: 2 }), { n: 2, list: READY }), []);
  assert.deepEqual(lessonProblems(lessonPage({ list: ALL_READY, n: 2 }), { n: 2, list: ALL_READY }), []);
  assert.deepEqual(lessonProblems(lessonPage({ list: ALL_READY, n: 3 }), { n: 3, list: ALL_READY }), []);
});

test("pager: reports a page with no pager", () => {
  assert.deepEqual(lessonProblems(lessonPage({ pager: "" })), [
    "the Lesson page has no previous/next pager (<nav data-lesson-pager>)",
  ]);
});

test("pager: Lesson 1 needs a link back to the hub in place of previous", () => {
  const none = lessonPage({ pager: '<nav data-lesson-pager><span data-pager="soon">Soon</span></nav>' });
  assert.deepEqual(lessonProblems(none), ['the pager has no link back to the hub in place of "previous"']);
  const wrong = lessonPage({
    pager: `<nav data-lesson-pager>${pagerLink("hub", "../lesson-2/index.html")}<span data-pager="soon">Soon</span></nav>`,
  });
  assert.deepEqual(lessonProblems(wrong), [
    'the pager has no link back to the hub in place of "previous"',
    "the Lesson page links to Lesson 2, which is not released",
  ]);
});

test("pager: a later Lesson needs a previous link to the Lesson before it", () => {
  const none = lessonPage({
    list: READY,
    n: 2,
    pager: `<nav data-lesson-pager><span data-pager="soon">Soon</span>${pagerLink("hub", "../index.html")}</nav>`,
  });
  assert.deepEqual(lessonProblems(none, { n: 2, list: READY }), ['Lesson 2 has no "previous" link to Lesson 1']);
  const wrong = lessonPage({
    list: READY,
    n: 2,
    pager: `<nav data-lesson-pager>${pagerLink("prev", "../index.html")}<span data-pager="soon">Soon</span>${pagerLink("hub", "../index.html")}</nav>`,
  });
  assert.deepEqual(lessonProblems(wrong, { n: 2, list: READY }), ['Lesson 2 has no "previous" link to Lesson 1']);
});

test("pager: a next Lesson that is released must be a link to it", () => {
  const none = lessonPage({ list: ALL_READY, n: 1, pager: `<nav data-lesson-pager>${pagerLink("hub", "../index.html")}</nav>` });
  assert.deepEqual(lessonProblems(none, { list: ALL_READY }), ['Lesson 1 has no "next" link to Lesson 2']);
});

test("pager: a next Lesson that is not released is the non-link coming-soon text, and the hub link stays", () => {
  const asLink = lessonPage({ pager: `<nav data-lesson-pager>${pagerLink("hub", "../index.html")}${pagerLink("next", "../lesson-2/index.html")}</nav>` });
  assert.deepEqual(lessonProblems(asLink), [
    'Lesson 2 is not released, so "next" must be the coming-soon text, not a link',
    'the pager does not say that Lesson 2 is coming soon (data-pager="soon")',
    "the Lesson page links to Lesson 2, which is not released",
  ]);
  const noHub = lessonPage({ list: READY, n: 2, pager: `<nav data-lesson-pager>${pagerLink("prev", "../lesson-1/index.html")}<span data-pager="soon">Soon</span></nav>` });
  assert.deepEqual(lessonProblems(noHub, { n: 2, list: READY }), ['Lesson 3 is not released, so the pager needs a link back to the hub']);
});

test("lesson date: reports a missing or invalid last-checked date", () => {
  const noDate = goodMain().replace(/<time[^>]*>.*?<\/time>/, "");
  assert.deepEqual(lessonProblems(lessonPage({ main: noDate })), [
    "the Lesson page has no last-checked date (<time datetime>)",
  ]);
  const invalid = goodMain().replace("2026-10-31", "2026-02-30");
  assert.deepEqual(lessonProblems(lessonPage({ main: invalid })), [
    'the last-checked date "2026-02-30" is not a real calendar date (use YYYY-MM-DD)',
  ]);
  const wordy = goodMain().replace("2026-10-31", "31 October");
  assert.deepEqual(lessonProblems(lessonPage({ main: wordy })), [
    'the last-checked date "31 October" is not a real calendar date (use YYYY-MM-DD)',
  ]);
});

test("lesson content: every Lesson part is marked lang=ar and dir=rtl", () => {
  const noLang = goodMain().replace(' lang="ar"', "");
  assert.deepEqual(lessonProblems(lessonPage({ main: noLang })), [
    'a Lesson part (<div id="intro">) is not marked lang="ar" dir="rtl"',
  ]);
  const noDir = goodMain().replace(' dir="rtl"', "");
  assert.deepEqual(lessonProblems(lessonPage({ main: noDir })), [
    'a Lesson part (<div id="intro">) is not marked lang="ar" dir="rtl"',
  ]);
  const wrongLang = goodMain().replace('lang="ar"', 'lang="en"');
  assert.deepEqual(lessonProblems(lessonPage({ main: wrongLang })), [
    'a Lesson part (<div id="intro">) is not marked lang="ar" dir="rtl"',
  ]);
});

test("lesson content: reports a page with no Lesson content parts", () => {
  const none = goodMain().replaceAll(' class="lesson-part"', "");
  assert.deepEqual(lessonProblems(lessonPage({ main: none })), [
    'the Lesson page has no Lesson content (class="lesson-part")',
  ]);
});

test("lesson notice: English visitors are told the Lesson is available in Arabic", () => {
  const none = goodMain().replace(' data-i18n="course.lesson.arabicNotice"', "");
  assert.deepEqual(lessonProblems(lessonPage({ main: none })), [
    'the Lesson page has no "available in Arabic" notice for English (data-i18n="course.lesson.arabicNotice")',
  ]);
});

test("checklist: reports a page with no checklist, or an empty one", () => {
  const none = goodMain().replace(/<section[\s\S]*<\/section>/, "");
  assert.deepEqual(lessonProblems(lessonPage({ main: none })), [
    'the Lesson page has no "You\'re done when" checklist (data-checklist)',
  ]);
  const empty = goodMain().replace(/<li>[\s\S]*<\/li>/, "");
  assert.deepEqual(lessonProblems(lessonPage({ main: empty })), ["the checklist has no items"]);
});

test("checklist: every item has an identifier, unique within the Lesson", () => {
  const missing = goodMain().replace(' data-item="chat-or-code"', "");
  assert.deepEqual(lessonProblems(lessonPage({ main: missing })), ["checklist item 2 has no identifier (data-item)"]);
  const blank = goodMain().replace('data-item="chat-or-code"', 'data-item=""');
  assert.deepEqual(lessonProblems(lessonPage({ main: blank })), ["checklist item 2 has no identifier (data-item)"]);
  const repeated = goodMain().replace('data-item="chat-or-code"', 'data-item="explain-claude"');
  assert.deepEqual(lessonProblems(lessonPage({ main: repeated })), [
    'the checklist identifier "explain-claude" is used more than once',
  ]);
});

const withLinks = (html) => lessonPage({ main: goodMain().replace("</main>", `${html}</main>`) });

test("links: every Resource link points to a file that exists, resolved from the page", () => {
  const html = withLinks('<a href="resources/facts.md">Facts</a><a href="resources/menu.md?x=1#top">Menu</a>');
  const seen = [];
  const exists = (target) => {
    seen.push(target);
    return target !== "crash-course/lesson-1/resources/facts.md";
  };
  assert.deepEqual(lessonProblems(html, { exists }), [
    'the link "resources/facts.md" points to crash-course/lesson-1/resources/facts.md, which does not exist',
  ]);
  assert.ok(seen.includes("crash-course/lesson-1/resources/menu.md"), "query and #hash are dropped before the file is looked up");
});

test("links: a page link or image that goes up and out of the Lesson folder is resolved too", () => {
  const html = withLinks('<img src="../../assets/images/mascot.webp" alt="">');
  const exists = (target) => target !== "assets/images/mascot.webp";
  assert.deepEqual(lessonProblems(html, { exists }), [
    'the image "../../assets/images/mascot.webp" points to assets/images/mascot.webp, which does not exist',
  ]);
});

test("links: every external Reference is a complete, well-formed https:// address", () => {
  const good = withLinks('<a href="https://code.claude.com/docs/en/overview">Docs</a>');
  assert.deepEqual(lessonProblems(good), []);
  for (const bad of ["http://example.com/", "https://", "https:example.com", "//example.com/", "mailto:a@example.com", "https://exam ple.com/", "https://localhost/"]) {
    assert.deepEqual(lessonProblems(withLinks(`<a href="${bad}">x</a>`)), [
      `the link "${bad}" is not a complete https:// address`,
    ]);
  }
});

test("links: a link to a course page carries the language (data-course-link); other links need not", () => {
  const plain = withLinks('<a href="../index.html#lessons">Hub</a>');
  assert.deepEqual(lessonProblems(plain), [
    'the link "../index.html#lessons" goes to a course page without data-course-link, so the language would be lost',
  ]);
  const fine = withLinks(
    '<a href="../index.html#lessons" data-course-link>Hub</a><a href="#intro">Top</a><a href="../../index.html#products">Landing</a>',
  );
  assert.deepEqual(lessonProblems(fine), []);
});

test("links: single-quoted and unquoted addresses are read too", () => {
  assert.deepEqual(lessonProblems(withLinks("<a href='http://example.com/'>x</a>")), [
    'the link "http://example.com/" is not a complete https:// address',
  ]);
  assert.deepEqual(lessonProblems(withLinks("<a href=http://example.com/>x</a>")), [
    'the link "http://example.com/" is not a complete https:// address',
  ]);
  const html = withLinks("<img src='../../assets/missing.webp'><a href='resources/a.md'>a</a>");
  assert.deepEqual(lessonProblems(html, { exists: (target) => !/resources|missing/.test(target) }), [
    'the link "resources/a.md" points to crash-course/lesson-1/resources/a.md, which does not exist',
    'the image "../../assets/missing.webp" points to assets/missing.webp, which does not exist',
  ]);
});

const selfCheckQuestion = (...correct) =>
  `<div class="self-check__item">${correct
    .map((value) => `<button type="button" class="self-check__option" data-correct="${value}">Option</button>`)
    .join("")}</div>`;

test("self-check: every question has at least two options and exactly one correct one", () => {
  const good = withLinks(selfCheckQuestion(false, true, false) + selfCheckQuestion(true, false));
  assert.deepEqual(lessonProblems(good), []);
  assert.deepEqual(lessonProblems(withLinks(selfCheckQuestion(false, false))), [
    "Self-check question 1 has no correct option (data-correct=\"true\")",
  ]);
  assert.deepEqual(lessonProblems(withLinks(selfCheckQuestion(true, true, false))), [
    "Self-check question 1 has more than one correct option",
  ]);
  assert.deepEqual(lessonProblems(withLinks(selfCheckQuestion(true))), [
    "Self-check question 1 has fewer than two options",
  ]);
  const second = withLinks(selfCheckQuestion(true, false) + selfCheckQuestion(false, false));
  assert.deepEqual(lessonProblems(second), ["Self-check question 2 has no correct option (data-correct=\"true\")"]);
});

test("self-check: single-quoted attributes are read too", () => {
  const html = `<div class='self-check__item'><button class='self-check__option' data-correct='false'>a</button><button class='self-check__option' data-correct='false'>b</button></div>`;
  assert.deepEqual(lessonProblems(withLinks(html)), [
    'Self-check question 1 has no correct option (data-correct="true")',
  ]);
});

const MASCOT_OF = { think: "mascot-2-thoughtful", confusion: "mascot-3-confused", key: "mascot-4-lightbulb", warning: "mascot-7-attentive", resource: "mascot-8-envelopes" };
const callout = ({ kind = "key", mascot = MASCOT_OF[kind], alt = "", label = "Label:", bird = true } = {}) =>
  `<div class="callout callout--${kind}" role="note">` +
  (bird ? `<img class="callout__bird" src="../../assets/images/${mascot}.webp" alt="${alt}">` : "") +
  `<p>${label === null ? "" : `<strong class="callout__label">${label}</strong>`} Text.</p></div>`;
const between = "<p>Some Lesson text between callouts.</p>";

test("callouts: each of the four kinds with its own mascot, a label and a decorative bird passes", () => {
  const html = ["think", "confusion", "key", "warning", "resource"].map((kind) => callout({ kind })).join(between);
  assert.deepEqual(lessonProblems(withLinks(html)), []);
});

test("callouts: an unknown kind, a wrong mascot, a bird with alt text or a missing label is reported", () => {
  assert.deepEqual(lessonProblems(withLinks(callout({ kind: "fun" }))), ['callout 1 has the unknown kind "fun"']);
  assert.deepEqual(lessonProblems(withLinks(callout({ kind: "key", mascot: "mascot-3-confused" }))), [
    "callout 1 (key) should show mascot-4-lightbulb.webp",
  ]);
  assert.deepEqual(lessonProblems(withLinks(callout({ alt: "A bird" }))), [
    'callout 1 has a mascot with alt text; a mascot is decorative (alt="")',
  ]);
  assert.deepEqual(lessonProblems(withLinks(callout({ label: null }))), [
    "callout 1 has no text label (class=\"callout__label\"); the label carries the meaning",
  ]);
  assert.deepEqual(lessonProblems(withLinks(callout({ label: "  " }))), [
    "callout 1 has no text label (class=\"callout__label\"); the label carries the meaning",
  ]);
});

test("callouts: a callout may have no bird, but two callouts may not follow each other directly", () => {
  assert.deepEqual(lessonProblems(withLinks(callout({ bird: false }))), []);
  assert.deepEqual(lessonProblems(withLinks(callout({ kind: "think" }) + "\n " + callout({ kind: "key" }))), [
    "callouts 1 and 2 follow each other directly; at most one mascot per screen of reading",
  ]);
  const comment = callout({ kind: "think" }) + "<!-- note -->" + callout({ kind: "key" });
  assert.deepEqual(lessonProblems(withLinks(comment)), [
    "callouts 1 and 2 follow each other directly; at most one mascot per screen of reading",
  ]);
  assert.deepEqual(lessonProblems(withLinks(callout({ kind: "think" }) + between + callout({ kind: "key" }))), []);
});

const codeBox = (inner) => `<div class="code-box"><pre class="code-box__code">${inner}</pre></div>`;

test("code boxes: each holds exactly one non-empty <code>, so its Copy button copies one thing", () => {
  assert.deepEqual(lessonProblems(withLinks(codeBox("<code>echo hi</code>") + between + codeBox("<code>x</code>"))), []);
  assert.deepEqual(lessonProblems(withLinks(codeBox("echo hi"))), [
    "code box 1 must hold exactly one <code> (its Copy button copies that text)",
  ]);
  assert.deepEqual(lessonProblems(withLinks(codeBox("<code>a</code><code>b</code>"))), [
    "code box 1 must hold exactly one <code> (its Copy button copies that text)",
  ]);
  assert.deepEqual(lessonProblems(withLinks(codeBox("<code> \n </code>"))), ["code box 1 is empty"]);
  assert.deepEqual(lessonProblems(withLinks(codeBox("<code>a</code>") + codeBox("<code></code>"))), ["code box 2 is empty"]);
});
