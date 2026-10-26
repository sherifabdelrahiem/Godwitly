/*
  The "get notified" contact form.

    1. Read and tidy the answers
    2. Check them (the same rules the database uses)
    3. Send them to Supabase
    4. Show the result: field errors, "sending", success, or "try again"

  All the text comes from js/translations.js, so messages switch language
  together with the rest of the page.
*/

const form = document.getElementById("notify-form");
const successBox = document.querySelector(".form-success");
const submitButton = form.querySelector(".form-submit");
const submitLabel = form.querySelector(".form-submit__label");
const statusText = form.querySelector(".form-status__text");
const retryButton = form.querySelector(".form-retry");

// Each field, its error message and the input that shows it.
const FIELDS = {
  full_name: { input: "f-name", error: "f-name-error", message: "error.name" },
  email: { input: "f-email", error: "f-email-error", message: "error.email" },
  phone: { input: "f-phone", error: "f-phone-error", message: "error.phone" },
  job_title: { input: "f-job", error: "f-job-error", message: "error.jobTitle" },
  message: { input: "f-message", error: "f-message-error", message: "error.message" },
  consent: { input: "f-consent", error: "f-consent-error", message: "error.consent" },
};

// What the form is doing right now. render() draws the page from this.
let formState = {
  status: "idle", // "idle" | "sending" | "error" | "success"
  statusMessage: "", // translation key for the line under the button
  showRetry: false,
  fieldErrors: [], // names of fields with a problem
};

function t(key) {
  const language = document.documentElement.lang === "ar" ? "ar" : "en";
  return TRANSLATIONS[language][key] || key;
}

/* ---------- 1. Read and tidy the answers ---------- */

function readAnswers() {
  const value = (name) => form.elements[name].value;
  const tidy = (text) => text.trim().replace(/\s+/g, " "); // remove extra spaces
  const message = value("message").trim();
  return {
    full_name: tidy(value("full_name")),
    email: value("email").trim().toLowerCase(),
    phone: tidy(value("phone")),
    job_title: tidy(value("job_title")),
    message: message === "" ? null : message,
    language: document.documentElement.lang === "ar" ? "ar" : "en",
    consent: form.elements.consent.checked,
  };
}

/* ---------- 2. Check the answers ---------- */
// Keep these rules the same as the CHECK rules in supabase/migrations.

function findProblems(answers) {
  const problems = [];
  const lengthBetween = (text, min, max) => text.length >= min && text.length <= max;
  const phoneDigits = answers.phone.replace(/[^0-9]/g, "").length;

  if (!lengthBetween(answers.full_name, 2, 100)) problems.push("full_name");
  if (answers.email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(answers.email)) problems.push("email");
  if (!/^\+?[0-9 ()-]{7,20}$/.test(answers.phone) || phoneDigits < 7 || phoneDigits > 15) problems.push("phone");
  if (!lengthBetween(answers.job_title, 2, 100)) problems.push("job_title");
  if (answers.message !== null && answers.message.length > 1000) problems.push("message");
  if (!answers.consent) problems.push("consent");
  return problems;
}

/* ---------- 3. Send to Supabase ---------- */

async function sendToSupabase(answers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000); // give up after 15 seconds
  try {
    return await fetch(SUPABASE_URL + "/rest/v1/launch_signups", {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal", // don't send the row back (visitors can't read rows)
      },
      body: JSON.stringify(answers),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- 4. Show the result ---------- */

function render() {
  const sending = formState.status === "sending";

  // Success: swap the form for the thank-you box.
  form.hidden = formState.status === "success";
  successBox.hidden = formState.status !== "success";

  submitButton.disabled = sending;
  submitButton.setAttribute("aria-busy", String(sending));
  submitLabel.textContent = t(sending ? "form.sending" : "form.submit");

  statusText.textContent = formState.statusMessage ? t(formState.statusMessage) : "";
  statusText.parentElement.classList.toggle("is-error", formState.status === "error");
  retryButton.hidden = !formState.showRetry;

  Object.entries(FIELDS).forEach(([name, field]) => {
    const hasProblem = formState.fieldErrors.includes(name);
    const input = document.getElementById(field.input);
    const error = document.getElementById(field.error);
    input.setAttribute("aria-invalid", String(hasProblem));
    error.hidden = !hasProblem;
    error.textContent = hasProblem ? t(field.message) : "";
  });
}

function setFormState(changes) {
  formState = { ...formState, ...changes };
  render();
}

async function handleSubmit(event) {
  event.preventDefault();
  if (formState.status === "sending") return; // already sending: ignore extra clicks / Enter

  // Honeypot filled in → almost certainly a bot. Pretend it worked, send nothing.
  if (form.elements.website.value !== "") {
    setFormState({ status: "success", statusMessage: "", showRetry: false, fieldErrors: [] });
    return;
  }

  const answers = readAnswers();
  const problems = findProblems(answers);
  if (problems.length > 0) {
    setFormState({ status: "error", statusMessage: "form.checkFields", showRetry: false, fieldErrors: problems });
    document.getElementById(FIELDS[problems[0]].input).focus();
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    setFormState({ status: "error", statusMessage: "form.errorNotSetUp", showRetry: false, fieldErrors: [] });
    return;
  }

  // Set "sending" before waiting, so a second click is ignored straight away.
  setFormState({ status: "sending", statusMessage: "form.sending", showRetry: false, fieldErrors: [] });

  let response = null;
  try {
    response = await sendToSupabase(answers);
  } catch (error) {
    response = null; // offline, timed out or blocked
  }

  if (response && response.status === 201) {
    setFormState({ status: "success", statusMessage: "", showRetry: false });
    successBox.focus();
  } else if (response && response.status === 400) {
    // The database refused the answers. Its rules match findProblems(), so this is rare.
    setFormState({ status: "error", statusMessage: "form.checkFields", showRetry: false });
  } else {
    // Anything else: keep the answers and offer "Try again".
    setFormState({ status: "error", statusMessage: "form.errorNetwork", showRetry: true });
  }
}

form.addEventListener("submit", handleSubmit);
retryButton.addEventListener("click", () => form.requestSubmit());
document.addEventListener("godwitly:languagechange", render);
render();
