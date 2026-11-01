/*
  The manifest of the Claude Crash Course for Beginners (spec #36 and spec #56; ticket #57).
  The rules for a manifest are in courses/manifest.js.

  Each summary is the Lesson's approved Arabic hub outcome (course.lessonN.outcome in
  js/translations.js), word for word. Every Lesson is Required (the PO, 2026-11-01); Lesson 1
  is the Preview Lesson. A Lesson stays released: false until its own ticket under spec #36
  adds its page and its checklist items. The Release 1 end state is Lessons 1-5 released.
*/
module.exports = {
  id: "claude-beginners",
  folder: "crash-course",
  test: false,
  lessons: [
    {
      number: 1,
      titleKey: "course.lesson1.title",
      summary: "تفهم يعني إيه Claude و Claude Code و Skills، وتعرف المصطلحات الأساسية.",
      preview: true,
      required: true,
      released: true,
      items: [
        { id: "explain-claude-help", required: true },
        { id: "chat-vs-code", required: true },
        { id: "plan-mode", required: true },
        { id: "skill-example", required: true },
      ],
    },
    {
      number: 2,
      titleKey: "course.lesson2.title",
      summary: "يبقى عندك حساب Claude Pro وتطبيق Claude Desktop، وتعرف تكلّمه كويس.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 3,
      titleKey: "course.lesson3.title",
      summary: "تفتح مجلد، وتستخدم Plan mode، وتقرا قبل ما توافق.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 4,
      titleKey: "course.lesson4.title",
      summary: "تبني صفحة لبيزنس وتحسّن تصميمها.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 5,
      titleKey: "course.lesson5.title",
      summary: "تحفظ شغلك على GitHub بـ git.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 6,
      titleKey: "course.lesson6.title",
      summary: "تكتب ملف قواعد المشروع وspec يقدر كلود يبني منه.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 7,
      titleKey: "course.lesson7.title",
      summary: "تشغّل الباك إند بتاعك على Railway.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 8,
      titleKey: "course.lesson8.title",
      summary: "تضيف لوحة تحكم بتسجيل دخول وتنبيهات بالإيميل.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
    {
      number: 9,
      titleKey: "course.lesson9.title",
      summary: "تتأكد بالدليل إن الشغل خلص فعلًا.",
      preview: false,
      required: true,
      released: false,
      items: [],
    },
  ],
};
