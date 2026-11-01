// The public part of a Crash course manifest (spec #56, "Crash course manifest"; ticket #57).
const test = require("node:test");
const assert = require("node:assert/strict");
const { publicPart } = require("../courses/manifest.js");

const MANIFEST = {
  id: "example",
  folder: "example-course",
  test: false,
  lessons: [
    {
      number: 1,
      titleKey: "course.lesson1.title",
      summary: "ملخص الدرس الأول",
      preview: true,
      required: true,
      released: true,
      items: [
        { id: "first", required: true },
        { id: "gone", required: true, retired: true },
        { id: "extra", required: false },
      ],
    },
    {
      number: 2,
      titleKey: "course.lesson2.title",
      summary: "ملخص الدرس الثاني",
      preview: false,
      required: true,
      released: false,
      items: [{ id: "secret-plan", required: true }],
    },
  ],
};

test("public part: a released Lesson keeps its public fields and current items only", () => {
  assert.deepEqual(publicPart(MANIFEST).lessons[0], {
    number: 1,
    titleKey: "course.lesson1.title",
    summary: "ملخص الدرس الأول",
    preview: true,
    required: true,
    released: true,
    items: [
      { id: "first", required: true },
      { id: "extra", required: false },
    ],
  });
});

test("public part: a coming-soon Lesson shows only its number and title key", () => {
  assert.deepEqual(publicPart(MANIFEST).lessons[1], { number: 2, titleKey: "course.lesson2.title" });
});

test("public part: the Crash course shows only its id, not its folder or test marking", () => {
  assert.deepEqual(Object.keys(publicPart(MANIFEST)), ["id", "lessons"]);
  assert.equal(publicPart(MANIFEST).id, "example");
});

test("public part: a test Crash course has none", () => {
  assert.equal(publicPart({ ...MANIFEST, test: true }), null);
});

test("public part: changing the result leaves the manifest as it was", () => {
  const part = publicPart(MANIFEST);
  part.lessons[0].items.push({ id: "added", required: true });
  assert.equal(MANIFEST.lessons[0].items.length, 3);
});
