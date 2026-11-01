// Seam 1 (spec #56, Testing Decisions): the gate's entry point under `node --test`, with a fake
// request, a fake static-file store (env.ASSETS) and a fake fetch for the accounts project.
// No live service is called. The lessons here are dummy test-course pages.
const test = require("node:test");
const assert = require("node:assert/strict");

const ORIGIN = "https://preview.godwitly.pages.dev";
const FILES = {
  "/crash-course/privacy/": "<html>PRIVACY</html>",
  "/test-course/": "<html>TEST HUB</html>",
  "/test-course/lesson-1/": "<html>TEST OPEN LESSON</html>",
  "/test-course/lesson-2/": "<html>SECRET-LOCKED-SENTINEL</html>",
  "/test-course/lesson-2/resources/notes.txt": "SECRET-RESOURCE-SENTINEL",
  "/account/locked/": '<html><!--GATE-DATA--><body>LOCKED SHELL</body></html>',
};

function jwt(payload) {
  const part = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${part({ alg: "ES256" })}.${part(payload)}.sig`;
}
const FUTURE = Math.floor(Date.now() / 1000) + 3600;
const GOOD = jwt({ sub: "user-1", exp: FUTURE });
const EXPIRED = jwt({ sub: "user-1", exp: Math.floor(Date.now() / 1000) - 60 });

function makeEnv(files = FILES) {
  const served = [];
  return {
    served,
    ASSETS: {
      async fetch(request) {
        const path = new URL(request.url).pathname;
        served.push(path);
        if (path in files) return new Response(files[path], { status: 200, headers: { "content-type": path.endsWith(".txt") ? "text/plain" : "text/html" } });
        return new Response("<html>HOME PAGE</html>", { status: 200, headers: { "content-type": "text/html" } }); // Pages' fallback
      },
    },
  };
}

// A fake accounts project: `reply` is a function (url, init) => Response | throws.
function makeFetch(reply) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return reply(url, init);
  };
  fetch.calls = calls;
  return fetch;
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function req(path, { cookie, method = "GET", headers = {} } = {}) {
  const h = new Headers(headers);
  if (cookie) h.set("cookie", `__Host-gw_session=${cookie}`);
  return new Request(ORIGIN + path, { method, headers: h });
}

let gate;
test.before(async () => {
  gate = await import("../functions/_lib/gate.mjs");
});

const REQUIRED_HEADERS = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};
function assertGateHeaders(response) {
  for (const [name, value] of Object.entries(REQUIRED_HEADERS)) assert.equal(response.headers.get(name), value, name);
  const csp = response.headers.get("content-security-policy") || "";
  assert.match(csp, /script-src 'self' https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.117\.3\/dist\/umd\/supabase\.js/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
}

test("a Preview Lesson is served to anyone without calling the accounts project", async () => {
  const env = makeEnv();
  const fetch = makeFetch(() => assert.fail("Supabase must not be called"));
  const response = await gate.handleGate(req("/test-course/lesson-1/"), env, { fetch });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "<html>TEST OPEN LESSON</html>");
  assert.equal(fetch.calls.length, 0);
  assertGateHeaders(response);
});

const SECRET = /SECRET-(LOCKED|RESOURCE)-SENTINEL/;
const answers = (value, status = 200) => makeFetch(() => json(value, status));

async function ask(path, options = {}, fetch, env = makeEnv()) {
  const response = await gate.handleGate(req(path, options), env, { fetch, timeoutMs: 50 });
  return { response, body: await response.text(), env };
}

test("a signed-out visitor gets the locked page, with no call to the accounts project and no Lesson text", async () => {
  const fetch = makeFetch(() => assert.fail("must not call"));
  const { response, body } = await ask("/test-course/lesson-2/", {}, fetch);
  assert.equal(response.status, 403);
  assert.doesNotMatch(body, SECRET);
  assert.match(body, /LOCKED SHELL/);
  assert.match(body, /<script type="application\/json" id="gate-data">/);
  const data = JSON.parse(body.match(/id="gate-data">(.*?)<\/script>/)[1]);
  assert.deepEqual(data, { reason: "locked", course: "test-course", lesson: 2, summary: "درس تجريبي يحتاج الالتحاق، نص للاختبار فقط.", path: "/test-course/lesson-2/" });
  assertGateHeaders(response);
});

test("a cookie that is missing the right shape, expired, or not a token gives the locked page without a call", async () => {
  for (const cookie of ["garbage", EXPIRED, "a.b.c", jwt({ sub: "x" })]) {
    const fetch = makeFetch(() => assert.fail("must not call"));
    const { response, body } = await ask("/test-course/lesson-2/", { cookie }, fetch);
    assert.equal(response.status, 403, cookie);
    assert.doesNotMatch(body, SECRET);
  }
});

test("an Enrolled account opens the Lesson; the accounts project gets only the token, the key and the resolved Lesson", async () => {
  const fetch = answers("open");
  const { response, body, env } = await ask("/test-course/lesson-2/", { cookie: GOOD }, fetch);
  assert.equal(response.status, 200);
  assert.match(body, SECRET);
  assertGateHeaders(response);
  assert.equal(fetch.calls.length, 1);
  const { url, init } = fetch.calls[0];
  assert.equal(url, "https://otjvjshvwwljsdwyqoxk.supabase.co/rest/v1/rpc/can_open");
  assert.equal(init.method, "POST");
  assert.equal(init.headers.Authorization, `Bearer ${GOOD}`);
  assert.match(init.headers.apikey, /^sb_publishable_/);
  assert.deepEqual(JSON.parse(init.body), { p_course: "test-course", p_lesson: 2 });
  assert.deepEqual(env.served, ["/test-course/lesson-2/"]);
});

test("not Enrolled, enrolled elsewhere, a revoked session or a refused token all give the locked page", async () => {
  for (const fetch of [answers("locked"), answers({ code: "PGRST301", message: "JWT expired" }, 401)]) {
    const { response, body } = await ask("/test-course/lesson-2/", { cookie: GOOD }, fetch);
    assert.equal(response.status, 403);
    assert.doesNotMatch(body, SECRET);
    assertGateHeaders(response);
  }
});

test("when the accounts project fails, times out or answers oddly the page says unavailable, never locked and never the Lesson", async () => {
  const failures = [
    answers({ message: "boom" }, 500),
    answers({ message: "nope" }, 403),
    makeFetch(() => {
      throw new Error("network down");
    }),
    makeFetch((url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("aborted"))))),
    answers({ unexpected: true }),
    answers("OPEN"),
    makeFetch(() => new Response("<html>not json</html>", { status: 200 })),
  ];
  for (const fetch of failures) {
    const { response, body } = await ask("/test-course/lesson-2/", { cookie: GOOD }, fetch);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.doesNotMatch(body, SECRET);
    assert.match(body, /"reason":"unavailable"/);
    assertGateHeaders(response);
  }
});

test("unknown, unreleased and oddly numbered Lessons and unknown paths in a protected folder are refused", async () => {
  const fetch = makeFetch(() => assert.fail("must not call"));
  for (const path of [
    "/test-course/lesson-3/",
    "/test-course/lesson-0/",
    "/test-course/lesson-02/",
    "/test-course/secret.html",
    "/test-course/lesson-2x/",
    "/crash-course/lesson-2/",
    "/crash-course/lesson-9/resources/a.pdf",
    "/account/locked/",
    "/account/anything",
  ]) {
    const { response, body } = await ask(path, { cookie: GOOD }, fetch);
    assert.equal(response.status, 404, path);
    assert.doesNotMatch(body, SECRET);
    assertGateHeaders(response);
  }
});

test("every spelling of a protected path is gated the same way", async () => {
  const spellings = [
    "/test-course/lesson-2",
    "/test-course/lesson-2/",
    "/test-course/lesson-2/index.html",
    "/test-course//lesson-2//",
    "//test-course/lesson-2/",
    "/test-course/lesson-2/./",
    "/test-course/%6cesson-2/",
    "/test-course/lesson%2D2/",
    "/Test-Course/Lesson-2/",
    "/test-course/lesson-1/../lesson-2/",
    "/test-course/lesson-2/%69ndex.html",
    "/test-course/lesson-2/resources/../index.html",
  ];
  for (const path of spellings) {
    const signedOut = await ask(path, {}, makeFetch(() => assert.fail("must not call")));
    assert.equal(signedOut.response.status, 403, path);
    assert.doesNotMatch(signedOut.body, SECRET);
    const enrolled = await ask(path, { cookie: GOOD }, answers("open"));
    assert.equal(enrolled.response.status, 200, path);
    assert.match(enrolled.body, /SECRET-LOCKED/);
    assert.deepEqual(enrolled.env.served, ["/test-course/lesson-2/"], path);
  }
});

test("encoded slashes, backslashes, double encoding and dot tricks are refused, never served", async () => {
  for (const path of [
    "/test-course/lesson-2%2fresources/notes.txt",
    "/test-course/lesson-2/resources%2f..%2fnotes.txt",
    "/test-course/lesson-2/%252e%252e/",
    "/test-course/lesson-2/resources/%5cnotes.txt",
    "/test-course/lesson-2/%00",
    "/test-course/lesson-2/%ZZ",
    "/test-course/lesson%2f2/",
  ]) {
    const { response, body } = await ask(path, { cookie: GOOD }, makeFetch(() => assert.fail("must not call")));
    assert.ok([404].includes(response.status), `${path} gave ${response.status}`);
    assert.doesNotMatch(body, SECRET);
  }
});

test("a Resource of a protected Lesson follows the same rule as the Lesson", async () => {
  const locked = await ask("/test-course/lesson-2/resources/notes.txt", {}, makeFetch(() => assert.fail("must not call")));
  assert.equal(locked.response.status, 403);
  assert.doesNotMatch(locked.body, SECRET);
  const open = await ask("/test-course/lesson-2/resources/notes.txt", { cookie: GOOD }, answers("open"));
  assert.equal(open.response.status, 200);
  assert.match(open.body, /SECRET-RESOURCE-SENTINEL/);
});

test("the Crash course hub in a gated folder is public; other methods are refused; HEAD and conditional requests never leak", async () => {
  const hub = await ask("/test-course/", {}, makeFetch(() => assert.fail("must not call")));
  assert.equal(hub.response.status, 200);
  assert.equal(hub.body, "<html>TEST HUB</html>");
  assertGateHeaders(hub.response);

  const post = await ask("/test-course/lesson-2/", { method: "POST", cookie: GOOD }, answers("open"));
  assert.equal(post.response.status, 405);
  assert.doesNotMatch(post.body, SECRET);

  const head = await ask("/test-course/lesson-2/", { method: "HEAD" }, makeFetch(() => assert.fail("must not call")));
  assert.equal(head.response.status, 403);
  assert.equal(head.body, "");

  const conditional = await ask(
    "/test-course/lesson-2/",
    { headers: { "if-none-match": '"abc"', "if-modified-since": "Mon, 01 Jan 2030 00:00:00 GMT", range: "bytes=0-5" } },
    makeFetch(() => assert.fail("must not call")),
  );
  assert.equal(conditional.response.status, 403);
  assert.doesNotMatch(conditional.body, SECRET);
});

test("when the locked-page file is missing the answer is still locked, in plain text, with the headers", async () => {
  const env = makeEnv({ ...FILES, "/account/locked/": "no placeholder here" });
  const { response, body } = await ask("/test-course/lesson-2/", {}, makeFetch(() => assert.fail("x")), env);
  assert.equal(response.status, 403);
  assert.doesNotMatch(body, SECRET);
  assertGateHeaders(response);
});

test("a path that is not a protected folder is passed on untouched, with no call to the accounts project", async () => {
  const env = makeEnv({ ...FILES, "/css/styles.css": "body{}" });
  const fetch = makeFetch(() => assert.fail("must not call"));
  for (const path of ["/css/styles.css", "/CSS/styles.css", "/crash-course/privacy/", "/crash-course/lesson-1/", "/crash-course/not-a-lesson/"]) {
    const response = await gate.handleGate(req(path), env, { fetch });
    assert.equal(response.status, 200, path);
  }
  assert.deepEqual(env.served, ["/css/styles.css", "/CSS/styles.css", "/crash-course/privacy/", "/crash-course/lesson-1/", "/crash-course/not-a-lesson/"]);
});

test("the capital-letter spellings of a protected folder are gated, never passed on", async () => {
  for (const path of ["/TEST-COURSE/LESSON-2/", "/Crash-Course/Lesson-2/", "/ACCOUNT/locked/"]) {
    const { response, body, env } = await ask(path, {}, makeFetch(() => assert.fail("must not call")));
    assert.ok([403, 404].includes(response.status), `${path} gave ${response.status}`);
    assert.doesNotMatch(body, SECRET);
    assert.ok(!env.served.includes(path));
  }
});

test("an Enrolled request for a Resource that does not exist is refused, not answered with the home page", async () => {
  const { response, body } = await ask("/test-course/lesson-2/missing.txt", { cookie: GOOD }, answers("open"));
  assert.equal(response.status, 404);
  assert.doesNotMatch(body, /HOME PAGE/);
});

test("a capital-letter spelling under a Crash course folder that is passed on still gets the page's policy", async () => {
  const response = await gate.handleGate(req("/Crash-Course/privacy/"), makeEnv(), { fetch: makeFetch(() => assert.fail("x")) });
  assert.match(response.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
