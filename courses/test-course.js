/*
  The test Crash course (spec #56, "Test Crash course"; ticket #57): dummy text only, used to
  prove the lock on the Pages preview branch. It is marked as a test, so it has no public part,
  and it must never be in the deploy file list (deploy-files.txt). Its title keys are not in
  js/translations.js; its own pages will carry their text.
*/
module.exports = {
  id: "test-course",
  folder: "test-course",
  test: true,
  lessons: [
    {
      number: 1,
      titleKey: "testcourse.lesson1.title",
      summary: "درس تجريبي مفتوح، نص للاختبار فقط.",
      preview: true,
      required: true,
      released: true,
      items: [
        { id: "test-open-one", required: true },
        { id: "test-open-two", required: false },
      ],
    },
    {
      number: 2,
      titleKey: "testcourse.lesson2.title",
      summary: "درس تجريبي يحتاج الالتحاق، نص للاختبار فقط.",
      preview: false,
      required: true,
      released: true,
      items: [{ id: "test-locked-one", required: true }],
    },
  ],
};
