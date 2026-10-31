/*
  The project checks run by `node --test` locally and on every pull request
  (spec #31): translation parity, translation keys named in the pages and
  scripts, and JavaScript syntax. Each function returns a list of problems;
  an empty list means the check passes.

  Development only: the site never loads this file.
*/
const { spawnSync } = require("node:child_process");

// The {name} parts of a text, sorted, e.g. "{n}" or "{shown}, {total}".
function placeholders(text) {
  const names = String(text).match(/\{[A-Za-z0-9_]+\}/g) || [];
  return [...new Set(names)].sort().join(", ");
}

// 1. Parity: English and Arabic have the same keys, no text is blank, and
// each key uses the same {placeholders} in both languages.
function findParityProblems(translations) {
  const problems = [];
  const languages = Object.keys(translations);
  const [first, ...others] = languages;
  Object.entries(translations[first]).forEach(([key, text]) => {
    others.forEach((other) => {
      if (!(key in translations[other])) return;
      const mine = placeholders(text);
      const theirs = placeholders(translations[other][key]);
      if (mine !== theirs) {
        problems.push(`"${key}" uses ${mine || "nothing"} in ${first} but ${theirs || "nothing"} in ${other}`);
      }
    });
  });
  languages.forEach((language) => {
    Object.entries(translations[language]).forEach(([key, text]) => {
      if (typeof text !== "string" || text.trim() === "") {
        problems.push(`"${key}" in ${language} is blank`);
      }
      languages.forEach((other) => {
        if (!(key in translations[other])) problems.push(`"${key}" is missing in ${other}`);
      });
    });
  });
  return problems;
}

// The languages that have no such key.
function languagesWithout(key, translations) {
  return Object.keys(translations).filter((language) => !(key in translations[language]));
}

// Problems for one key named somewhere: it must exist in every language.
function missingKey(where, key, translations) {
  return languagesWithout(key, translations).map((language) => `${where}: no such key in ${language}`);
}

