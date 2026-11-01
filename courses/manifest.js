/*
  The Crash course manifests (spec #56, "Crash course manifest"; ticket #57): one per Crash
  course, the single source of its Lessons and checklist items. The project checks compare
  the pages with them (tests/checks.js), and later a reviewed migration loads them into the
  accounts project.

  This folder is never in the deploy file list (deploy-files.txt), because a manifest holds
  more than is public. Only publicPart() below may reach the site or anonymous readers.

  A manifest is:
    id       the Crash course's id; never reused with a new meaning
    folder   where its pages live, from the project root
    test     true for a test Crash course: never public, never in the deploy file list
    lessons  in order, each with:
      number, titleKey (a key in js/translations.js; a test Crash course has its own text),
      summary (one public line, Arabic, ADR-0008), and the flags preview, required, released
      items  its "You're done when" checklist: { id, required }, plus retired: true for an
             item taken off the page. A retired id stays in the list and is never reused.
*/
const MANIFESTS = [
  { file: "courses/claude-beginners.js", manifest: require("./claude-beginners.js") },
  { file: "courses/test-course.js", manifest: require("./test-course.js") },
];

/*
  What the site and anonymous readers may see (spec #56): for a released Lesson, its number,
  title key, summary, the three flags and its current items' ids with their required flags;
  for a coming-soon Lesson, its number and title key only. Retired items and the items of
  unreleased Lessons are left out. A test Crash course has no public part (null).
*/
function publicPart(manifest) {
  if (manifest.test) return null;
  return {
    id: manifest.id,
    lessons: manifest.lessons.map((lesson) =>
      lesson.released
        ? {
            number: lesson.number,
            titleKey: lesson.titleKey,
            summary: lesson.summary,
            preview: lesson.preview,
            required: lesson.required,
            released: lesson.released,
            items: lesson.items.filter((item) => !item.retired).map(({ id, required }) => ({ id, required })),
          }
        : { number: lesson.number, titleKey: lesson.titleKey },
    ),
  };
}

module.exports = { MANIFESTS, publicPart };
