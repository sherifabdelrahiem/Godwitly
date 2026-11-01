/*
  The project checks run by `node --test` locally and on every pull request
  (spec #31): translation parity, translation keys named in the pages and
  scripts, and JavaScript syntax. Each function returns a list of problems;
  an empty list means the check passes.

  Development only: the site never loads this file.
*/
const { spawnSync } = require("node:child_process");
const path = require("node:path");

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
// the agreed list, from the Crash course's manifest (courses/). Limits: this proves the page's
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

// 6. Course Lesson page (spec #36, Seam 1; ticket #39). `file` is the page's path from the
// project root, `courseDir` the Crash course folder, `lessons` the agreed list and `exists`
// says whether a project-relative file is there. Limits: this proves the page's structure
// and that local files exist, not that external References still work or that the text is
// accurate or matches its approved draft.
const OUTSIDE_LINK = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

// The project-relative path a relative link points to, without its query or #hash.
function resolveLink(file, href) {
  const target = href.split("#")[0].split("?")[0];
  return path.posix.normalize(path.posix.join(path.posix.dirname(file), target));
}

// An attribute's value in double quotes, single quotes or none; undefined when absent.
function attributeValue(attributes, name) {
  const found = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, "i").exec(attributes);
  return found ? (found[1] ?? found[2] ?? found[3]) : undefined;
}

// The callouts and the mascot file each one shows (spec #36; the Watch out bird is
// mascot 7, which the PO accepted in place of mascot 6; the Resources callout, for a file to download, has mascot 8).
const CALLOUT_MASCOTS = {
  think: "mascot-2-thoughtful.webp",
  confusion: "mascot-3-confused.webp",
  key: "mascot-4-lightbulb.webp",
  warning: "mascot-7-attentive.webp",
  resource: "mascot-8-envelopes.webp",
};

function anchorsIn(html) {
  return [...html.matchAll(/<a\b([^>]*)>/gi)].map(([, attributes]) => ({
    attributes,
    href: attributeValue(attributes, "href"),
  }));
}

