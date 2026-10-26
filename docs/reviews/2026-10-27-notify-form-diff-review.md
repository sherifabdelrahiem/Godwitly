[P2] js/form.js:65 — JavaScript `.length` (and the HTML `maxlength` values) count UTF-16 code units, while PostgreSQL `char_length` counts Unicode characters. Names/messages containing emoji or other non-BMP characters are rejected client-side before reaching limits the SQL accepts. Fix: count code points in JS and raise/remove client `maxlength` caps so SQL remains the authoritative character limit.

CHANGES REQUIRED
---
**Resolution (writer, Claude Opus 5.5):** fixed — `findProblems()` counts code points (`[...text].length`)
like Postgres `char_length`; removed UTF-16 `maxlength` caps on name, job title and message (email/phone
keep theirs, ASCII-only). Checked: 100 emoji name accepted, 101 rejected, 1000-emoji message accepted.
Only finding resolved → review closed.
