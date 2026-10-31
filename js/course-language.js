/*
  Which language a Crash course page opens in, and what it remembers (spec #36, Seam 3).

  Course pages keep their own choice under their own name. They never read the
  site's "godwitly-language" value, which the landing page saves on every visit.

  Loaded as a plain script on the course pages, and by the tests in tests/ (Node).
*/
const COURSE_LANGUAGE_KEY = "godwitly-course-language";
const COURSE_LANGUAGES = ["en", "ar"];

// Only a relative address is a course page; anything with a scheme (https:, mailto:)
// or starting with "//" points elsewhere and is left alone.
const OUTSIDE_LINK = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

function createCourseLanguage({ search, storage }) {
  const fromAddress = new URLSearchParams(search).get("lang");
  let saved = null;
  try {
    saved = storage.getItem(COURSE_LANGUAGE_KEY);
  } catch (error) {
    /* storage not available: the address, or Arabic, decides */
  }
  let language = [fromAddress, saved].find((value) => COURSE_LANGUAGES.includes(value)) ?? "ar";

  return {
    current: () => language,
    link(href) {
      if (OUTSIDE_LINK.test(href)) return href;
      const [beforeHash, ...afterHash] = href.split("#");
      const [path, query = ""] = beforeHash.split("?");
      const params = new URLSearchParams(query);
      params.set("lang", language);
      const hash = afterHash.length ? "#" + afterHash.join("#") : "";
      return path + "?" + params.toString() + hash;
    },
    select(chosen) {
      if (!COURSE_LANGUAGES.includes(chosen)) return;
      language = chosen;
      try {
        storage.setItem(COURSE_LANGUAGE_KEY, chosen);
      } catch (error) {
        /* not saved: the page still changes language for this visit */
      }
    },
  };
}

// Node (the tests) reads the exports; the browser ignores this line.
if (typeof module !== "undefined") module.exports = { COURSE_LANGUAGE_KEY, createCourseLanguage };
