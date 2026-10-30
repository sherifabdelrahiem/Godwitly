/*
  The length rule for the optional Message, shared by the characters-left
  counter and the submit check in js/form.js. Keep it the same as the CHECK
  rule on launch_signups.message in supabase/migrations.

  Loaded as a plain script on the page, and by the tests in tests/ (Node).
*/
const MESSAGE_MAX_CHARACTERS = 1000;

// Spaces at the start and end don't count, as the form sends the Message
// trimmed. [...text] counts the way the database does: an emoji as 1, not 2.
function messageLength(text) {
  return [...text.trim()].length;
}

// Node (the tests) reads the exports; the browser ignores this line.
if (typeof module !== "undefined") module.exports = { MESSAGE_MAX_CHARACTERS, messageLength };
