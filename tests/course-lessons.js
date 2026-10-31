/*
  The agreed Lesson list (spec #36): the one source the hub's cards (and later the
  Lesson pages' sidebar) must match. The course check in checks.js compares pages
  against it. Development only: the site never loads this file.

  released: true  = the Lesson has a page and its card is a link.
  released: false = shown as "قريبًا" and not a link.

  Staging (tickets #38-#46): every Lesson stays false until its own ticket adds the
  page and flips it. The Release 1 end state, in spec #36, is Lessons 1-5 released.
*/
const LESSONS = [
  { number: 1, titleKey: "course.lesson1.title", released: false, page: "lesson-1/index.html" },
  { number: 2, titleKey: "course.lesson2.title", released: false, page: "lesson-2/index.html" },
  { number: 3, titleKey: "course.lesson3.title", released: false, page: "lesson-3/index.html" },
  { number: 4, titleKey: "course.lesson4.title", released: false, page: "lesson-4/index.html" },
  { number: 5, titleKey: "course.lesson5.title", released: false, page: "lesson-5/index.html" },
  { number: 6, titleKey: "course.lesson6.title", released: false, page: "lesson-6/index.html" },
  { number: 7, titleKey: "course.lesson7.title", released: false, page: "lesson-7/index.html" },
  { number: 8, titleKey: "course.lesson8.title", released: false, page: "lesson-8/index.html" },
  { number: 9, titleKey: "course.lesson9.title", released: false, page: "lesson-9/index.html" },
];

module.exports = { LESSONS };
