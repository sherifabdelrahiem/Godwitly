/*
  All the text on the page, in English ("en") and Arabic ("ar").

  How it works: in index.html, an element such as
      <span data-i18n="hero.line1">Learn Smarter.</span>
  gets its text from the "hero.line1" entry below, in the chosen language.

  To change any wording, edit it here. Keep the key (left side) the same
  in both languages, and only change the text in quotes.

  The brand name "Godwitly" and "BCM Hub" stay in Latin letters in Arabic,
  the same way the logo does.
*/
const TRANSLATIONS = {
  en: {
    "meta.title": "Godwitly — Learn, Engage, Prepare",
    "meta.description":
      "One platform that transforms learning, participation, and organisational preparedness through interactive digital experiences.",

    // Accessibility labels (read by screen readers, not shown on screen)
    "a11y.skip": "Skip to main content",
    "a11y.home": "Godwitly home",
    "a11y.mainNav": "Main",
    "a11y.language": "Choose language",
    "a11y.menuOpen": "Open menu",
    "a11y.menuClose": "Close menu",

    // Navigation
    "nav.products": "Products",
    "nav.why": "Why Godwitly",
    "nav.about": "About",

    // Hero
    "hero.line1": "Learn Smarter.",
    "hero.line2": "Engage Better.",
    "hero.line3": "Prepare Stronger.",
    "hero.intro":
      "One platform that transforms learning, participation, and organisational preparedness through interactive digital experiences.",
    "hero.explore": "Explore Our Solutions",
    "hero.devicesAlt":
      "Godwitly on desktop, laptop and phone: My Programmes, a live quiz and a crisis management exercise with a 3.32 maturity score",

    // Products section
    "products.eyebrow": "Our solutions",
    "products.title1": "Three products.",
    "products.title2": "A stronger tomorrow.",
    "products.intro":
      "Whether you're building knowledge, engaging people, or preparing for what's next, Godwitly helps you turn progress into real-world readiness.",
    "products.tablist": "Godwitly products",
    "products.from": "Godwitly",

    "engage.name": "Engage",
    "engage.blurb": "Turn training sessions, workshops and events into interactive experiences.",
    "engage.f1": "Live quizzes",
    "engage.f2": "Audience participation",
    "engage.f3": "Instant feedback",
    "engage.f4": "Leaderboards",
    "engage.alt": "A live quiz on a phone with participant count, countdown and podium cards",

    "learn.name": "Learn",
    "learn.blurb": "Support structured learning programmes with adaptive practice and assessment.",
    "learn.f1": "Learning tracks",
    "learn.f2": "Baseline assessment",
    "learn.f3": "Personalised practice",
    "learn.f4": "Final examinations",
    "learn.alt": "A learning programme on a desktop with a study plan at 75% on a phone",

    "resilience.name": "Resilience",
    "resilience.blurb": "Prepare teams for real-world disruptions through scenario-based tabletop exercises.",
    "resilience.f1": "Scenario simulation",
    "resilience.f2": "Team decision making",
    "resilience.f3": "Maturity assessment",
    "resilience.f4": "Reporting and insights",
    "resilience.alt":
      "A crisis management exercise on a laptop with an inject on a phone and a 3.32 maturity score",

    // Small "app" cards over the product pictures
    "cards.results": "Live results — Q3",
    "cards.a": "A",
    "cards.b": "B",
    "cards.c": "C",
    "cards.d": "D",
    "cards.readiness": "Readiness",
    "cards.next": "Next: 15-question practice",
    "cards.domain": "Domain 3",
    "cards.baseline": "Baseline",
    "cards.practice": "Practice",
    "cards.final": "Final exam",
    "cards.initials": "CM",
    "cards.team": "Crisis Management Team",
    "cards.lead": "Lead: Amina Haddad",
    "cards.submitted": "Answer submitted",

    // Why Godwitly
    "why.eyebrow": "Why Godwitly",
    "why.title1": "Built for progress.",
    "why.title2": "Designed for people.",
    "why.b1title": "Engaging experiences",
    "why.b1text": "Turn learning, training and exercises into meaningful participation.",
    "why.b2title": "Structured workflows",
    "why.b2text": "Proven processes from start to finish.",
    "why.b3title": "Measurable outcomes",
    "why.b3text": "Track progress, readiness and maturity.",
    "why.b4title": "Accessible everywhere",
    "why.b4text": "A seamless experience across desktop and mobile.",

    // Call to action
    "cta.title": "Ready to experience Godwitly?",
    "cta.text": "Discover a smarter way to learn, engage and prepare.",
    "cta.button": "Back to our solutions",

    // Footer
    "footer.text": "Godwitly by BCM Hub — learning, engagement and preparedness for resilient organisations.",
  },

  ar: {
    "meta.title": "Godwitly — تعلّم، تفاعل، استعدّ",
    "meta.description":
      "منصة واحدة تُحدث نقلة في التعلّم والمشاركة والجاهزية المؤسسية من خلال تجارب رقمية تفاعلية.",

    "a11y.skip": "انتقل إلى المحتوى الرئيسي",
    "a11y.home": "الصفحة الرئيسية لـ Godwitly",
    "a11y.mainNav": "القائمة الرئيسية",
    "a11y.language": "اختر اللغة",
    "a11y.menuOpen": "افتح القائمة",
    "a11y.menuClose": "أغلق القائمة",

    "nav.products": "المنتجات",
    "nav.why": "لماذا Godwitly؟",
    "nav.about": "نبذة عنّا",

    "hero.line1": "تعلّم بذكاء أكبر.",
    "hero.line2": "تفاعل بفاعلية أكبر.",
    "hero.line3": "استعدّ بقوة أكبر.",
    "hero.intro":
      "منصة واحدة تُحدث نقلة في التعلّم والمشاركة والجاهزية المؤسسية من خلال تجارب رقمية تفاعلية.",
    "hero.explore": "استكشف حلولنا",
    "hero.devicesAlt":
      "منصة Godwitly على حاسوب مكتبي وحاسوب محمول وهاتف: صفحة برامجي، واختبار مباشر، وتمرين لإدارة الأزمات بدرجة نضج 3.32",

    "products.eyebrow": "حلولنا",
    "products.title1": "ثلاثة منتجات.",
    "products.title2": "لغدٍ أقوى.",
    "products.intro":
      "سواء كنت تبني المعرفة، أو تُشرك الناس، أو تستعد لما هو قادم، تساعدك Godwitly على تحويل التقدّم إلى جاهزية حقيقية على أرض الواقع.",
    "products.tablist": "منتجات Godwitly",
    "products.from": "من Godwitly",

    "engage.name": "تفاعُل",
    "engage.blurb": "حوّل الجلسات التدريبية وورش العمل والفعاليات إلى تجارب تفاعلية.",
    "engage.f1": "اختبارات مباشرة",
    "engage.f2": "مشاركة الجمهور",
    "engage.f3": "ملاحظات فورية",
    "engage.f4": "لوحات المتصدّرين",
    "engage.alt": "اختبار مباشر على هاتف يعرض عدد المشاركين والعدّ التنازلي وبطاقات منصة التتويج",

    "learn.name": "تعلُّم",
    "learn.blurb": "ادعم برامج التعلّم المنظّمة بتدريب تكيّفي وتقييمات متكاملة.",
    "learn.f1": "مسارات تعليمية",
    "learn.f2": "تقييم مبدئي",
    "learn.f3": "تدريب مخصّص",
    "learn.f4": "اختبارات نهائية",
    "learn.alt": "برنامج تعليمي على حاسوب مكتبي، وخطة دراسة مكتملة بنسبة 75% على هاتف",

    "resilience.name": "مرونة",
    "resilience.blurb": "جهّز الفرق لمواجهة الاضطرابات الواقعية من خلال تمارين محاكاة قائمة على السيناريوهات.",
    "resilience.f1": "محاكاة السيناريوهات",
    "resilience.f2": "اتخاذ القرار الجماعي",
    "resilience.f3": "تقييم مستوى النضج",
    "resilience.f4": "التقارير والرؤى",
    "resilience.alt": "تمرين لإدارة الأزمات على حاسوب محمول، وحدث مستجد على هاتف، ودرجة نضج 3.32",

    "cards.results": "النتائج المباشرة — السؤال 3",
    "cards.a": "أ",
    "cards.b": "ب",
    "cards.c": "ج",
    "cards.d": "د",
    "cards.readiness": "الجاهزية",
    "cards.next": "التالي: تدريب من 15 سؤالًا",
    "cards.domain": "المجال 3",
    "cards.baseline": "التقييم المبدئي",
    "cards.practice": "التدريب",
    "cards.final": "الاختبار النهائي",
    "cards.initials": "إأ",
    "cards.team": "فريق إدارة الأزمات",
    "cards.lead": "القائدة: أمينة حداد",
    "cards.submitted": "تم إرسال الإجابة",

    "why.eyebrow": "لماذا Godwitly؟",
    "why.title1": "مبنية للتقدّم.",
    "why.title2": "مصمّمة للناس.",
    "why.b1title": "تجارب تفاعلية",
    "why.b1text": "حوّل التعلّم والتدريب والتمارين إلى مشاركة هادفة.",
    "why.b2title": "مسارات عمل منظّمة",
    "why.b2text": "عمليات مُجرّبة من البداية حتى النهاية.",
    "why.b3title": "نتائج قابلة للقياس",
    "why.b3text": "تابِع التقدّم والجاهزية ومستوى النضج.",
    "why.b4title": "متاحة في كل مكان",
    "why.b4text": "تجربة سلسة على أجهزة الحاسوب والهواتف المحمولة.",

    "cta.title": "هل أنت مستعد لتجربة Godwitly؟",
    "cta.text": "اكتشف طريقة أذكى للتعلّم والتفاعل والاستعداد.",
    "cta.button": "عُد إلى حلولنا",

    "footer.text": "Godwitly من BCM Hub — التعلّم والتفاعل والجاهزية لمؤسسات أكثر مرونة.",
  },
};
