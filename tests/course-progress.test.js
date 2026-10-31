// The Crash course checklist progress (spec #36, seam 2), tested with a fake storage.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createCourseProgress } = require("../js/course-progress.js");

// A stand-in for localStorage that keeps its values in a Map.
function fakeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const ITEMS = ["a", "b", "c"];

test("an item can be ticked and unticked", () => {
  const checklist = createCourseProgress(fakeStorage()).open("lesson-1", ITEMS);
  assert.equal(checklist.isTicked("a"), false);
  checklist.set("a", true);
  assert.equal(checklist.isTicked("a"), true);
  checklist.set("a", false);
  assert.equal(checklist.isTicked("a"), false);
});

test("ticks are read back after a reload (a new module over the same storage)", () => {
  const storage = fakeStorage();
  createCourseProgress(storage).open("lesson-1", ITEMS).set("b", true);
  const again = createCourseProgress(storage).open("lesson-1", ITEMS);
  assert.equal(again.isTicked("b"), true);
  assert.equal(again.isTicked("a"), false);
});

test("two Lessons keep their ticks separately", () => {
  const storage = fakeStorage();
  const progress = createCourseProgress(storage);
  progress.open("lesson-1", ITEMS).set("a", true);
  assert.equal(progress.open("lesson-2", ITEMS).isTicked("a"), false);
});

test("a Lesson is complete only when every item is ticked", () => {
  const checklist = createCourseProgress(fakeStorage()).open("lesson-1", ITEMS);
  checklist.set("a", true);
  checklist.set("b", true);
  assert.equal(checklist.isComplete(), false);
  checklist.set("c", true);
  assert.equal(checklist.isComplete(), true);
  checklist.set("c", false);
  assert.equal(checklist.isComplete(), false);
});

test("an empty checklist is never complete", () => {
  const progress = createCourseProgress(fakeStorage());
  assert.equal(progress.open("lesson-1", []).isComplete(), false);
  assert.equal(progress.isLessonComplete("lesson-1", ITEMS), false);
});

test("the hub tells a Lesson is complete from the Lesson's current items and the saved ticks", () => {
  const storage = fakeStorage();
  const checklist = createCourseProgress(storage).open("lesson-1", ITEMS);
  ITEMS.forEach((id) => checklist.set(id, true));
  const hub = createCourseProgress(storage);
  assert.equal(hub.isLessonComplete("lesson-1", ITEMS), true);
  assert.equal(hub.isLessonComplete("lesson-2", ITEMS), false);
  checklist.set("a", false);
  assert.equal(createCourseProgress(storage).isLessonComplete("lesson-1", ITEMS), false);
});

test("ticks follow item identifiers when items are reordered", () => {
  const storage = fakeStorage();
  createCourseProgress(storage).open("lesson-1", ["a", "b", "c"]).set("b", true);
  const reordered = createCourseProgress(storage).open("lesson-1", ["c", "b", "a"]);
  assert.equal(reordered.isTicked("b"), true);
  assert.equal(reordered.isTicked("a"), false);
  assert.equal(reordered.isTicked("c"), false);
});

test("a tick for a removed item is ignored", () => {
  const storage = fakeStorage();
  const before = createCourseProgress(storage).open("lesson-1", ["a", "b", "gone"]);
  before.set("a", true);
  before.set("gone", true);
  const after = createCourseProgress(storage).open("lesson-1", ["a", "b"]);
  assert.equal(after.isTicked("gone"), false);
  assert.equal(after.isComplete(), false);
  after.set("b", true);
  assert.equal(after.isComplete(), true);
});

test("an item added after a Lesson was finished makes it incomplete, even on the hub before the Lesson is reopened", () => {
  const storage = fakeStorage();
  const old = createCourseProgress(storage).open("lesson-1", ["a", "b"]);
  old.set("a", true);
  old.set("b", true);
  assert.equal(createCourseProgress(storage).isLessonComplete("lesson-1", ["a", "b"]), true);
  // The hub is visited first, now knowing the updated checklist.
  assert.equal(createCourseProgress(storage).isLessonComplete("lesson-1", ["a", "b", "new"]), false);
  assert.equal(createCourseProgress(storage).open("lesson-1", ["a", "b", "new"]).isComplete(), false);
});

test("missing or damaged saved data reads as nothing ticked", () => {
  const key = "godwitly-course-progress-lesson-1";
  const damaged = ["not json", "null", "42", '"text"', "[]", '{"ticked":"a"}', '{"ticked":[1,null,{}]}', '{}', ""];
  for (const saved of damaged) {
    const progress = createCourseProgress(fakeStorage({ [key]: saved }));
    const checklist = progress.open("lesson-1", ITEMS);
    assert.deepEqual(ITEMS.filter((id) => checklist.isTicked(id)), [], `saved: ${saved}`);
    assert.equal(checklist.isComplete(), false);
    assert.equal(progress.isLessonComplete("lesson-1", ITEMS), false);
  }
});

test("a record with any invalid entry is rejected whole, not filtered", () => {
  const key = "godwitly-course-progress-lesson-1";
  const partly = ['{"ticked":["a",23]}', '{"ticked":["a",null,"b"]}', '{"ticked":["a",["b"]]}'];
  for (const saved of partly) {
    const progress = createCourseProgress(fakeStorage({ [key]: saved }));
    assert.equal(progress.open("lesson-1", ITEMS).isTicked("a"), false, `saved: ${saved}`);
    assert.equal(progress.isLessonComplete("lesson-1", ["a"]), false, `saved: ${saved}`);
  }
});

test("a rejected record is replaced by the next tick", () => {
  const storage = fakeStorage({ "godwitly-course-progress-lesson-1": '{"ticked":["a",23]}' });
  createCourseProgress(storage).open("lesson-1", ITEMS).set("b", true);
  const again = createCourseProgress(storage).open("lesson-1", ITEMS);
  assert.deepEqual(ITEMS.filter((id) => again.isTicked(id)), ["b"]);
});

test("a read that throws starts with nothing ticked", () => {
  const storage = { getItem: () => { throw new Error("blocked"); }, setItem: () => {} };
  const progress = createCourseProgress(storage);
  const checklist = progress.open("lesson-1", ITEMS);
  assert.equal(checklist.isTicked("a"), false);
  assert.equal(progress.isLessonComplete("lesson-1", ITEMS), false);
});

test("a write that throws still allows ticking and unticking during the visit", () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error("full"); } };
  const checklist = createCourseProgress(storage).open("lesson-1", ITEMS);
  ITEMS.forEach((id) => checklist.set(id, true));
  assert.equal(checklist.isComplete(), true);
  checklist.set("b", false);
  assert.equal(checklist.isTicked("b"), false);
  assert.equal(checklist.isComplete(), false);
});

test("opening a Lesson writes nothing when nothing was ticked", () => {
  const storage = fakeStorage();
  createCourseProgress(storage).open("lesson-1", ITEMS);
  assert.equal(storage.values.size, 0);
});
