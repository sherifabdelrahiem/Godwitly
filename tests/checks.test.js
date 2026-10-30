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
} = require("./checks.js");

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
