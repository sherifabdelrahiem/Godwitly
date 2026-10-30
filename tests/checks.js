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

// Problems for one key named somewhere: it must exist in every language.
function missingKey(where, key, translations) {
  return Object.keys(translations)
    .filter((language) => !(key in translations[language]))
    .map((language) => `${where}: no such key in ${language}`);
}

// 2. Pages: every data-i18n and data-i18n-* value is a key. HTML comments
// (<!-- ... -->, on one line or several) are removed first.
function findHtmlReferenceProblems(html, translations) {
  const problems = [];
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const attributes = /\b(data-i18n(?:-[a-z]+)*)="([^"]*)"/g;
  for (const [, name, key] of withoutComments.matchAll(attributes)) {
    problems.push(...missingKey(`${name}="${key}"`, key, translations));
  }
  return problems;
}

// 3. Scripts: a translation key in JavaScript is one complete string
// (AGENTS.md, Development rules). Any string shaped like a key must be one.
const KEY_SHAPE = /^[a-z][a-z0-9]*\.[A-Za-z0-9]+$/;

// After these, a "/" starts a regular expression rather than a division.
const BEFORE_REGEX = "(,=:[!&|?{};+-*%<>~^";
const BEFORE_REGEX_WORDS = ["return", "typeof", "case", "in", "of", "void", "delete", "new", "instanceof"];

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
    if (lastIndex < 0 || BEFORE_REGEX.includes(source[lastIndex])) return true;
    const word = source.slice(0, lastIndex + 1).match(/[A-Za-z_$][\w$]*$/);
    return Boolean(word) && BEFORE_REGEX_WORDS.includes(word[0]);
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
      else if (c === "\n") break;
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
  Limits, not detected: keys joined with no dotted piece, such as
  [ns, "title"].join(".") or ns + sep + name, and keys that reach the scripts
  from anywhere else. The checks never prove that every key exists.
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
    if (excepted(text)) continue;
    const built = builtKeyProblem(piece);
    if (built) problems.push(`${file}:${line}: key built from pieces ${built}`);
    if (!complete || !KEY_SHAPE.test(text)) continue;
    const missing = Object.keys(translations).filter((language) => !(text in translations[language]));
    if (missing.length) {
      problems.push(
        `${file}:${line}: "${text}" looks like a translation key but there is no such key in ${missing.join(", ")}`,
      );
    }
  }
  return problems;
}

// An exception whose string no longer appears in its file. `scripts` maps
// each file name to its source.
function findStaleExceptions(scripts, exceptions = SCRIPT_EXCEPTIONS) {
  return exceptions
    .filter(({ text, file }) => {
      const source = scripts[file];
      return source === undefined || !scanScript(source).some((piece) => piece.text === text);
    })
    .map(({ text, file }) => `exception "${text}" in ${file} matches nothing; remove it`);
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

module.exports = {
  findParityProblems,
  findHtmlReferenceProblems,
  findScriptReferenceProblems,
  findStaleExceptions,
  findSyntaxProblems,
};
