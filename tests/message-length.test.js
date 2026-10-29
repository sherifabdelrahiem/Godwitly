// The Message's length, counted the way the launch_signups CHECK rule counts it (spec #28).
const test = require("node:test");
const assert = require("node:assert/strict");
const { MESSAGE_MAX_CHARACTERS, messageLength } = require("../js/message-length.js");

test("counts each character of an ordinary Message", () => {
  assert.equal(messageLength("Hello"), 5);
});

test("ignores spaces and line breaks at the start and end", () => {
  assert.equal(messageLength("  \n Hello there \n\n "), 11);
});

test("counts an empty Message, or one of only spaces, as 0", () => {
  assert.equal(messageLength(""), 0);
  assert.equal(messageLength("   \n  "), 0);
});

test("counts one emoji as 1, as the database does", () => {
  assert.equal(messageLength("Thanks 🙂"), 8);
});

test("counts a combined emoji, such as a flag, as the database does (2 for a flag)", () => {
  assert.equal(messageLength("🇪🇬"), 2);
});

test("counts Arabic text one per letter", () => {
  assert.equal(messageLength("مرحبا بكم"), 9);
});

test("allows exactly 1,000 characters and treats 1,001 as over the limit", () => {
  assert.equal(MESSAGE_MAX_CHARACTERS, 1000);
  assert.ok(messageLength("a".repeat(1000)) <= MESSAGE_MAX_CHARACTERS);
  assert.ok(messageLength("🙂".repeat(1000)) <= MESSAGE_MAX_CHARACTERS);
  assert.ok(messageLength("a".repeat(1001)) > MESSAGE_MAX_CHARACTERS);
});
