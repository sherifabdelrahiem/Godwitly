/*
  Starts Godwitly accounts on a Crash course page (spec #56, ticket #58).

  This is the only account-related script the pages name. Where it is not deployed
  (production, until T10) nothing account-related loads: no library from a CDN, no sign-in,
  and the account bar stays hidden. Where it is deployed it loads, one after another:
  the pinned supabase-js (with its SRI hash, the same file as dashboard.html), the accounts
  settings, the sign-in module and the account bar.

  Course pages are at crash-course/ and crash-course/lesson-N/, so the other scripts are found
  next to this one.
*/
(function bootAccounts() {
  const base = document.currentScript.src.replace(/accounts-boot\.js(\?.*)?$/, "");
  const steps = [
    {
      src: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js",
      integrity: "sha384-BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R",
      optional: true, // if the CDN is down the bar still starts and says sign-in is unavailable
    },
    { src: base + "accounts-config.js" },
    { src: base + "accounts.js" },
    { src: base + "account-bar.js" },
  ];

  function load(index) {
    if (index >= steps.length) return;
    const step = steps[index];
    const script = document.createElement("script");
    script.src = step.src;
    if (step.integrity) {
      script.integrity = step.integrity;
      script.crossOrigin = "anonymous";
    }
    script.onload = () => load(index + 1);
    script.onerror = () => {
      if (step.optional) load(index + 1);
    };
    document.head.append(script);
  }

  load(0);
})();
