/*
  The locked page (spec #56, "The gate"; ticket #59). The gate serves account/locked/index.html in
  place of a protected Lesson and adds its data (why, which Crash course and Lesson, the public
  summary) in a JSON block. This script shows the right part of the page and, for a signed-in
  person, the Enrol button. Loaded after js/course.js, which loads the sign-in (preview and local
  only until T10); the page's one sign-in is shared through window.godwitlyAccount.

  Nothing here holds Lesson content: the summary is a public manifest line, inserted as text.
*/
(function setUpLockedPage() {
  const dataElement = document.getElementById("gate-data");
  let data = null;
  try {
    data = dataElement ? JSON.parse(dataElement.textContent) : null;
  } catch (error) {
    data = null;
  }
  // Opened without the gate's data (for example straight from the file): show the Enrolment prompt.
  const reason = data && data.reason === "unavailable" ? "unavailable" : "locked";
  document.querySelectorAll("[data-locked-state]").forEach((part) => {
    part.hidden = part.dataset.lockedState !== reason;
  });

  const summary = document.querySelector("[data-locked-summary]");
  if (data && typeof data.summary === "string" && data.summary) {
    summary.textContent = data.summary;
    summary.hidden = false;
  }

  const message = document.querySelector("[data-locked-message]");
  function say(key) {
    if (!key) {
      message.hidden = true;
      delete message.dataset.i18n;
      message.textContent = "";
      return;
    }
    message.dataset.i18n = key;
    message.textContent = TRANSLATIONS[courseLanguage.current()][key];
    message.hidden = false;
  }

  document.querySelector("[data-locked-retry]").addEventListener("click", () => window.location.reload());

  const enrolBox = document.querySelector("[data-locked-enrol]");
  const enrolButton = document.querySelector("[data-locked-enrol-button]");

  function connect(account) {
    function show(state) {
      enrolBox.hidden = reason !== "locked" || state.status !== "signed-in";
    }
    account.subscribe(show);
    show(account.getState());

    enrolButton.addEventListener("click", async () => {
      if (!data || typeof data.course !== "string") return;
      enrolButton.disabled = true;
      say("locked.enrolling");
      const result = await account.enrol(data.course);
      if (result.ok) {
        say("locked.enrolled");
        window.location.reload();
      } else {
        say("locked.enrolFailed");
        enrolButton.disabled = false;
      }
    });
  }

  if (window.godwitlyAccount) connect(window.godwitlyAccount);
  else window.addEventListener("godwitly-account-ready", () => connect(window.godwitlyAccount), { once: true });
})();
