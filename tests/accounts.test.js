// Godwitly account sign-in (spec #56, ticket #58), tested with a fake Supabase library and storage.
const test = require("node:test");
const assert = require("node:assert/strict");
const { ACCOUNTS_STORAGE_KEY, createAccountSession, readOAuthError, cleanOAuthAddress } = require("../js/accounts.js");

function fakeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (name) => (values.has(name) ? values.get(name) : null),
    removeItem: (name) => values.delete(name),
    names: () => [...values.keys()],
  };
}

// A stand-in for supabase.createClient. `emit` plays an Auth event to the page.
function fakeLibrary({ signInError = null, signOutThrows = false, signOutError = null, initializeError = null } = {}) {
  const calls = { created: [], signIn: [], signOut: [], rpc: [] };
  let listener;
  const createClient = (url, key, options) => {
    calls.created.push({ url, key, options });
    return {
      rpc: async (name) => {
        calls.rpc.push(name);
        return { data: "recorded", error: null };
      },
      auth: {
        onAuthStateChange: (callback) => {
          listener = callback;
        },
        initialize: async () => ({ error: initializeError }),
        signInWithOAuth: async (args) => {
          calls.signIn.push(args);
          return { error: signInError };
        },
        signOut: async (args) => {
          calls.signOut.push(args);
          if (signOutThrows) throw new Error("offline");
          return { error: signOutError };
        },
      },
    };
  };
  return { calls, createClient, emit: (event, session) => listener(event, session) };
}

function build(overrides = {}) {
  const library = overrides.library || fakeLibrary();
  const storage = overrides.storage || fakeStorage();
  const session = createAccountSession({
    protocol: "https:",
    hasLocks: true,
    createClient: library.createClient,
    url: "https://accounts.example",
    key: "sb_publishable_test",
    storage,
    pageAddress: () => "https://godwitly.example/crash-course/?lang=en",
    ...overrides.options,
  });
  return { session, library, storage };
}

const signedInAs = (meta) => ({ user: { user_metadata: meta } });

test("coming back from Google with an error shows our message and cleans the address", async () => {
  let cleaned = 0;
  const { session } = build({ options: { readAddressError: () => "access_denied", cleanAddress: () => cleaned++ } });
  await session.start();
  assert.equal(session.getState().message, "account.signInFailed");
  assert.equal(cleaned, 1);
});

test("a start error from the library also shows our message, never its text", async () => {
  const { session } = build({ library: fakeLibrary({ initializeError: new Error("secret detail") }) });
  await session.start();
  assert.equal(session.getState().message, "account.signInFailed");
  assert.equal(JSON.stringify(session.getState()).includes("secret"), false);
});

test("a clean return from Google shows no message", async () => {
  const { session } = build();
  await session.start();
  assert.equal(session.getState().message, "");
});

test("it waits for the saved session before deciding the person is signed out", () => {
  const { session, library } = build();
  session.start();
  assert.equal(session.getState().status, "loading");
  library.emit("INITIAL_SESSION", null);
  assert.equal(session.getState().status, "signed-out");
});

test("a saved session shows the Google name", () => {
  const { session, library } = build();
  session.start();
  library.emit("INITIAL_SESSION", signedInAs({ full_name: "  Sherif عبد الرحيم  " }));
  assert.deepEqual([session.getState().status, session.getState().name], ["signed-in", "Sherif عبد الرحيم"]);
});

test("the name falls back to the 'name' field, then to empty", () => {
  const { session, library } = build();
  session.start();
  library.emit("SIGNED_IN", signedInAs({ name: "Mona" }));
  assert.equal(session.getState().name, "Mona");
  library.emit("USER_UPDATED", signedInAs({}));
  assert.equal(session.getState().name, "");
});

test("the client uses its own storage key and the PKCE flow", () => {
  const { session, library } = build();
  session.start();
  const { url, key, options } = library.calls.created[0];
  assert.equal(url, "https://accounts.example");
  assert.equal(key, "sb_publishable_test");
  assert.equal(options.auth.storageKey, ACCOUNTS_STORAGE_KEY);
  assert.equal(options.auth.flowType, "pkce");
});

test("signing in asks Google and returns to the same page, and enrols in nothing", async () => {
  const { session, library } = build();
  session.start();
  await session.signIn();
  assert.deepEqual(library.calls.signIn, [
    {
      provider: "google",
      options: { redirectTo: "https://godwitly.example/crash-course/?lang=en", queryParams: { prompt: "select_account" } },
    },
  ]);
});

test("a failed sign-in start shows a message and keeps the person signed out", async () => {
  const { session, library } = build({ library: fakeLibrary({ signInError: new Error("blocked") }) });
  session.start();
  library.emit("INITIAL_SESSION", null);
  await session.signIn();
  assert.equal(session.getState().message, "account.signInFailed");
  assert.equal(session.getState().status, "signed-out");
});

test("sign-out ends only this device's session and removes only the accounts keys", async () => {
  const storage = fakeStorage({
    [ACCOUNTS_STORAGE_KEY]: "{}",
    [ACCOUNTS_STORAGE_KEY + "-code-verifier"]: "abc",
    "godwitly-course-language": "ar",
    "sb-ijpvbxglhxktnkabjdif-auth-token": "dashboard session",
  });
  const { session, library } = build({ storage });
  session.start();
  library.emit("INITIAL_SESSION", signedInAs({ full_name: "Mona" }));
  await session.signOut();
  assert.deepEqual(library.calls.signOut, [{ scope: "local" }]);
  assert.deepEqual(storage.names().sort(), ["godwitly-course-language", "sb-ijpvbxglhxktnkabjdif-auth-token"]);
  assert.deepEqual([session.getState().status, session.getState().name], ["signed-out", ""]);
});

