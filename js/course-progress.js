/*
  Checklist progress for the Crash course (spec #36, ticket #41). Ticks stay in
  the browser's own storage: nothing here talks to a server.

  Ticks are kept per Lesson, against each checklist item's identifier (the
  data-item on the page), never its position or wording. Alongside the ticks a
  Lesson saves the identifiers of its checklist, so the hub can tell a Lesson is
  complete without loading the Lesson page.

  Loaded as a plain script on the course pages, and by the tests in tests/ (Node).
*/
const COURSE_PROGRESS_KEY_PREFIX = "godwitly.course.progress.";

// Keeps only the text entries of a saved list; anything else reads as an empty list.
function savedList(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

function createCourseProgress(storage) {
  // What a Lesson saved, or nothing when it is missing, damaged or storage can't be read.
  function read(lessonId) {
    try {
      const raw = storage.getItem(COURSE_PROGRESS_KEY_PREFIX + lessonId);
      if (raw === null) return null;
      const saved = JSON.parse(raw);
      if (saved === null || typeof saved !== "object" || Array.isArray(saved)) return null;
      return { ticked: savedList(saved.ticked), items: savedList(saved.items) };
    } catch (error) {
      return null;
    }
  }

  // Failing to remember is not an error: the ticks still work for this visit.
  function write(lessonId, record) {
    try {
      storage.setItem(COURSE_PROGRESS_KEY_PREFIX + lessonId, JSON.stringify(record));
    } catch (error) {
      /* storage is full or blocked */
    }
  }

  return {
    // The Lesson page's checklist. itemIds are the identifiers it has now.
    open(lessonId, itemIds) {
      const saved = read(lessonId);
      // A tick for an item that is no longer on the page is dropped.
      const ticked = new Set((saved ? saved.ticked : []).filter((id) => itemIds.includes(id)));
      const save = () => write(lessonId, { ticked: [...ticked], items: [...itemIds] });

      // Keep the hub's copy of the item list in step when the Lesson's checklist has changed.
      if (saved && saved.items.join("\n") !== itemIds.join("\n")) save();

      return {
        isTicked: (id) => ticked.has(id),
        set(id, value) {
          if (!itemIds.includes(id)) return;
          if (value) ticked.add(id);
          else ticked.delete(id);
          save();
        },
        isComplete: () => itemIds.length > 0 && itemIds.every((id) => ticked.has(id)),
      };
    },

    // For the hub: complete when the Lesson's saved checklist is not empty and fully ticked.
    isLessonComplete(lessonId) {
      const saved = read(lessonId);
      return saved !== null && saved.items.length > 0 && saved.items.every((id) => saved.ticked.includes(id));
    },
  };
}

// Node (the tests) reads the exports; the browser ignores this line.
if (typeof module !== "undefined") module.exports = { createCourseProgress };
