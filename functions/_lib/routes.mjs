// Which pages the gate guards (spec #56, "The gate": path mapping). This table holds no Lesson
// text, only public manifest fields. A project check compares it with courses/*.js and with
// _routes.json (tests/checks.js).
//   folder          where the Crash course's pages live
//   gateFolder      true: the whole folder goes through the gate (a test Crash course);
//                   false: only the protected Lessons' folders do (the public hub, the privacy page
//                   and Preview Lessons are static files)
//   lessons         number, preview (open to everyone), released, and for a released Lesson that
//                   needs Enrolment its public summary (Arabic, ADR-0008)
export const COURSES = [
  {
    id: "claude-beginners",
    folder: "crash-course",
    gateFolder: false,
    lessons: [
      { number: 1, preview: true, released: true },
      { number: 2, preview: false, released: false },
      { number: 3, preview: false, released: false },
      { number: 4, preview: false, released: false },
      { number: 5, preview: false, released: false },
      { number: 6, preview: false, released: false },
      { number: 7, preview: false, released: false },
      { number: 8, preview: false, released: false },
      { number: 9, preview: false, released: false },
    ],
  },
  {
    id: "test-course",
    folder: "test-course",
    gateFolder: true,
    lessons: [
      { number: 1, preview: true, released: true },
      { number: 2, preview: false, released: true, summary: "درس تجريبي يحتاج الالتحاق، نص للاختبار فقط." },
    ],
  },
];
