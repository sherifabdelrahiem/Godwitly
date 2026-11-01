// The gate (spec #56, "The gate"; ADR-0010). Called by functions/_middleware.js for the paths in
// _routes.json. Protected Lessons and their Resources are served only when the accounts project
// says the caller may open them; every other answer fails closed. Nothing here trusts a token's
// contents: the accounts project confirms the session and the Enrolment.
import { CSP } from "./csp.mjs";
import { COURSES } from "./routes.mjs";

export const COOKIE_NAME = "__Host-gw_session";
const CAN_OPEN_TIMEOUT_MS = 4000;
// The accounts project's address and publishable key are public by design (js/accounts-config.js).
const ACCOUNTS_URL = "https://otjvjshvwwljsdwyqoxk.supabase.co";
const ACCOUNTS_KEY = "sb_publishable_oHJURDvS2pcYxryt3wAEbw_ItcTN79C";
const LOCKED_SHELL = "/account/locked/";
const DATA_MARK = "<!--GATE-DATA-->";

function gateHeaders(contentType) {
  const headers = new Headers({
    "Content-Security-Policy": CSP,
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  });
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

function plain(status, text, extra = {}) {
  const headers = gateHeaders("text/plain; charset=utf-8");
  Object.entries(extra).forEach(([name, value]) => headers.set(name, value));
  return new Response(text, { status, headers });
}

// The path as a list of safe segments, or null if it cannot be trusted. Each segment is decoded
// once. A segment that still holds a slash, a backslash, a percent sign (double encoding), a dot
// segment or a control character is refused. Empty segments (double slashes) are dropped.
function safeSegments(pathname) {
  const out = [];
  for (const raw of pathname.split("/")) {
    if (raw === "") continue;
    let segment;
    try {
      segment = decodeURIComponent(raw);
    } catch (error) {
      return null;
    }
    if (segment === "." || segment === ".." || /[\\/%\u0000-\u001f\u007f]/.test(segment)) return null;
    out.push(segment);
  }
  return out;
}

// What a request path means: { kind: "other" } (not protected) | { kind: "refused" } | { kind: "account", rest } |
// { kind: "hub", course } | { kind: "lesson", course, lesson, rest }.
export function resolvePath(pathname) {
  const segments = safeSegments(pathname);
  if (!segments) return { kind: "refused" };
  const first = (segments[0] || "").toLowerCase();
  if (first === "account") return { kind: "account", rest: segments.slice(1) };
  const course = COURSES.find((c) => c.folder === first);
  // Not a Crash course folder: nothing here is protected. (_routes.json sends every request that is
  // not a named public path to the gate, because Pages matches routes case-sensitively and may serve
  // files case-insensitively; such a request is passed on untouched.)
  if (!course) return { kind: "other" };

  const second = (segments[1] || "").toLowerCase();
  if (course.gateFolder && (segments.length === 1 || (segments.length === 2 && second === "index.html"))) {
    return { kind: "hub", course };
  }
  const match = /^lesson-([1-9][0-9]*)$/.exec(second);
  if (!match) return course.gateFolder ? { kind: "refused" } : { kind: "other", inCourseFolder: true };
  const lesson = course.lessons.find((l) => l.number === Number(match[1]));
  if (!lesson) return { kind: "refused" };
  let rest = segments.slice(2);
  if (rest.length === 1 && rest[0].toLowerCase() === "index.html") rest = [];
  return { kind: "lesson", course, lesson, rest };
}

function canonicalPath(course, lesson, rest) {
  if (!lesson) return `/${course.folder}/`;
  const base = `/${course.folder}/lesson-${lesson.number}/`;
  return base + rest.map(encodeURIComponent).join("/");
}

function cookieValue(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return "";
}

// Only to skip a pointless call with an expired token; the accounts project is the authority.
function tokenLooksUsable(token, nowMs) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > nowMs;
  } catch (error) {
    return false;
  }
}

