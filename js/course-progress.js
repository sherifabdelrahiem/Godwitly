/*
  Checklist progress for the Crash course (spec #36, ticket #41). Ticks stay in
  the browser's own storage: nothing here talks to a server.

  Ticks are kept per Lesson, against each checklist item's identifier (the
  data-item on the page), never its position or wording. Only the ticks are
  saved; the Lesson's items always come from the page that asks (the Lesson
  page, or the hub card's list of the same identifiers), so a changed checklist
  is never judged by an old copy.

  Loaded as a plain script on the course pages, and by the tests in tests/ (Node).
*/
const COURSE_PROGRESS_KEY_PREFIX = "godwitly-course-progress-";

function createCourseProgress(storage) {
  // The ticked identifiers a Lesson saved. A record that is missing, unreadable or has any
  // invalid part is damaged as a whole and reads as nothing ticked; nothing is salvaged from it.
  function read(lessonId) {
    try {
      const raw = storage.getItem(COURSE_PROGRESS_KEY_PREFIX + lessonId);
      if (raw === null) return [];
      const saved = JSON.parse(raw);
      const valid =
        saved !== null &&
        typeof saved === "object" &&
        Array.isArray(saved.ticked) &&
        saved.ticked.every((id) => typeof id === "string");
      return valid ? saved.ticked : [];
    } catch (error) {
      return [];
    }
  }

  // Failing to remember is not an error: the ticks still work for this visit.
  function write(lessonId, ticked) {
    try {
      storage.setItem(COURSE_PROGRESS_KEY_PREFIX + lessonId, JSON.stringify({ ticked }));
    } catch (error) {
      /* storage is full or blocked */
    }
  }

  const allTicked = (itemIds, ticked) => itemIds.length > 0 && itemIds.every((id) => ticked.includes(id));

  return {
    // The Lesson page's checklist. itemIds are the identifiers it has now.
    open(lessonId, itemIds) {
      // A tick for an item that is no longer on the page is dropped.
      const ticked = new Set(read(lessonId).filter((id) => itemIds.includes(id)));

      return {
        isTicked: (id) => ticked.has(id),
        set(id, value) {
          if (!itemIds.includes(id)) return;
          if (value) ticked.add(id);
          else ticked.delete(id);
          write(lessonId, [...ticked]);
        },
        isComplete: () => allTicked(itemIds, [...ticked]),
      };
    },

    // For the hub: complete when the Lesson's current items are not empty and all ticked.
    isLessonComplete: (lessonId, itemIds) => allTicked(itemIds, read(lessonId)),
  };
}

// Node (the tests) reads the exports; the browser ignores this line.
if (typeof module !== "undefined") module.exports = { createCourseProgress };
