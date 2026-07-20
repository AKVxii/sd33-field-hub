/**
 * Smoke tests for St. Croix Valley Field Hub public routes.
 * Run: node scripts/smoke-test.js
 * Requires the server on PORT (default 3050) or starts checks against BASE_URL.
 */
const http = require("http");

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3050").replace(/\/$/, "");
const PATHS = [
  "/",
  "/my-gop-ballot",
  "/candidates",
  "/events",
  "/events?view=confirmed",
  "/events?view=proposed",
  "/volunteer",
  "/map",
  "/district-facts",
  "/about",
  "/sources",
  "/corrections",
  "/portal",
  "/legal",
  "/privacy",
  "/accessibility",
  "/es",
  "/review",
  "/share",
  "/css/design-system.css",
  "/js/site-shell.js",
  "/js/analytics.js",
  "/api/health",
  "/api/events.json",
];

function get(path) {
  return new Promise((resolve) => {
    const url = BASE + path;
    const req = http.get(url, { timeout: 12000 }, (res) => {
      let body = "";
      res.on("data", (c) => {
        body += c;
        if (body.length > 200000) body = body.slice(0, 200000);
      });
      res.on("end", () => resolve({ path, status: res.statusCode, body, headers: res.headers }));
    });
    req.on("error", (err) => resolve({ path, status: 0, error: err.message, body: "" }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ path, status: 0, error: "timeout", body: "" });
    });
  });
}

(async () => {
  let failed = 0;
  const results = [];
  for (const p of PATHS) {
    const r = await get(p);
    const ok = r.status >= 200 && r.status < 400;
    if (!ok) failed += 1;
    results.push(r);
    console.log((ok ? "OK " : "FAIL") + " " + r.status + " " + p + (r.error ? " " + r.error : ""));
  }

  // Content checks on home
  const home = results.find((r) => r.path === "/");
  if (home && home.body) {
    const need = [
      "Know Your District",
      "Find My Ballot",
      "dev-banner",
      "Supported by this volunteer project",
      "mobile-sticky-cta",
      "primary-nav",
    ];
    for (const n of need) {
      if (!home.body.includes(n)) {
        console.log("FAIL home missing: " + n);
        failed += 1;
      } else {
        console.log("OK  home has: " + n);
      }
    }
  }

  // Dev mode should noindex
  if (home && home.body && !home.body.includes("noindex")) {
    console.log("WARN home missing noindex (expected in PRIVATE_DEVELOPMENT)");
  }

  // Volunteer should not precheck connectVolunteers / wantBundlePack
  const vol = results.find((r) => r.path === "/volunteer");
  if (vol && vol.body) {
    if (/name="wantBundlePack"[^>]*checked/.test(vol.body) || /name="connectVolunteers"[^>]*checked/.test(vol.body)) {
      console.log("FAIL volunteer has pre-checked optional consent");
      failed += 1;
    } else {
      console.log("OK  volunteer no pre-checked optional packs");
    }
    if (!vol.body.includes("Choose My Volunteer Role")) {
      console.log("FAIL volunteer CTA label");
      failed += 1;
    } else {
      console.log("OK  volunteer CTA label");
    }
  }

  // Candidates filters
  const cand = results.find((r) => r.path === "/candidates");
  if (cand && cand.body) {
    if (!cand.body.includes("cand-q") || !cand.body.includes("filter-bar")) {
      console.log("FAIL candidates missing filters");
      failed += 1;
    } else console.log("OK  candidates filters");
  }

  console.log(failed ? "\nFAILED: " + failed : "\nAll smoke checks passed.");
  process.exit(failed ? 1 : 0);
})();
