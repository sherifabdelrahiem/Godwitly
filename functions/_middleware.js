// Cloudflare Pages Functions middleware: the gate for protected Lessons (spec #56, ADR-0010).
// _routes.json decides which requests reach it. The logic is in _lib/gate.mjs so that
// `node --test` can run it with fakes (tests/gate.test.js).
import { handleGate } from "./_lib/gate.mjs";

export async function onRequest(context) {
  return handleGate(context.request, context.env);
}
