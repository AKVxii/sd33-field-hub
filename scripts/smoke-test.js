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
      "Meet the Candidates",
      "dev-banner",
      "Supported by this volunteer project",
      "mobile-sticky-cta",
      "primary-nav",
      "Volunteer Portal",
      "Volunteer-built district voter-information",
    ];
    for (const n of need) {
      if (!home.body.includes(n)) {
        console.log("FAIL home missing: " + n);
        failed += 1;
      } else {
        console.log("OK  home has: " + n);
      }
    }
    const banned = ["Independent organizing", "Independent volunteer resource", "independent expenditure", "Field / Captain Portal"];
    for (const b of banned) {
      if (home.body.toLowerCase().includes(b.toLowerCase())) {
        console.log("FAIL home still has: " + b);
        failed += 1;
      }
    }
    if (/Pulsar|Shift Board|Roadmap|Field Guide|Win SD/i.test(home.body) && /primary-nav[\s\S]{0,800}Pulsar/i.test(home.body)) {
      console.log("FAIL ops tools appear in primary nav block");
      failed += 1;
    } else {
      console.log("OK  no ops tools in primary public nav markers");
    }
  }

  // Dev mode should noindex
  if (home && home.body && !home.body.includes("noindex")) {
    console.log("WARN home missing noindex (expected in PRIVATE_DEVELOPMENT)");
  }

  // Volunteer two-step
  const vol = results.find((r) => r.path === "/volunteer");
  if (vol && vol.body) {
    if (!vol.body.includes("vol-step-1") || !vol.body.includes("vol-step-2")) {
      console.log("FAIL volunteer missing two-step markup");
      failed += 1;
    } else console.log("OK  volunteer two-step");
    if (!vol.body.includes("Choose My Volunteer Role")) {
      console.log("FAIL volunteer CTA label");
      failed += 1;
    } else {
      console.log("OK  volunteer CTA label");
    }
    if (/Major Issue|requestDbAccess|wantContribute/i.test(vol.body)) {
      console.log("FAIL volunteer step still has long form fields");
      failed += 1;
    } else console.log("OK  volunteer step-1 scope");
  }

  // Candidates filters
  const cand = results.find((r) => r.path === "/candidates");
  if (cand && cand.body) {
    if (!cand.body.includes("cand-q") || !cand.body.includes("cand-local") || !cand.body.includes("cand-district")) {
      console.log("FAIL candidates missing filters");
      failed += 1;
    } else console.log("OK  candidates filters");
    if (/badge pri">LEADING|LEADING</i.test(cand.body)) {
      console.log("FAIL candidates shows LEADING");
      failed += 1;
    } else console.log("OK  no LEADING badge on candidates");
  }

  const portal = results.find((r) => r.path === "/portal");
  if (portal && portal.body) {
    if (portal.body.includes('class="mobile-sticky-cta"')) {
      console.log("FAIL portal has mobile sticky bar");
      failed += 1;
    } else console.log("OK  portal hides mobile sticky bar");
    if (!portal.body.includes("Volunteer Portal")) {
      console.log("FAIL portal title");
      failed += 1;
    } else console.log("OK  portal title");
  }

  const facts = results.find((r) => r.path === "/district-facts");
  if (facts && facts.body) {
    if (!/presidential|Turnout|Methodology|Provisional research/i.test(facts.body)) {
      console.log("FAIL district-facts incomplete");
      failed += 1;
    } else console.log("OK  district-facts sections");
  }

  const events = results.find((r) => r.path === "/events");
  if (events && events.body) {
    if (!/confirmed|in-district|Venue pending/i.test(events.body)) {
      console.log("FAIL events status UX");
      failed += 1;
    } else console.log("OK  events status UX");
  }

  console.log(failed ? "\nFAILED: " + failed : "\nAll smoke checks passed.");
  process.exit(failed ? 1 : 0);
})();