test("sign-out still clears the page and the keys when the server can't be reached", async () => {
  const storage = fakeStorage({ [ACCOUNTS_STORAGE_KEY]: "{}" });
  const { session, library } = build({ storage, library: fakeLibrary({ signOutThrows: true }) });
  session.start();
  library.emit("INITIAL_SESSION", signedInAs({ full_name: "Mona" }));
  await session.signOut();
  assert.equal(session.getState().status, "signed-out");
  assert.deepEqual(storage.names(), []);
});

test("a sign-out the server refused clears this device but says it may not have reached the server", async () => {
  const storage = fakeStorage({ [ACCOUNTS_STORAGE_KEY]: "{}" });
  const { session, library } = build({ storage, library: fakeLibrary({ signOutError: new Error("500") }) });
  session.start();
  library.emit("INITIAL_SESSION", signedInAs({ full_name: "Mona" }));
  await session.signOut();
  assert.deepEqual([session.getState().status, session.getState().name], ["signed-out", ""]);
  assert.equal(session.getState().message, "account.signOutIncomplete");
  assert.deepEqual(storage.names(), []);
});

test("a sign-out the server accepted shows no warning", async () => {
  const { session, library } = build();
  session.start();
  library.emit("INITIAL_SESSION", signedInAs({ full_name: "Mona" }));
  await session.signOut();
  assert.equal(session.getState().message, "");
});

test("a completed sign-in is reported to the server once per page load, never inside the callback", async () => {
  const { session, library } = build();
  session.start();
  library.emit("SIGNED_IN", signedInAs({ full_name: "Mona" }));
  assert.deepEqual(library.calls.rpc, []);
  await new Promise((resolve) => setTimeout(resolve, 5));
  library.emit("SIGNED_IN", signedInAs({ full_name: "Mona" }));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(library.calls.rpc, ["record_sign_in"]);
});

test("a saved session, a refresh and a sign-out report nothing", async () => {
  const { session, library } = build();
  session.start();
  library.emit("INITIAL_SESSION", signedInAs({ full_name: "Mona" }));
  library.emit("TOKEN_REFRESHED", signedInAs({ full_name: "Mona" }));
  library.emit("SIGNED_OUT", null);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(library.calls.rpc, []);
});

test("a failing report never breaks the page", async () => {
  const library = fakeLibrary();
  const original = library.createClient;
  library.createClient = (...args) => {
    const client = original(...args);
    client.rpc = async () => {
      throw new Error("offline");
    };
    return client;
  };
  const { session } = build({ library });
  session.start();
  library.emit("SIGNED_IN", signedInAs({ full_name: "Mona" }));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(session.getState().status, "signed-in");
});

test("from a file, Auth never starts", () => {
  const { session, library } = build({ options: { protocol: "file:" } });
  session.start();
  assert.equal(session.getState().status, "unavailable-file");
  assert.equal(library.calls.created.length, 0);
});

test("without Web Locks, signed-in features stay off", () => {
  const { session, library } = build({ options: { hasLocks: false } });
  session.start();
  assert.equal(session.getState().status, "unavailable-locks");
  assert.equal(library.calls.created.length, 0);
});

test("when the library did not load, the page says so and nothing breaks", async () => {
  const { session } = build({ options: { createClient: undefined } });
  session.start();
  assert.equal(session.getState().status, "unavailable-script");
  await session.signIn();
  await session.signOut();
  assert.equal(session.getState().status, "unavailable-script");
});

test("listeners hear every change and can stop listening", () => {
  const { session, library } = build();
  const heard = [];
  const stop = session.subscribe((state) => heard.push(state.status));
  session.start();
  library.emit("INITIAL_SESSION", null);
  stop();
  library.emit("SIGNED_IN", signedInAs({ full_name: "Mona" }));
  assert.deepEqual(heard, ["signed-out"]);
});

test("an OAuth error is read from the query or the #hash, and a clean address gives none", () => {
  assert.equal(readOAuthError("?lang=en&error=access_denied", ""), "access_denied");
  assert.equal(readOAuthError("", "#error=server_error&error_code=x"), "server_error");
  assert.equal(readOAuthError("?lang=ar", ""), "");
});

test("OAuth details are removed from the address and the rest stays", () => {
  assert.equal(cleanOAuthAddress("http://x.test/crash-course/?lang=ar&code=abc&state=s1"), "/crash-course/?lang=ar");
  assert.equal(cleanOAuthAddress("http://x.test/a/?lang=en&error=access_denied&error_description=secret+detail"), "/a/?lang=en");
  assert.equal(cleanOAuthAddress("http://x.test/a/?lang=en#error=denied&error_code=x"), "/a/?lang=en");
  assert.equal(cleanOAuthAddress("http://x.test/a/?lang=en#lesson-1"), null);
  assert.equal(cleanOAuthAddress("http://x.test/a/?lang=en"), null);
});