// 2. Pages: every data-i18n and data-i18n-* value is a key. HTML comments
// (<!-- ... -->, on one line or several) are removed first.
function findHtmlReferenceProblems(html, translations) {
  const problems = [];
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  // Attribute names in any case, after a space; values in double quotes,
  // single quotes or none. Text such as title="see data-i18n=x" is still read
  // as an attribute: that gives an extra failure, never a missed key.
  const attributes = /(?<=\s)(data-i18n(?:-[a-z0-9]+)*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  for (const [, name, double, single, bare] of withoutComments.matchAll(attributes)) {
    const key = double ?? single ?? bare;
    problems.push(...missingKey(`${name} "${key}"`, key, translations));
  }
  return problems;
}

// 3. Scripts: a translation key in JavaScript is one complete string
// (AGENTS.md, Development rules). Any string shaped like a key must be one.
const KEY_SHAPE = /^[a-z][a-z0-9]*\.[A-Za-z0-9]+$/;

// After these, a "/" starts a regular expression rather than a division.
const BEFORE_REGEX = "(,=:[!&|?{};+-*%<>~^";
const BEFORE_REGEX_WORDS = [
  "return", "typeof", "case", "in", "of", "void", "delete", "new", "instanceof",
  "await", "else", "throw", "yield", "do",
];

/*
  Walks a script once and returns its string pieces, skipping comments and
  regular expressions. Each piece is { text, line, complete, before, after,
  afterSlot, beforeSlot }:
  - complete: a whole "..." / '...' string, or a `...` template with no ${} slot;
  - before / after: the code just before and after a complete string;
  - afterSlot / beforeSlot: a template piece right after "}" / right before "${".
*/
function scanScript(source) {
  const pieces = [];
  let i = 0;
  let line = 1;
  let lastIndex = -1; // last character of code (not space or comment)

  const skipSpaceAndComments = (from) => {
    let j = from;
    for (;;) {
      while (j < source.length && /\s/.test(source[j])) j++;
      if (source.startsWith("//", j)) {
        const end = source.indexOf("\n", j);
        j = end < 0 ? source.length : end;
      } else if (source.startsWith("/*", j)) {
        const end = source.indexOf("*/", j + 2);
        j = end < 0 ? source.length : end + 2;
      } else {
        return j;
      }
    }
  };
  const codeBefore = () => (lastIndex < 0 ? "" : source[lastIndex]);
  const regexCanStart = () => {
    if (lastIndex < 0) return true;
    const last = source[lastIndex];
    // After ++ or -- a "/" divides: count++ / 2.
    if ((last === "+" || last === "-") && source[lastIndex - 1] === last) return false;
    if (BEFORE_REGEX.includes(last)) return true;
    const word = source.slice(0, lastIndex + 1).match(/(\.?)([A-Za-z_$][\w$]*)$/);
    // A property such as options.do is a name, not the keyword.
    return Boolean(word) && word[1] !== "." && BEFORE_REGEX_WORDS.includes(word[2]);
  };
  const countLines = (text) => (line += (text.match(/\n/g) || []).length);

  // Reads "..." or '...' from the opening quote; returns its text.
  const readQuoted = () => {
    const quote = source[i];
    let text = "";
    i++;
    while (i < source.length && source[i] !== quote) {
      if (source[i] === "\\") {
        text += source[i + 1] || "";
        i += 2;
      } else {
        text += source[i];
        i++;
      }
    }
    i++;
    return text;
  };

  // Reads a regular expression from its opening "/".
  const skipRegex = () => {
    let inClass = false;
    i++;
    while (i < source.length) {
      const c = source[i];
      if (c === "\\") i++;
      else if (c === "[") inClass = true;
      else if (c === "]") inClass = false;
      else if (c === "/" && !inClass) break;
      else if (c === "\n") {
        line++;
        break;
      }
      i++;
    }
    i++;
    while (/[a-z]/.test(source[i] || "")) i++;
  };

  // Reads a `...` template from its backtick, scanning the code in each slot.
  const readTemplate = () => {
    const startLine = line;
    const before = codeBefore();
    const parts = [];
    let text = "";
    let afterSlot = false;
    let partLine = line;
    i++;
    while (i < source.length && source[i] !== "`") {
      if (source[i] === "\\") {
        if (source[i + 1] === "\n") line++;
        text += source[i + 1] || "";
        i += 2;
      } else if (source.startsWith("${", i)) {
        parts.push({ text, line: partLine, afterSlot, beforeSlot: true });
        i += 2;
        lastIndex = i - 1;
        scan(true);
        i++; // the slot's closing "}"
        text = "";
        afterSlot = true;
        partLine = line;
      } else {
        if (source[i] === "\n") line++;
        text += source[i];
        i++;
      }
    }
    i++;
    if (parts.length === 0) {
      return { text, line: startLine, complete: true, before };
    }
    parts.push({ text, line: partLine, afterSlot, beforeSlot: false });
    parts.forEach((part) => pieces.push({ ...part, complete: false }));
    return null;
  };

  // Scans code; inside a template slot, stops at its closing "}".
  function scan(inSlot) {
    let depth = 0;
    while (i < source.length) {
      const next = skipSpaceAndComments(i);
      countLines(source.slice(i, next));
      i = next;
      if (i >= source.length) return;
      const c = source[i];
      if (c === '"' || c === "'" || c === "`") {
        const startLine = line;
        const before = codeBefore();
        const startI = i;
        const piece = c === "`" ? readTemplate() : { text: readQuoted(), line: startLine, complete: true, before };
        if (c !== "`") countLines(source.slice(startI, i));
        lastIndex = i - 1;
        if (piece) {
          const afterAt = skipSpaceAndComments(i);
          pieces.push({ ...piece, after: source.slice(afterAt, afterAt + 8) });
        }
      } else if (c === "/" && regexCanStart()) {
        skipRegex();
        lastIndex = i - 1;
      } else {
        if (inSlot && c === "{") depth++;
        if (inSlot && c === "}") {
          if (depth === 0) return;
          depth--;
        }
        lastIndex = i;
        i++;
      }
    }
  }

  scan(false);
  return pieces;
}

/*
  Keys built from pieces, which the convention rules out. Only these three
  patterns are rejected:
    R1  a prefix such as "dash." followed by +, ${ or .concat(
    R2  ".word" straight after a ${…} slot:   `${ns}.title`
    R3  a ".word" string straight after +:     ns + ".title"
  Limits, not detected:
  - keys joined with no dotted piece: [ns, "title"].join("."), ns + sep + name;
  - a lone "." joining two parts: ns + "." + name, `${ns}.${name}`;
  - a prefix held in a variable: const p = "nav."; t(p + name);
  - a suffix added with +=: key += ".title";
  - keys that reach the scripts from anywhere else.
  The scanner also reads a "/" straight after ")" as division, so a regular
  expression there (if (ok) /x/.test(s)) can hide the code after it; and it
  reads a "/" as a regular expression after a keyword-named property written
  with a space or line break after the dot (obj. do / 2) or as a private name
  (this.#do / 2), which can hide the code after it too.
  The checks never prove that every key exists.
*/
const KEY_PREFIX = /^[a-z][a-z0-9]*\.$/; // "dash."
const KEY_SUFFIX = /^\.[A-Za-z]/; // ".title"

function builtKeyProblem(piece) {
  const { text, complete, before, after, afterSlot, beforeSlot } = piece;
  if (!complete && afterSlot && KEY_SUFFIX.test(text)) {
    return `(R2): "${text.match(/^\.[A-Za-z0-9]+/)[0]}" straight after \${…}`;
  }
  if (complete && before === "+" && KEY_SUFFIX.test(text)) {
    return `(R3): "${text}" straight after +`;
  }
  if (KEY_PREFIX.test(text)) {
    if (!complete && beforeSlot) return `(R1): "${text}" followed by \${`;
    if (complete && after.startsWith("+")) return `(R1): "${text}" followed by +`;
    if (complete && after.startsWith(".concat(")) return `(R1): "${text}" followed by .concat(`;
  }
  return null;
}

/*
  Exceptions: dotted strings in the scripts that are not translation keys and
  must stay as they are. Each entry names the exact string, its file and why.
  Keep this list short; it is reviewed like code, and an entry that no longer
  matches anything fails the checks.
*/
const SCRIPT_EXCEPTIONS = [
  // { text: "config.js", file: "js/example.js", reason: "a file name, not a key" },
];

function findScriptReferenceProblems(source, translations, { file, exceptions = SCRIPT_EXCEPTIONS }) {
  const problems = [];
  const excepted = (text) => exceptions.some((entry) => entry.text === text && entry.file === file);
  for (const piece of scanScript(source)) {
    const { text, line, complete } = piece;
    const built = builtKeyProblem(piece);
    if (built) problems.push(`${file}:${line}: key built from pieces ${built}`);
    // An exception lifts only this key check, never R1-R3.
    if (!complete || !KEY_SHAPE.test(text) || excepted(text)) continue;
    const missing = languagesWithout(text, translations);
    if (missing.length) {
      problems.push(
        `${file}:${line}: "${text}" looks like a translation key but there is no such key in ${missing.join(", ")}`,
      );
    }
  }
  return problems;
}

// The exception list itself: every entry has a reason, and its string still
// appears in its file. `scripts` maps each file name to its source.
function findExceptionListProblems(scripts, exceptions = SCRIPT_EXCEPTIONS) {
  return exceptions.flatMap(({ text, file, reason }) => {
    const problems = [];
    if (typeof reason !== "string" || reason.trim() === "") {
      problems.push(`exception "${text}" in ${file} has no reason; add one`);
    }
    const source = scripts[file];
    if (source === undefined || !scanScript(source).some((piece) => piece.text === text)) {
      problems.push(`exception "${text}" in ${file} matches nothing; remove it`);
    }
    return problems;
  });
}

// 4. Syntax: `node --check` on each file separately. Given several files it
// checks only the first, so one call per file is the only safe way.
function findSyntaxProblems(files) {
  return files.flatMap((file) => {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status === 0) return [];
    const error = result.stderr.split("\n").find((text) => /Error/.test(text)) || "does not parse";
    return [`${file}: ${error.trim()}`];
  });
}