// "open" | "locked" | "unavailable". Never throws.
async function canOpen({ token, course, lesson, env, doFetch, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await doFetch(`${env.SUPABASE_URL || ACCOUNTS_URL}/rest/v1/rpc/can_open`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_KEY || ACCOUNTS_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_course: course.id, p_lesson: lesson.number }),
      signal: controller.signal,
    });
    if (response.status === 401) return "locked"; // an invalid or expired token
    if (response.status !== 200) return "unavailable";
    const answer = await response.json();
    return answer === "open" ? "open" : answer === "locked" ? "locked" : "unavailable";
  } catch (error) {
    return "unavailable"; // down, timed out or a malformed reply
  } finally {
    clearTimeout(timer);
  }
}

// JSON that is safe inside a <script type="application/json"> block.
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

async function lockedPage({ reason, course, lesson, request, env }) {
  const status = reason === "unavailable" ? 503 : 403;
  const extra = reason === "unavailable" ? { "Retry-After": "30" } : {};
  let shell = "";
  try {
    const asset = await env.ASSETS.fetch(new Request(new URL(LOCKED_SHELL, request.url)));
    if (asset.status === 200) shell = await asset.text();
  } catch (error) {
    shell = "";
  }
  if (!shell.includes(DATA_MARK)) {
    return plain(status, "Godwitly: this Lesson needs Enrolment, or the service is unavailable. | هذا الدرس يحتاج إلى الالتحاق، أو أن الخدمة غير متاحة.", extra);
  }
  const data = {
    reason,
    course: course.id,
    lesson: lesson.number,
    summary: lesson.summary || "",
    path: canonicalPath(course, lesson, []),
  };
  const body = shell.replace(DATA_MARK, `<script type="application/json" id="gate-data">${safeJson(data)}</script>`);
  const headers = gateHeaders("text/html; charset=utf-8");
  Object.entries(extra).forEach(([name, value]) => headers.set(name, value));
  return new Response(request.method === "HEAD" ? null : body, { status, headers });
}

async function serveAsset({ path, request, env, expectHtml = true }) {
  let asset;
  try {
    asset = await env.ASSETS.fetch(new Request(new URL(path, request.url), { method: request.method === "HEAD" ? "GET" : request.method }));
  } catch (error) {
    return plain(503, "Service unavailable", { "Retry-After": "30" });
  }
  if (asset.status !== 200) return plain(404, "Not found");
  // A missing file on Pages returns the home page with status 200: a Resource that is not a web page
  // but comes back as one does not exist.
  if (!expectHtml && /text\/html/i.test(asset.headers.get("content-type") || "")) return plain(404, "Not found");
  const headers = gateHeaders(asset.headers.get("content-type"));
  return new Response(request.method === "HEAD" ? null : asset.body, { status: 200, headers });
}

// A request the gate does not guard goes on untouched. Under a Crash course folder (which can be
// reached in a capital-letter spelling that the `_headers` rules may not match) the page's security
// headers are added if the file store did not supply its own.
async function passThrough(request, env, inCourseFolder) {
  const response = await env.ASSETS.fetch(request);
  if (!inCourseFolder || response.headers.has("content-security-policy")) return response;
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", CSP);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function handleGate(request, env, { fetch: doFetch = fetch, now = () => Date.now(), timeoutMs = CAN_OPEN_TIMEOUT_MS } = {}) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return plain(405, "Method not allowed", { Allow: "GET, HEAD" });
  }
  const url = new URL(request.url);
  const target = resolvePath(url.pathname);
  if (target.kind === "other") return passThrough(request, env, target.inCourseFolder);
  if (target.kind === "refused" || target.kind === "account") return plain(404, "Not found");

  if (target.kind === "hub") {
    return serveAsset({ path: canonicalPath(target.course, null, []), request, env });
  }

  const { course, lesson, rest } = target;
  if (!lesson.released) return plain(404, "Not found");
  const path = canonicalPath(course, lesson, rest);
  const expectHtml = rest.length === 0 || /\.html?$/i.test(rest[rest.length - 1]);
  if (lesson.preview) return serveAsset({ path, request, env, expectHtml });

  const token = cookieValue(request, COOKIE_NAME);
  if (!token || !tokenLooksUsable(token, now())) {
    return lockedPage({ reason: "locked", course, lesson, request, env });
  }
  const verdict = await canOpen({ token, course, lesson, env, doFetch, timeoutMs });
  if (verdict === "open") return serveAsset({ path, request, env, expectHtml });
  return lockedPage({ reason: verdict, course, lesson, request, env });
}