function findCourseLessonProblems(html, { file, courseDir, lessons, exists }) {
  const problems = [];
  const page = html.replace(/<!--[\s\S]*?-->/g, "");
  const pageOf = (lesson) => path.posix.join(courseDir, lesson.page);
  const current = lessons.find((lesson) => pageOf(lesson) === file);
  if (!current) return [`${file} is not one of the agreed Lesson pages`];

  // The sidebar: every agreed Lesson, in order, with the agreed availability.
  const nav = /<nav\b[^>]*\bdata-lesson-nav\b[^>]*>([\s\S]*?)<\/nav>/i.exec(page);
  if (!nav) {
    problems.push("the Lesson page has no sidebar (<nav data-lesson-nav>)");
  } else {
    const starts = [...nav[1].matchAll(/<li\b[^>]*\bdata-lesson="(\d+)"[^>]*>/gi)];
    const entries = starts.map((start, i) => ({
      number: Number(start[1]),
      body: nav[1].slice(start.index + start[0].length, i + 1 < starts.length ? starts[i + 1].index : undefined),
    }));
    const agreed = lessons.map((lesson) => lesson.number);
    const shown = entries.map((entry) => entry.number);
    agreed.filter((n) => !shown.includes(n)).forEach((n) => problems.push(`Lesson ${n} is not in the sidebar`));
    shown
      .filter((n) => !agreed.includes(n))
      .forEach((n) => problems.push(`the sidebar has Lesson ${n}, which is not in the agreed list`));
    const shownAgreed = shown.filter((n) => agreed.includes(n));
    const wantedOrder = agreed.filter((n) => shown.includes(n));
    if (shownAgreed.join(",") !== wantedOrder.join(",")) {
      problems.push(`sidebar Lessons are in the order ${shownAgreed.join(", ")} but should be ${wantedOrder.join(", ")}`);
    }

    const ids = new Set([...page.matchAll(/\sid\s*=\s*"([^"]*)"/gi)].map(([, id]) => id));
    for (const lesson of lessons) {
      const entry = entries.find((candidate) => candidate.number === lesson.number);
      if (!entry) continue;
      const title = /data-i18n="(course\.lesson\d+\.title)"/.exec(entry.body);
      if (!title || title[1] !== lesson.titleKey) {
        problems.push(
          `Lesson ${lesson.number} uses the sidebar title "${title ? title[1] : "none"}" but should use "${lesson.titleKey}"`,
        );
      }
      const link = /<a\b([^>]*)>/i.exec(entry.body);
      const href = link && /href="([^"]*)"/.exec(link[1]);
      if (lesson.released) {
        if (!link) {
          problems.push(`Lesson ${lesson.number} is released but its sidebar entry is not a link`);
        } else if (!href || resolveLink(file, href[1]) !== pageOf(lesson)) {
          problems.push(
            `Lesson ${lesson.number} links to "${href ? href[1] : "nothing"}" in the sidebar, which is not its page "${pageOf(lesson)}"`,
          );
        }
      } else {
        if (link) problems.push(`Lesson ${lesson.number} is not released but the sidebar links to it`);
        if (!/data-i18n="course\.soon"/.test(entry.body)) {
          problems.push(`Lesson ${lesson.number} is not released but its sidebar entry does not say "course.soon"`);
        }
      }
      if (lesson === current) {
        if (!link || !/\baria-current="page"/.test(link[1])) {
          problems.push(`Lesson ${lesson.number} is the current Lesson but its sidebar entry is not marked aria-current="page"`);
        }
        const sections = [...entry.body.matchAll(/<ul\b[\s\S]*?<\/ul>/gi)].flatMap(([list]) => anchorsIn(list));
        if (!sections.length) {
          problems.push(`Lesson ${lesson.number} is the current Lesson but its sidebar entry does not list its Sections`);
        }
        sections
          .filter(({ href: target }) => target && target.startsWith("#") && !ids.has(target.slice(1)))
          .forEach(({ href: target }) => problems.push(`the sidebar Section link "${target}" points to nothing on the page`));
      }
    }
  }

  // The previous/next pager and its boundary rules. Items are marked data-pager="hub",
  // "prev", "next" or "soon" (the non-link text for a Lesson that is not released).
  const pager = /<nav\b[^>]*\bdata-lesson-pager\b[^>]*>([\s\S]*?)<\/nav>/i.exec(page);
  if (!pager) {
    problems.push("the Lesson page has no previous/next pager (<nav data-lesson-pager>)");
  } else {
    const items = anchorsIn(pager[1]).map(({ attributes, href }) => ({
      kind: (/\sdata-pager="([^"]*)"/.exec(attributes) || [])[1],
      href,
    }));
    const linksTo = (kind, target) =>
      items.some((item) => item.kind === kind && item.href !== undefined && resolveLink(file, item.href) === target);
    const hasHubLink = linksTo("hub", path.posix.join(courseDir, "index.html"));
    const previous = lessons.find((lesson) => lesson.number === current.number - 1);
    const next = lessons.find((lesson) => lesson.number === current.number + 1);
    if (!previous) {
      if (!hasHubLink) problems.push('the pager has no link back to the hub in place of "previous"');
    } else if (!linksTo("prev", pageOf(previous))) {
      problems.push(`Lesson ${current.number} has no "previous" link to Lesson ${previous.number}`);
    }
    if (next && next.released) {
      if (!linksTo("next", pageOf(next))) {
        problems.push(`Lesson ${current.number} has no "next" link to Lesson ${next.number}`);
      }
    } else if (next) {
      if (items.some((item) => item.kind === "next")) {
        problems.push(`Lesson ${next.number} is not released, so "next" must be the coming-soon text, not a link`);
      }
      if (!/\sdata-pager="soon"/.test(pager[1])) {
        problems.push(`the pager does not say that Lesson ${next.number} is coming soon (data-pager="soon")`);
      }
      if (previous && !hasHubLink) {
        problems.push(`Lesson ${next.number} is not released, so the pager needs a link back to the hub`);
      }
    }
  }

  // The last-checked date: a real calendar date in machine-readable form.
  const date = /<time\b[^>]*\sdatetime\s*=\s*"([^"]*)"/i.exec(page);
  if (!date) problems.push("the Lesson page has no last-checked date (<time datetime>)");
  else if (!isCalendarDate(date[1])) {
    problems.push(`the last-checked date "${date[1]}" is not a real calendar date (use YYYY-MM-DD)`);
  }

  // The Lesson text is Arabic, right to left, whatever language the shared parts show.
  const parts = [...page.matchAll(/<([a-z0-9]+)\b([^>]*\sclass\s*=\s*"[^"]*\blesson-part\b[^"]*"[^>]*)>/gi)];
  if (!parts.length) problems.push('the Lesson page has no Lesson content (class="lesson-part")');
  for (const [, tag, attributes] of parts) {
    if (!/\slang\s*=\s*"ar"/i.test(attributes) || !/\sdir\s*=\s*"rtl"/i.test(attributes)) {
      const id = /\sid\s*=\s*"([^"]*)"/i.exec(attributes);
      problems.push(`a Lesson part (<${tag}${id ? ` id="${id[1]}"` : ""}>) is not marked lang="ar" dir="rtl"`);
    }
  }

  // English visitors are told the Lesson is available in Arabic.
  if (!/data-i18n="course\.lesson\.arabicNotice"/.test(page)) {
    problems.push(
      'the Lesson page has no "available in Arabic" notice for English (data-i18n="course.lesson.arabicNotice")',
    );
  }

  // The "You're done when" checklist: every item has an identifier, unique in the Lesson.
  // Ticks are saved against these identifiers (ticket #41), so they must not repeat.
  const checklist = /<(ul|ol)\b[^>]*\sdata-checklist\b[^>]*>([\s\S]*?)<\/\1>/i.exec(page);
  if (!checklist) {
    problems.push('the Lesson page has no "You\'re done when" checklist (data-checklist)');
  } else {
    const boxes = [...checklist[2].matchAll(/<input\b[^>]*\stype\s*=\s*"checkbox"[^>]*>/gi)];
    if (!boxes.length) problems.push("the checklist has no items");
    const seen = new Set();
    const repeated = new Set();
    boxes.forEach(([box], i) => {
      const id = (/\sdata-item\s*=\s*"([^"]*)"/i.exec(box) || [])[1];
      if (!id || id.trim() === "") problems.push(`checklist item ${i + 1} has no identifier (data-item)`);
      else if (seen.has(id)) repeated.add(id);
      else seen.add(id);
    });
    repeated.forEach((id) => problems.push(`the checklist identifier "${id}" is used more than once`));
  }

  // The Self-check: each question has at least two options and exactly one correct one,
  // so the page can always show the right answer.
  const questions = page.split(/(?=<div\b[^>]*\bclass\s*=\s*["'][^"']*\bself-check__item\b)/i).slice(1);
  questions.forEach((question, i) => {
    const options = [...question.matchAll(/<button\b[^>]*\bself-check__option\b[^>]*>/gi)].map(([tag]) => tag);
    const correct = options.filter((tag) => attributeValue(tag, "data-correct") === "true").length;
    if (options.length < 2) problems.push(`Self-check question ${i + 1} has fewer than two options`);
    else if (correct === 0) problems.push(`Self-check question ${i + 1} has no correct option (data-correct="true")`);
    else if (correct > 1) problems.push(`Self-check question ${i + 1} has more than one correct option`);
  });

  // Callouts: the text label carries the meaning, so each has one; the mascot is decorative
  // (alt="") and fixed per kind. Two callouts in a row would put two mascots on one screen of
  // reading, which the spec rules out. (Screens differ, so the full rule is checked by eye.)
  const callouts = [...page.matchAll(/<div\b([^>]*\bclass\s*=\s*(["'])[^"']*\bcallout\b[^"']*\2[^>]*)>([\s\S]*?)<\/div>/gi)];
  callouts.forEach(([whole, attributes, , inner], i) => {
    const n = i + 1;
    const kind = ((attributeValue(attributes, "class") || "").match(/\bcallout--([a-z]+)/) || [])[1];
    if (!Object.hasOwn(CALLOUT_MASCOTS, kind)) {
      problems.push(`callout ${n} has the unknown kind "${kind || ""}"`);
    }
    const bird = /<img\b([^>]*)>/i.exec(inner);
    if (bird) {
      const src = attributeValue(bird[1], "src") || "";
      if (kind in CALLOUT_MASCOTS && !src.endsWith("/" + CALLOUT_MASCOTS[kind])) {
        problems.push(`callout ${n} (${kind}) should show ${CALLOUT_MASCOTS[kind]}`);
      }
      if (attributeValue(bird[1], "alt") !== "") {
        problems.push(`callout ${n} has a mascot with alt text; a mascot is decorative (alt="")`);
      }
    }
    const label = /<[a-z]+\b[^>]*\bclass\s*=\s*["'][^"']*\bcallout__label\b[^"']*["'][^>]*>([\s\S]*?)<\/[a-z]+>/i.exec(inner);
    if (!label || label[1].replace(/<[^>]*>/g, "").trim() === "") {
      problems.push(`callout ${n} has no text label (class="callout__label"); the label carries the meaning`);
    }
    const next = callouts[i + 1];
    if (next) {
      const gap = page.slice(callouts[i].index + whole.length, next.index);
      if (gap.trim() === "") {
        problems.push(`callouts ${n} and ${n + 1} follow each other directly; at most one mascot per screen of reading`);
      }
    }
  });

  // Code boxes: the Copy button copies the box's one <code>, so each box needs exactly one,
  // with something in it.
  [...page.matchAll(/<(div|pre)\b[^>]*\bclass\s*=\s*["'][^"']*\bcode-box\b[^"']*["'][^>]*>([\s\S]*?)<\/pre>/gi)].forEach(
    ([, , inner], i) => {
      const codes = [...inner.matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/gi)];
      if (codes.length !== 1) problems.push(`code box ${i + 1} must hold exactly one <code> (its Copy button copies that text)`);
      else if (codes[0][1].replace(/<[^>]*>/g, "").trim() === "") problems.push(`code box ${i + 1} is empty`);
    },
  );

  // Links. Findings are collected in a set so a link repeated on the page is reported once.
  //  - nothing may link to a Lesson page that is not released yet;
  //  - a relative link or image must point to a file that exists, resolved from this page;
  //  - an external link must be a complete, well-formed https:// address;
  //  - a link to another course page must carry the language (data-course-link).
  const linkProblems = new Set();
  const isHttps = (href) => {
    try {
      const url = new URL(href);
      return /^https:\/\/[^\s]+$/.test(href) && url.protocol === "https:" && url.hostname.includes(".");
    } catch (error) {
      return false;
    }
  };
  for (const { attributes, href } of anchorsIn(page)) {
    if (!href || href.startsWith("#")) continue;
    if (OUTSIDE_LINK.test(href)) {
      if (!isHttps(href)) linkProblems.add(`the link "${href}" is not a complete https:// address`);
      continue;
    }
    const target = resolveLink(file, href);
    const lesson = lessons.find((candidate) => pageOf(candidate) === target);
    if (lesson && !lesson.released) {
      linkProblems.add(`the Lesson page links to Lesson ${lesson.number}, which is not released`);
      continue;
    }
    if (!exists(target)) linkProblems.add(`the link "${href}" points to ${target}, which does not exist`);
    if (target.startsWith(courseDir + "/") && target.endsWith(".html") && !/\sdata-course-link\b/.test(attributes)) {
      linkProblems.add(`the link "${href}" goes to a course page without data-course-link, so the language would be lost`);
    }
  }
  for (const [, attributes] of page.matchAll(/<img\b([^>]*)>/gi)) {
    const src = attributeValue(attributes, "src");
    if (!src || OUTSIDE_LINK.test(src)) continue;
    const target = resolveLink(file, src);
    if (!exists(target)) linkProblems.add(`the image "${src}" points to ${target}, which does not exist`);
  }
  problems.push(...linkProblems);
  return problems;
}

// 7. Manifest checklist items (spec #56, ticket #57). The manifest is the one source of each
// Lesson's checklist items. For each released Lesson, its hub card lists exactly the manifest's
// current (not retired) items, and its Lesson page has exactly those items, each marked
// data-required="true" or "false" as the manifest says. The hub judges "complete" from the card's items (ticket #41), so a changed
// checklist is never judged by an old copy. lessonPages maps a Lesson number to its HTML.
function findManifestChecklistProblems(manifest, hubHtml, lessonPages) {
  const problems = [];
  const hub = hubHtml.replace(/<!--[\s\S]*?-->/g, "");
  const list = /<ol\b[^>]*class="lesson-list"[^>]*>([\s\S]*?)<\/ol>/i.exec(hub);
  const cards = [...(list ? list[1] : "").matchAll(/<li\b([^>]*\bdata-lesson="(\d+)"[^>]*)>/gi)].map(([, attributes, number]) => ({
    number: Number(number),
    items: (/\sdata-checklist-items="([^"]*)"/i.exec(attributes) || [])[1],
  }));
  const sameIds = (a, b) => a.every((id) => b.includes(id)) && b.every((id) => a.includes(id)) && a.length === new Set(a).size;
  for (const lesson of manifest.lessons.filter((entry) => entry.released)) {
    const current = lesson.items.filter((item) => !item.retired);
    const wanted = current.map((item) => item.id);
    const card = cards.find((entry) => entry.number === lesson.number);
    if (!card) {
      problems.push(`Lesson ${lesson.number} has no card on the hub, so its checklist items cannot be compared`);
    } else if (card.items === undefined || card.items.trim() === "") {
      problems.push(`Lesson ${lesson.number}'s hub card has no checklist items (data-checklist-items)`);
    } else if (!sameIds(card.items.trim().split(/\s+/), wanted)) {
      problems.push(`Lesson ${lesson.number}'s hub card lists the items "${card.items}" but the manifest has "${wanted.join(" ")}"`);
    }

    const page = (lessonPages[lesson.number] || "").replace(/<!--[\s\S]*?-->/g, "");
    // "data-checklist" itself, not data-checklist-items
    const checklist = /<(ul|ol)\b[^>]*\sdata-checklist(?=[\s=>])[^>]*>([\s\S]*?)<\/\1>/i.exec(page);
    const onPage = checklist
      ? [...checklist[2].matchAll(/<input\b[^>]*\sdata-item\s*=\s*"([^"]*)"[^>]*>/gi)].map(([box, id]) => ({
          id,
          required: attributeValue(box, "data-required"),
        }))
      : [];
    const pageIds = onPage.map((item) => item.id);
    if (!sameIds(pageIds, wanted)) {
      problems.push(`Lesson ${lesson.number}'s page has the items "${pageIds.join(" ")}" but the manifest has "${wanted.join(" ")}"`);
      continue;
    }
    for (const item of onPage) {
      const agreed = current.find((entry) => entry.id === item.id);
      if (item.required !== "true" && item.required !== "false") {
        problems.push(`Lesson ${lesson.number}'s item "${item.id}" has no data-required="true" or "false" on its page`);
      } else if (item.required !== String(agreed.required)) {
        problems.push(
          `Lesson ${lesson.number}'s item "${item.id}" is marked data-required="${item.required}" on its page but the manifest says ${agreed.required}`,
        );
      }
    }
  }
  return problems;
}

// 8. Crash course manifest (spec #56, ticket #57): its own rules. Lessons are numbered 1, 2, 3
// in order, every flag is true or false, and an item id appears once in the whole Crash course,
// retired items included, so a retired id is never reused. Limits: this sees one version of the
// manifest, so an id deleted outright and later added back with a new meaning goes unnoticed
// (retired items must stay in the list), and it never checks that a summary is accurate (the
// project checks compare each real summary with its Arabic hub outcome). Checks 7 and 9
// assume a manifest that passes this one; the project checks run it on every manifest.
function findManifestProblems(manifest) {
  const problems = [];
  const isFlag = (value) => value === true || value === false;
  const blank = (value) => typeof value !== "string" || value.trim() === "";
  if (blank(manifest.id)) problems.push("the manifest has no id");
  if (blank(manifest.folder)) problems.push("the manifest has no folder");
  if (!isFlag(manifest.test)) problems.push("the manifest's test flag must be true or false");
  if (!Array.isArray(manifest.lessons)) return [...problems, "the manifest has no Lesson list"];

  if (manifest.lessons.some((lesson) => !lesson || typeof lesson !== "object" || Array.isArray(lesson))) {
    return [...problems, "the manifest's Lesson list has an entry that is not a Lesson"];
  }
  const numbers = manifest.lessons.map((lesson) => lesson.number);
  const wanted = numbers.map((_, i) => i + 1);
  if (!numbers.every((number, i) => number === wanted[i]) || numbers.length !== wanted.length) {
    const shown = numbers.map((number) => (typeof number === "number" ? number : JSON.stringify(number)));
    problems.push(`Lessons are numbered ${shown.join(", ")} but should be ${wanted.join(", ")}`);
  }

  const ids = [];
  for (const lesson of manifest.lessons) {
    if (blank(lesson.titleKey)) problems.push(`Lesson ${lesson.number} has no title key`);
    if (blank(lesson.summary)) problems.push(`Lesson ${lesson.number} has no summary`);
    for (const flag of ["preview", "required", "released"]) {
      if (!isFlag(lesson[flag])) problems.push(`Lesson ${lesson.number}'s ${flag} flag must be true or false`);
    }
    if (!Array.isArray(lesson.items)) {
      problems.push(`Lesson ${lesson.number} has no item list`);
      continue;
    }
    // Spec #56 v5: a released Required Lesson must be completable, and never complete with nothing ticked.
    // Skipped while an item's own flag is broken: that is already reported below, once.
    const flagsFine = lesson.items.every((item) => item && isFlag(item.required));
    if (flagsFine && lesson.released === true && lesson.required === true && !lesson.items.some((item) => item.required && item.retired !== true)) {
      problems.push(`Lesson ${lesson.number} is released and Required but has no current Required checklist item`);
    }
    for (const item of lesson.items) {
      if (!item || typeof item !== "object" || blank(item.id)) {
        problems.push(`Lesson ${lesson.number} has an item with no id`);
        continue;
      }
      ids.push(item.id);
      if (!isFlag(item.required)) problems.push(`Lesson ${lesson.number}'s item "${item.id}" has a required flag that is not true or false`);
      if (item.retired !== undefined && item.retired !== true) {
        problems.push(`Lesson ${lesson.number}'s item "${item.id}" has a retired flag that is not true`);
      }
    }
  }
  new Set(ids.filter((id, i) => ids.indexOf(id) !== i)).forEach((id) =>
    problems.push(`the item id "${id}" is used more than once (a retired id is never reused)`),
  );
  return problems;
}

// 9. The public part of a manifest (spec #56) holds only the agreed fields: the Crash course's
// id and Lessons; for a released Lesson its number, title key, summary, three flags and current
// items (id and required flag); for a coming-soon Lesson its number and title key. A test Crash
// course has none. `part` is what courses/manifest.js publicPart() gives for `manifest`.
const PUBLIC_FIELDS = {
  course: ["id", "lessons"],
  released: ["number", "titleKey", "summary", "preview", "required", "released", "items"],
  soon: ["number", "titleKey"],
  item: ["id", "required"],
};

function findPublicPartProblems(part, manifest) {
  if (manifest.test) {
    return part === null ? [] : [`the test Crash course ${manifest.id} has a public part; it must have none`];
  }
  if (part === null || typeof part !== "object") return [`the Crash course ${manifest.id} has no public part`];
  const problems = [];
  const extraFields = (object, allowed, where) =>
    Object.keys(object)
      .filter((field) => !allowed.includes(field))
      .forEach((field) => problems.push(`${where} has the field "${field}", which is not public`));
  extraFields(part, PUBLIC_FIELDS.course, "the public part");
  for (const lesson of part.lessons || []) {
    const agreed = manifest.lessons.find((entry) => entry.number === lesson.number);
    const where = `Lesson ${lesson.number} in the public part`;
    if (!agreed) {
      problems.push(`${where} is not in the manifest`);
      continue;
    }
    extraFields(lesson, agreed.released ? PUBLIC_FIELDS.released : PUBLIC_FIELDS.soon, where);
    if (!agreed.released) continue;
    for (const item of lesson.items || []) {
      const itemWhere = `Lesson ${lesson.number}'s item "${item.id}" in the public part`;
      extraFields(item, PUBLIC_FIELDS.item, itemWhere);
      const source = agreed.items.find((entry) => entry.id === item.id);
      if (!source) problems.push(`${itemWhere} is not one of its items in the manifest`);
      else if (source.retired) problems.push(`${itemWhere} is retired`);
    }
  }
  return problems;
}

// 10. The production deploy file list (deploy-files.txt) holds no test Crash course material
// and no manifest: no entry is, holds or sits inside a test Crash course's folder or any
// manifest file (a manifest holds more than is public). The deploy command hands each entry to
// git archive as it stands, so an entry must be one plain path: no spaces (the shell would split
// it), no pattern characters and no ":" pathspec magic (git would match more than it names),
// and every segment starts with a letter, digit or "_": no "-" (git would read an option such as
// -o), no ".", ".." or hidden names, and no leading "/".
// `paths` is the list's lines, blank lines removed; `manifests` is courses/manifest.js
// MANIFESTS. Limits: this reads the list, not what was actually uploaded, so the assembled files
// are still inspected before each upload (spec #56).
const PLAIN_PATH = /^[A-Za-z0-9_][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*\/?$/;

function findDeployListProblems(paths, manifests) {
  if (!paths.length) return ["the deploy file list is empty"];
  const clean = (entry) => path.posix.normalize(entry).replace(/\/+$/, "").replace(/^\.$/, "");
  const material = manifests.flatMap(({ file, manifest }) => {
    if (!manifest.test) return [{ target: clean(file), what: "a Crash course manifest" }];
    const what = "test Crash course material";
    return [{ target: clean(manifest.folder), what }, { target: clean(file), what }];
  });
  const problems = [];
  for (const entry of paths) {
    if (!PLAIN_PATH.test(entry)) {
      problems.push(`the deploy file list has "${entry}"; an entry is one plain path (no spaces, patterns or pathspec magic; no leading "-" or "/"; no "." or "..")`);
      continue;
    }
    const listed = clean(entry);
    const hit = material.find(
      ({ target }) => listed === "" || listed === target || target.startsWith(listed + "/") || listed.startsWith(target + "/"),
    );
    if (hit) problems.push(`the deploy file list has "${entry}", which holds ${hit.what} (${hit.target})`);
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
  findManifestChecklistProblems,
  findCourseLessonProblems,
  findManifestProblems,
  findPublicPartProblems,
  findDeployListProblems,
};
