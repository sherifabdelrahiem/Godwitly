// Where Godwitly accounts may start (spec #56, ticket #58).
const test = require("node:test");
const assert = require("node:assert/strict");
const { accountsAllowedOn } = require("../js/accounts-hosts.js");

test("accounts start on the developer's own computer and on preview addresses", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]", "feat-t1.godwitly.pages.dev", "ABC123.Godwitly.Pages.Dev"]) {
    assert.equal(accountsAllowedOn(host), true, host);
  }
});

test("accounts never start on the production address or anywhere else", () => {
  for (const host of ["godwitly.pages.dev", "www.godwitly.pages.dev.evil.test", "evil-godwitly.pages.dev.test", "notgodwitly.pages.dev", "example.com", "", "localhost.evil.test"]) {
    assert.equal(accountsAllowedOn(host), false, host);
  }
});