// 5. Course hub (spec #36, Seam 1): the hub shows exactly the agreed Lessons, in
// order, with the agreed availability, and a real last-checked date. `lessons` is
// the agreed list (tests/course-lessons.js). Limits: this proves the page's
// structure only, not that the text is accurate or that a linked page exists.
function isCalendarDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function findCourseHubProblems(html, lessons) {
  const problems = [];
  const page = html.replace(/<!--[\s\S]*?-->/g, "");

  const date = /<time\b[^>]*\sdatetime\s*=\s*"([^"]*)"/i.exec(page);
  if (!date) problems.push("the hub has no last-checked date (<time datetime>)");
  else if (!isCalendarDate(date[1])) {
    problems.push(`the last-checked date "${date[1]}" is not a real calendar date (use YYYY-MM-DD)`);
  }

  const list = /<ol\b[^>]*class="lesson-list"[^>]*>([\s\S]*?)<\/ol>/i.exec(page);
  if (!list) {
    problems.push('the hub has no Lesson list (<ol class="lesson-list">)');
    return problems;
  }
  const cards = [...list[1].matchAll(/<li\b[^>]*data-lesson="(\d+)"[^>]*>([\s\S]*?)<\/li>/gi)].map(
    ([, number, body]) => ({ number: Number(number), body }),
  );

  const agreed = lessons.map((lesson) => lesson.number);
  const shown = cards.map((card) => card.number);
  agreed.filter((n) => !shown.includes(n)).forEach((n) => problems.push(`Lesson ${n} has no card on the hub`));
  shown
    .filter((n) => !agreed.includes(n))
    .forEach((n) => problems.push(`the hub has a card for Lesson ${n}, which is not in the agreed list`));
  const shownAgreed = shown.filter((n) => agreed.includes(n));
  const wantedOrder = agreed.filter((n) => shown.includes(n));
  if (shownAgreed.join(",") !== wantedOrder.join(",")) {
    problems.push(`Lesson cards are in the order ${shownAgreed.join(", ")} but should be ${wantedOrder.join(", ")}`);
  }

  for (const lesson of lessons) {
    const card = cards.find((entry) => entry.number === lesson.number);
    if (!card) continue;
    const title = /<h[1-6]\b[^>]*data-i18n="([^"]*)"/i.exec(card.body); // the heading, not the number
    if (!title || title[1] !== lesson.titleKey) {
      problems.push(`Lesson ${lesson.number} uses the title "${title ? title[1] : "none"}" but should use "${lesson.titleKey}"`);
    }
    const link = /<a\b([^>]*)>/i.exec(card.body);
    if (lesson.released) {
      if (!link) {
        problems.push(`Lesson ${lesson.number} is released but its card is not a link`);
        continue;
      }
      const href = /href="([^"]*)"/.exec(link[1]);
      if (!href || href[1] !== lesson.page) {
        problems.push(`Lesson ${lesson.number} links to "${href ? href[1] : "nothing"}" but its page is "${lesson.page}"`);
      }
      if (!/\bdata-course-link\b/.test(link[1])) {
        problems.push(`Lesson ${lesson.number} links to a course page without data-course-link, so the language would be lost`);
      }
    } else {
      if (link) problems.push(`Lesson ${lesson.number} is not released but its card is a link`);
      if (!/data-i18n="course\.soon"/.test(card.body)) {
        problems.push(`Lesson ${lesson.number} is not released but its card does not say "course.soon"`);
      }
    }
  }
  return problems;
}

module.exports = {
  findParityProblems,
  findHtmlReferenceProblems,
  findScriptReferenceProblems,
  findExceptionListProblems,
  findSyntaxProblems,
  findCourseHubProblems,
};
