const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const os = require("os");
const morgan = require("morgan");

const PORT = Number(process.env.PORT || 3050);
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const IS_PROD = process.env.NODE_ENV === "production" || !!PUBLIC_URL;

/** LAN IPs phones can use (not localhost) */
function lanIps() {
  const ips = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets || {})) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}
function phoneShareBase(req) {
  // Permanent deploy URL wins
  if (PUBLIC_URL) return PUBLIC_URL;
  // Prefer the host the visitor already used (LAN IP, tunnel, or custom domain)
  const host = req.get("host");
  if (host && !host.includes("localhost") && !host.startsWith("127.")) {
    const proto = req.protocol || (IS_PROD ? "https" : "http");
    return `${proto}://${host}`;
  }
  const ips = lanIps();
  if (ips.length) return `http://${ips[0]}:${PORT}`;
  return `http://localhost:${PORT}`;
}
function phoneLinksBox(req) {
  const ips = lanIps();
  const phoneBase = phoneShareBase(req);
  const localBase = `http://localhost:${PORT}`;
  const ipLines = ips.length
    ? ips
        .map(
          (ip) =>
            `<li><strong>Phone (same Wi‑Fi):</strong>
              <input class="share-input" readonly value="http://${esc(ip)}:${PORT}/review" onclick="this.select()" />
              <button type="button" class="btn btn-gold" onclick="navigator.clipboard.writeText('http://${esc(ip)}:${PORT}/review');this.textContent='Copied!';">Copy for phone</button>
            </li>`
        )
        .join("")
    : "<li>Could not detect Wi‑Fi IP — run <code>ipconfig</code> and use your IPv4 address.</li>";

  return `
    <div class="card" style="margin-bottom:1rem;border:2px solid var(--gold);background:#fffbeb">
      <h3 style="margin-top:0">Why email “didn’t work” on your phone</h3>
      <p><code>localhost</code> / <code>127.0.0.1</code> only opens on <strong>this computer</strong>. Your phone needs your PC’s <strong>Wi‑Fi address</strong>.</p>
      <ol>
        <li>Phone and PC on the <strong>same Wi‑Fi</strong></li>
        <li>This site must be <strong>running</strong> on the PC</li>
        <li>Windows Firewall may ask to allow Node — click <strong>Allow</strong> (or allow port ${PORT})</li>
        <li>Email yourself the <strong>Phone</strong> link below — not localhost</li>
      </ol>
      <ul class="list" style="list-style:none;padding:0">${ipLines}
        <li class="muted" style="margin-top:0.75rem">On this PC only: <a href="${esc(localBase)}/review">${esc(localBase)}/review</a></li>
        <li class="muted">Best base right now: <code>${esc(phoneBase)}</code></li>
      </ul>
      <p class="muted">Away from home Wi‑Fi? You need public hosting or a tunnel (ngrok / Cloudflare Tunnel) — localhost and LAN IPs won’t reach your phone on cellular data.</p>
    </div>`;
}
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const CAND_FILE = path.join(DATA, "candidates.json");
const SIGNUPS = path.join(DATA, "lit_signups.json");
const STATS = path.join(DATA, "drop_logs.json");
const CONTACTS_FILE = path.join(DATA, "contacts.json");
const THOROUGH_FILE = path.join(DATA, "thoroughfares.json");
const POLLS_FILE = path.join(DATA, "polling_places.json");
const SIGNS_FILE = path.join(DATA, "sign_locations.json");
const FIELD_LOG = path.join(DATA, "field_activity.json");
const GEO_FILE = path.join(DATA, "geo_lookup.json");
const PREFS_FILE = path.join(DATA, "candidate_prefs.json");
const FEEDBACK_FILE = path.join(DATA, "feedback.json");
const SIGN_ASKS_FILE = path.join(DATA, "sign_asks.json");
const EVENTS_FILE = path.join(DATA, "events.json");
const SCHEDULE_FILE = path.join(DATA, "schedule.json");
const ROADMAP_FILE = path.join(DATA, "roadmap.json");
const DISTRICTS_GEO_FILE = path.join(DATA, "districts_geo.json");
const PRECINCTS_FILE = path.join(DATA, "sd33_precincts.json");
const VOL_SIGNUPS_FILE = path.join(DATA, "volunteer_signups.json");
const EVENT_IDEAS_FILE = path.join(DATA, "event_ideas.json");
const PULSAR_FILE = path.join(DATA, "pulsar_requests.json");
if (!fs.existsSync(VOL_SIGNUPS_FILE)) fs.writeFileSync(VOL_SIGNUPS_FILE, "[]");
if (!fs.existsSync(EVENT_IDEAS_FILE)) fs.writeFileSync(EVENT_IDEAS_FILE, "[]");
if (!fs.existsSync(PULSAR_FILE)) fs.writeFileSync(PULSAR_FILE, "[]");
if (!fs.existsSync(SCHEDULE_FILE)) {
  fs.writeFileSync(
    SCHEDULE_FILE,
    JSON.stringify({ shifts: [] }, null, 2)
  );
}

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(SIGNUPS)) fs.writeFileSync(SIGNUPS, "[]");
if (!fs.existsSync(STATS)) fs.writeFileSync(STATS, "[]");
if (!fs.existsSync(FIELD_LOG)) fs.writeFileSync(FIELD_LOG, "[]");
if (!fs.existsSync(PREFS_FILE)) fs.writeFileSync(PREFS_FILE, "[]");
if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, "[]");
if (!fs.existsSync(SIGN_ASKS_FILE)) fs.writeFileSync(SIGN_ASKS_FILE, "[]");

/** Busy-street script + form: sign location, person spoken to, contact */
function signAskCalloutAndForm(opts = {}) {
  const redirect = opts.redirect || "/field/doors";
  const prefStreet = opts.street || "";
  const prefCity = opts.city || "";
  const thorough = (() => {
    try {
      return loadJson(THOROUGH_FILE);
    } catch {
      return { corridors: [] };
    }
  })();
  const corridorOpts = (thorough.corridors || [])
    .map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
    .join("");

  return `
    <div class="card sign-ask-callout" style="margin:1rem 0;border:2px solid var(--gop);background:#fff8f8">
      <h3 style="margin-top:0;color:var(--gop)">Busy street rule</h3>
      <p style="font-size:1.05rem;margin:0.4rem 0"><strong>If you are on a busy street</strong> (Hwy 36, Hwy 95, Manning Ave, CR 96, Forest Lake arterials, poll approaches) and the person is <strong>interested in a candidate</strong>:</p>
      <p style="font-size:1.1rem;font-weight:700;margin:0.5rem 0">→ Ask for a yard sign location!</p>
      <p class="muted" style="margin:0">Private property only. Get permission. Log the sign location, who you spoke to, and their contact below.</p>
    </div>
    <div class="card stack" style="margin-bottom:1rem">
      <h3>Log a sign ask / placement</h3>
      <form method="post" action="/field/sign-ask" class="stack">
        <input type="hidden" name="redirect" value="${esc(redirect)}" />
        <label>Volunteer name</label>
        <input type="text" name="volunteer" required maxlength="100" placeholder="Your name" />
        <label>On a busy street?</label>
        <select name="onBusyStreet" required>
          <option value="yes" selected>Yes — busy street / major thoroughfare</option>
          <option value="no">No — side street / neighborhood</option>
        </select>
        <label>Busy corridor (if known)</label>
        <select name="corridor">
          <option value="">Select…</option>
          ${corridorOpts}
          <option value="near_poll">Near polling place</option>
          <option value="other">Other</option>
        </select>
        <label>Interested in candidate?</label>
        <select name="interested" required>
          <option value="yes">Yes — interested (ask for sign!)</option>
          <option value="maybe">Maybe / leaning</option>
          <option value="no">No / not interested</option>
        </select>
        <label>Asked for sign location?</label>
        <select name="askedForSign" required>
          <option value="yes">Yes — I asked</option>
          <option value="yes_got">Yes — and they said YES to a sign</option>
          <option value="yes_no">Yes — they declined a sign</option>
          <option value="no">Not yet / not appropriate</option>
        </select>
        <label>Sign location (address / yard description)</label>
        <input type="text" name="signLocation" maxlength="200" value="${esc(prefStreet)}" placeholder="e.g. 1234 Manning Ave N — front yard facing road" />
        <label>City</label>
        <input type="text" name="city" maxlength="80" value="${esc(prefCity)}" placeholder="Stillwater, Forest Lake…" />
        <label>Person spoken to (name)</label>
        <input type="text" name="personSpokenTo" required maxlength="120" placeholder="Name of homeowner / person at door" />
        <label>Contact (phone or email)</label>
        <input type="text" name="contact" maxlength="160" placeholder="Phone or email for follow-up / sign delivery" />
        <label>Which candidate(s) interested in</label>
        <input type="text" name="candidates" maxlength="200" placeholder="e.g. Housley, Demuth, full GOP package" />
        <label>House district</label>
        <select name="houseDistrict">
          <option value="">Unknown</option>
          <option value="33A">33A</option>
          <option value="33B">33B</option>
        </select>
        <label>Notes</label>
        <textarea name="notes" rows="2" maxlength="500" placeholder="Gate code, best time to place sign, needs 2 signs…"></textarea>
        <div class="row-actions">
          <button class="btn" type="submit">Save sign location &amp; contact</button>
        </div>
      </form>
    </div>`;
}

function loadCandidates() {
  return JSON.parse(fs.readFileSync(CAND_FILE, "utf8"));
}
/** Full district community lists — equal billing, no hometown spin */
function districtAreas(key) {
  const d = loadCandidates().districtAreas || {};
  return d[key] || { label: key, areas: [], note: "" };
}
function formatAreaList(key, sep = "; ") {
  const d = districtAreas(key);
  return (d.areas || []).join(sep);
}
function areaListHtml(key) {
  const d = districtAreas(key);
  const items = (d.areas || []).map((a) => `<li>${esc(a)}</li>`).join("");
  return `<div class="district-areas">
    <p class="muted" style="margin:0 0 0.4rem"><strong>${esc(d.label || "")}</strong> — all communities and precincts (equal listing; candidates serve the full district):</p>
    <ul class="area-grid">${items}</ul>
    ${d.note ? `<p class="muted" style="margin:0.4rem 0 0;font-size:0.88rem">${esc(d.note)}</p>` : ""}
  </div>`;
}
function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function loadContacts() {
  return loadJson(CONTACTS_FILE);
}
function partyClass(p) {
  const x = String(p || "UNK").toUpperCase();
  if (x === "GOP" || x === "R" || x === "REPUBLICAN") return "GOP";
  if (x === "DFL" || x === "D" || x === "DEMOCRATIC") return "DFL";
  if (x === "NP" || x === "I" || x === "IND") return "NP";
  return "UNK";
}
function filterContacts(list, q) {
  let rows = list.slice();
  if (q.hd) rows = rows.filter((c) => String(c.houseDistrict) === q.hd);
  if (q.party) rows = rows.filter((c) => partyClass(c.partyAffiliation) === q.party);
  if (q.corridor) rows = rows.filter((c) => c.streetCorridor === q.corridor);
  if (q.pollOnly === "1") rows = rows.filter((c) => c.nearPollingPlace);
  if (q.q) {
    const s = q.q.toLowerCase();
    rows = rows.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(s) ||
        (c.address || "").toLowerCase().includes(s) ||
        (c.city || "").toLowerCase().includes(s)
    );
  }
  rows.sort(
    (a, b) =>
      (Number(b.doorPriority) || 0) - (Number(a.doorPriority) || 0) ||
      (a.address || "").localeCompare(b.address || "")
  );
  return rows;
}
/** Resolve address text → districts for GOP ballot lookup */
function normalizeCity(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const KNOWN_CITY_ALIASES = [
  ["oak park heights", "oak park heights"],
  ["marine on st croix", "marine on st croix"],
  ["marine on st. croix", "marine on st croix"],
  ["stillwater township", "stillwater township"],
  ["may township", "may township"],
  ["forest lake", "forest lake"],
  ["stillwater", "stillwater"],
  ["bayport", "bayport"],
  ["scandia", "scandia"],
  ["mahtomedi", "mahtomedi"],
  ["dellwood", "dellwood"],
  ["willernie", "willernie"],
  ["hugo", "hugo"],
  ["grant", "grant"],
  ["lake elmo", "lake elmo"],
];

function detectCityInText(text) {
  const low = normalizeCity(text);
  if (!low) return "";
  for (const [alias, canon] of KNOWN_CITY_ALIASES) {
    if (low.includes(alias)) return canon;
  }
  return "";
}

function resolveAddress(input) {
  const geo = loadJson(GEO_FILE);
  let street = String(input.street || input.address || "").trim();
  let cityRaw = String(input.city || "").trim();
  let zip = String(input.zip || "").trim().slice(0, 5);
  const freeform = String(input.q || input.fullAddress || "").trim();

  // Merge freeform into parse when street/city incomplete
  const blob = [street, freeform, cityRaw, zip].filter(Boolean).join(" ");
  let city = cityRaw;
  let streetUse = street || freeform;
  let zipUse = zip;

  const zipM = blob.match(/\b(55\d{3})\b/);
  if (!zipUse && zipM) zipUse = zipM[1];

  // Parse "123 Beach Drive, Forest Lake, MN 55025" from street or q
  const parseSource = freeform || street;
  if (parseSource.includes(",")) {
    const parts = parseSource.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 1 && !street) streetUse = parts[0];
    if (parts.length >= 1 && street && parts[0].length < street.length) {
      // street field may be full line
      const first = parts[0];
      if (/^\d/.test(first)) streetUse = first;
    }
    if (!city && parts.length >= 2) {
      city = parts[1].replace(/\bMN\b/i, "").replace(/\d{5}.*/, "").trim();
    }
    if (parts.length >= 3 && !city) {
      city = parts[parts.length - 2].replace(/\bMN\b/i, "").replace(/\d{5}.*/, "").trim();
    }
  }

  // Detect city name anywhere in the text (e.g. only street="1731 Beach Drive" + city select Forest Lake)
  if (!city) {
    const found = detectCityInText(blob);
    if (found) city = found;
  }

  // Street-only: apply streetHints that carry a city default (Beach Drive → Forest Lake)
  const streetLow = (streetUse + " " + freeform + " " + city).toLowerCase();
  let hintMatch = null;
  if (geo.streetHints) {
    // Prefer longer hints first
    const hints = Object.entries(geo.streetHints).sort((a, b) => b[0].length - a[0].length);
    for (const [hint, v] of hints) {
      if (streetLow.includes(hint)) {
        hintMatch = { ...v, from: "street", hint };
        break;
      }
    }
  }
  if (!city && hintMatch && hintMatch.city) {
    city = hintMatch.city;
  }

  const cityKey = normalizeCity(city);
  const result = {
    street: streetUse,
    city: city || "",
    zip: zipUse || "",
    house: null,
    senate: "33",
    usHouse: [],
    confidence: "low",
    notes: [],
    inSd33: true,
  };

  let matched = null;
  if (zipUse && geo.zips[zipUse]) {
    matched = { ...geo.zips[zipUse], from: "zip" };
  }
  if (cityKey && geo.cities[cityKey]) {
    const c = geo.cities[cityKey];
    matched = matched
      ? {
          house: c.house === "BOTH" || matched.house === "BOTH" ? "BOTH" : c.house || matched.house,
          senate: c.senate || matched.senate,
          usHouse: c.usHouse || matched.usHouse,
          confidence: c.confidence || matched.confidence,
          note: c.note || matched.note,
          from: "city+zip",
        }
      : { ...c, from: "city" };
  }
  // fuzzy city contains
  if (!matched && cityKey) {
    for (const [k, v] of Object.entries(geo.cities)) {
      if (cityKey.includes(k) || k.includes(cityKey)) {
        matched = { ...v, from: "city-fuzzy" };
        break;
      }
    }
  }

  // Street hints refine / fill match (street-level beats city BOTH when specific)
  if (hintMatch) {
    if (!matched) {
      matched = {
        house: hintMatch.house || "BOTH",
        senate: "33",
        usHouse: hintMatch.usHouse || ["8"],
        confidence: hintMatch.confidence || "medium",
        note: hintMatch.note,
        from: "street",
        precinct: hintMatch.precinct,
        judicial: hintMatch.judicial,
        school: hintMatch.school,
        county: hintMatch.county,
        countyCommissioner: hintMatch.countyCommissioner,
        soilWater: hintMatch.soilWater,
      };
    } else {
      if (hintMatch.house && hintMatch.house !== "BOTH") {
        matched.house = hintMatch.house;
        matched.confidence = hintMatch.confidence || "high";
        matched.from = "street+city";
      } else if (hintMatch.house === "BOTH") {
        matched.house = "BOTH";
      }
      if (hintMatch.usHouse) matched.usHouse = hintMatch.usHouse;
      if (hintMatch.note) result.notes.push(hintMatch.note);
      if (hintMatch.confidence && hintMatch.house && hintMatch.house !== "BOTH") {
        matched.confidence = hintMatch.confidence;
      }
      ["precinct", "judicial", "school", "county", "countyCommissioner", "soilWater"].forEach((k) => {
        if (hintMatch[k]) matched[k] = hintMatch[k];
      });
    }
    if (hintMatch.city && !result.city) {
      result.city = hintMatch.city
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  // City metadata (school, county) when not set by street
  if (matched && cityKey && geo.cities[cityKey]) {
    const cmeta = geo.cities[cityKey];
    ["judicial", "school", "county", "countyCommissioner", "soilWater"].forEach((k) => {
      if (!matched[k] && cmeta[k]) matched[k] = cmeta[k];
    });
  }

  if (matched) {
    result.house = matched.house || null;
    result.senate = matched.senate || "33";
    result.usHouse = matched.usHouse || [];
    result.confidence = matched.confidence || "medium";
    result.precinct = matched.precinct || "";
    result.judicial = matched.judicial || "10";
    result.school = matched.school || "";
    result.county = matched.county || "Washington";
    result.countyCommissioner = matched.countyCommissioner || "";
    result.soilWater = matched.soilWater || "";
    if (matched.note) result.notes.push(matched.note);
    if (matched.cityHint) result.notes.push("ZIP area: " + matched.cityHint);
    result.matchedVia = matched.from;
    if (!result.city && matched.from && String(matched.from).includes("street") && hintMatch && hintMatch.city) {
      result.city = hintMatch.city.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (normalizeCity(result.city) === "forest lake") result.city = "Forest Lake";
  } else if (streetUse || freeform) {
    result.notes.push(
      "Could not match city/ZIP. Showing statewide + all SD 33 local GOP races only. Select a city from the list for a tighter house district."
    );
    result.house = "BOTH";
    result.usHouse = ["4", "8"];
    result.confidence = "low";
    result.matchedVia = "fallback";
  } else {
    result.inSd33 = false;
    result.notes.push("Enter a street and city or ZIP.");
  }

  // Never invent MN-06 for SD 33 core (Emmer is optional connect only)
  if (Array.isArray(result.usHouse)) {
    result.usHouse = result.usHouse.filter((d) => d === "4" || d === "8");
    if (!result.usHouse.length) result.usHouse = ["4", "8"];
  }

  result.notes.push("Only Republican (GOP) candidates are listed and can be selected.");
  return result;
}

function loadElectionPhase() {
  const file = path.join(DATA, "election_phase.json");
  try {
    return loadJson(file) || {};
  } catch {
    return { mode: "pre_primary" };
  }
}

function gopBallotForDistricts(districts) {
  const data = loadCandidates();
  const phase = loadElectionPhase();
  const races = data.races;
  const out = [];
  const post = phase.mode === "post_primary" && phase.winnersUploaded;

  function partyNorm(p) {
    const x = String(p || "").toUpperCase();
    if (x === "GOP" || x === "R" || x === "REPUBLICAN") return "GOP";
    if (x === "DFL" || x === "D" || x.includes("DEMOCRATIC")) return "DFL";
    if (x.includes("NONPARTISAN") || x === "NP") return "NONPARTISAN";
    return p || "OTHER";
  }
  function mapCand(c, forceParty) {
    return {
      name: c.name,
      party: forceParty || partyNorm(c.party),
      note: c.note || "",
      leading: !!c.leading,
      nominee: false,
    };
  }
  function add(key, label) {
    const r = races[key];
    if (!r) return;
    // GOP only for checkboxes
    let candidates = (r.gop || [])
      .filter((c) => {
        const p = partyNorm(c.party || "GOP");
        return p === "GOP" || !c.party;
      })
      .map((c) => mapCand(c, "GOP"));
    // Other parties / nonpartisan — display only (right column)
    const others = (r.other || []).map((c) => mapCand(c));
    if (!candidates.length && !others.length) return;
    const winName = phase.winners && phase.winners[key];
    if (post && winName && candidates.length) {
      candidates = candidates
        .filter((c) => c.name === winName || /field|nominee|primary/i.test(c.name))
        .map((c) => ({
          ...c,
          nominee: c.name === winName,
          note: c.name === winName ? "Primary winner / nominee — support through the general election" : c.note,
          leading: c.name === winName,
        }));
      if (!candidates.some((c) => c.name === winName)) {
        candidates.unshift({
          name: winName,
          party: "GOP",
          note: "Primary winner / nominee — support through the general election",
          leading: true,
          nominee: true,
        });
      }
    }
    out.push({
      key,
      office: r.office,
      scope: r.scope,
      label: label || r.office,
      winSeat: !!r.winSeat,
      candidates,
      others,
    });
  }

  // Order matches typical SOS "What's on My Ballot" sample
  add("usSenate", "U.S. Senator");
  const uh = districts.usHouse || [];
  if (uh.includes("8")) add("usHouse8", "U.S. Representative District 8");
  if (uh.includes("4")) add("usHouse4", "U.S. Representative District 4");
  add("governor", "Governor & Lt Governor");
  add("secretaryOfState", "Secretary of State");
  add("stateAuditor", "State Auditor");
  add("attorneyGeneral", "Attorney General");
  add("stateSenate33", "State Senator District 33");

  if (districts.house === "33A") add("house33A", "State Representative District 33A");
  else if (districts.house === "33B") add("house33B", "State Representative District 33B");
  else {
    add("house33A", "State Representative District 33A (confirm precinct)");
    add("house33B", "State Representative District 33B (confirm precinct)");
  }

  // Nonpartisan (right column / sample ballot — not GOP checkboxes)
  add("countySheriff", "County Sheriff");
  add("judge10th38", "Judge - 10th District Court 38");

  return {
    asOf: data.asOf,
    races: out.filter((r) => (r.candidates || []).length > 0 || (r.others || []).length > 0),
    phase,
  };
}

function partyLabelOfficial(party) {
  const p = String(party || "").toUpperCase();
  if (p === "GOP" || p === "REPUBLICAN" || p === "R") return "REPUBLICAN";
  if (p === "DFL" || p.includes("DEMOCRATIC")) return "DEMOCRATIC-FARMER-LABOR";
  if (p === "NONPARTISAN" || p === "NP") return "NONPARTISAN";
  return String(party || "OTHER").toUpperCase();
}

/** SOS-style sample ballot table for the matched district */
function sampleBallotTableHtml(ballot) {
  const rows = [];
  for (const r of ballot.races || []) {
    const office = r.label || r.office || "";
    const gop = (r.candidates || []).filter((c) => String(c.party || "GOP").toUpperCase() === "GOP");
    const others = r.others || [];
    // GOP first (prominent), then others
    for (const c of gop) {
      rows.push({ office, name: c.name, party: "REPUBLICAN", gop: true, raceKey: r.key });
    }
    for (const c of others) {
      rows.push({
        office,
        name: c.name,
        party: partyLabelOfficial(c.party),
        gop: false,
        raceKey: r.key,
      });
    }
  }
  if (!rows.length) {
    return `<p class="muted">No sample ballot rows for this match.</p>`;
  }
  const body = rows
    .map(
      (row, i) =>
        `<tr class="${row.gop ? "sample-gop-row" : "sample-other-row"}">
          <td>${esc(row.office)}</td>
          <td>${
            row.gop
              ? `<label class="sample-check-label"><input type="checkbox" name="pick" value="${esc(row.raceKey)}||${esc(row.name)}" data-party="GOP" /> <strong>${esc(row.name)}</strong></label>`
              : `<span class="sample-other-name">${esc(row.name)}</span>`
          }</td>
          <td><span class="${row.gop ? "tag-gop" : row.party === "NONPARTISAN" ? "badge other" : "badge dfl"}">${esc(row.party)}</span></td>
        </tr>`
    )
    .join("");
  return `
    <div class="card sample-ballot-card" id="sample-ballot">
      <div class="sample-ballot-head">
        <h2 class="section-title">What's on My Ballot</h2>
        <a class="btn btn-navy btn-sm" href="#sample-ballot">View Sample Ballot</a>
      </div>
      <p class="muted">Matches your districts (SOS-style). <strong>Republican</strong> rows are checkable. DFL and nonpartisan names are shown for awareness only.</p>
      <div class="sample-ballot-wrap">
        <table class="sample-ballot-table">
          <thead>
            <tr><th>Office or Question</th><th>Candidate</th><th>Party</th></tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`;
}

function precinctDistrictsHtml(districts, formVals) {
  const house =
    districts.house === "BOTH"
      ? "33A or 33B — confirm precinct"
      : districts.house || "—";
  const cd = (districts.usHouse || []).join(" / ") || "—";
  return `
    <div class="card precinct-box" id="precinct-districts">
      <h2 class="section-title" style="margin-top:0">Precinct &amp; Districts</h2>
      <p class="muted" style="margin-top:0">Address: <strong>${esc(formVals.street || formVals.q || "—")}${
        formVals.city || districts.city ? ", " + esc(formVals.city || districts.city || "") : ""
      } ${esc(formVals.zip || districts.zip || "")}</strong></p>
      <table class="precinct-table">
        <tbody>
          <tr><th>Precinct</th><td>${esc(districts.precinct || "Confirm at pollfinder.sos.mn.gov")}</td></tr>
          <tr><th>Congressional</th><td>${esc(cd)}</td></tr>
          <tr><th>MN Senate</th><td>${esc(districts.senate || "33")}</td></tr>
          <tr><th>MN House</th><td>${esc(house)}</td></tr>
          <tr><th>Judicial</th><td>${esc(districts.judicial || "10")}</td></tr>
          <tr><th>School</th><td>${esc(districts.school || "Confirm at pollfinder")}</td></tr>
          <tr><th>County</th><td>${esc(districts.county || "Washington")}</td></tr>
          <tr><th>County Commissioner</th><td>${esc(districts.countyCommissioner || "Confirm at pollfinder")}</td></tr>
          <tr><th>Soil and Water</th><td>${esc(districts.soilWater || "Confirm at pollfinder")}</td></tr>
        </tbody>
      </table>
      <p class="muted" style="margin:0.65rem 0 0;font-size:0.88rem">Official source of truth: <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">pollfinder.sos.mn.gov</a> · <a href="https://myballotmn.sos.mn.gov/" target="_blank" rel="noopener">myballotmn.sos.mn.gov</a></p>
    </div>`;
}

function renderGopBallot(districts, ballot, formVals, opts = {}) {
  const confColor =
    districts.confidence === "high"
      ? "published"
      : districts.confidence === "medium"
        ? "marked"
        : "draft";
  const phase = ballot.phase || loadElectionPhase();
  const isPost = phase.mode === "post_primary" && phase.winnersUploaded;
  const thanks = opts.thanks
    ? `<div class="flash">Thank you. Your preferred candidates have been saved. You may update them at any time.</div>`
    : "";

  function partyBadgeHtml(party) {
    const p = String(party || "OTHER").toUpperCase();
    if (p === "GOP" || p === "REPUBLICAN") return '<span class="tag-gop">REPUBLICAN</span>';
    if (p === "DFL" || p.includes("DEMOCRATIC")) return '<span class="badge dfl">DFL</span>';
    if (p === "NONPARTISAN" || p === "NP") return '<span class="badge other">NONPARTISAN</span>';
    return `<span class="badge other">${esc(party || "OTHER")}</span>`;
  }

  const raceBlocks = (ballot.races || [])
    .map((r) => {
      const gopList = (r.candidates || []).filter(
        (c) => String(c.party || "GOP").toUpperCase() === "GOP"
      );
      const otherList = r.others || [];
      const cands = gopList
        .map((c, idx) => {
          const val = `${r.key}||${c.name}`;
          const id = `c_${r.key}_${idx}`.replace(/[^a-zA-Z0-9_]/g, "_");
          const lead = c.nominee ? ' <span class="badge published">NOMINEE</span>' : "";
          const boxCls = c.nominee ? "lit-box cand-pick priority" : "lit-box cand-pick";
          return `<div class="${boxCls}" style="cursor:default">
            <span>
              <span class="lbl">${partyBadgeHtml("GOP")} <strong>${esc(c.name)}</strong>${lead}</span>
              ${c.note ? `<div class="muted">${esc(c.note)}</div>` : ""}
            </span>
          </div>`;
        })
        .join("");
      const otherHtml = otherList.length
        ? otherList
            .map(
              (c) =>
                `<div class="other-cand-row">
                  <span class="other-cand-name">${esc(c.name)}</span>
                  ${partyBadgeHtml(c.party)}
                  <span class="muted" style="font-size:0.8rem"> · ${esc(partyLabelOfficial(c.party))}</span>
                  ${c.note ? `<div class="muted" style="font-size:0.85rem">${esc(c.note)}</div>` : ""}
                </div>`
            )
            .join("")
        : `<p class="muted" style="margin:0;font-size:0.88rem">No other-party filings listed for this office in our file.</p>`;
      if (!cands && !otherList.length) return "";
      return `<section class="card race-split-card" style="margin-bottom:0.85rem">
        <h3>${esc(r.label || r.office)} ${r.winSeat ? '<span class="badge pri">Local Priority Seat</span>' : ""}</h3>
        <p class="muted" style="margin-bottom:0.75rem">${esc(r.scope || "")} · Use the <strong>sample ballot table</strong> above to check GOP preferences.</p>
        <div class="race-split">
          <div class="race-gop-col">
            <h4 class="race-col-title gop-title">Republican (GOP) — prominent</h4>
            ${cands || '<p class="muted">No Republican candidates listed for this office.</p>'}
          </div>
          <div class="race-other-col">
            <h4 class="race-col-title other-title">Other / nonpartisan (display only)</h4>
            <p class="muted" style="font-size:0.85rem;margin:0 0 0.5rem">Party or non-affiliated label next to each name.</p>
            ${otherHtml}
          </div>
        </div>
      </section>`;
    })
    .join("");

  const issuesContrastHtml = `
    <section class="card issues-contrast home-section" aria-label="Issues contrast for the district">
      <h2 class="section-title" style="margin-top:0">Taxes, Education &amp; Roads — Why This District Needs a Different Direction</h2>
      <p class="muted">Examples of DFL leadership positions that leave money and flexibility off the table for St.&nbsp;Croix Valley families. <strong>Not legal advice</strong> and not a claim about every vote by every local nominee—verify records and confirm with campaigns. Sources linked where noted.</p>
      <div class="issues-grid">
        <article class="issue-card">
          <h3>Education — federal $1,700 scholarship tax credit</h3>
          <p>Congress created a <strong>federal tax credit of up to $1,700</strong> for donations to scholarship-granting organizations that can help K–12 families with tutoring, tuition, special education, and materials. States must <strong>opt in</strong> for residents to fully use the program for local students.</p>
          <p><strong>What DFL leadership did:</strong> Governor Tim Walz said he will <strong>not</strong> opt Minnesota into the federal education scholarship tax credit. At the Legislature, DFL members blocked or stalled Republican bills (e.g. HF&nbsp;3490) to opt Minnesota in—including fights that held up broader education work. Committee debate framed the federal credit as a “voucher” and refused to advance the opt-in.</p>
          <p><strong>HD&nbsp;33B — Rep. Josiah Hill (DFL):</strong> When the measure needed to move forward to the <strong>House Taxes Committee</strong>, <strong>Rep. Josiah Hill voted no</strong>. That no vote helped stop the bill dead in its tracks—so the opt-in never advanced for a full tax-committee path and Minnesota families never got a clear shot at the federal $1,700 scholarship credit through the Legislature.</p>
          <p><strong>Why that hurts SD&nbsp;33 / HD&nbsp;33B:</strong> Families in Stillwater, Bayport, Oak Park Heights, Scandia, Marine on St.&nbsp;Croix, Forest Lake (33B precincts), May Township, Stillwater Township, and neighboring towns forgo federal support that could expand learning options <em>at no cost to the state budget</em>. Neighboring states that opt in capture help our kids miss. Local schools and parents lose a tool other Americans already have—because DFL leadership, including this district’s House member, blocked the process.</p>
          <p class="muted" style="font-size:0.85rem">See: Minnesota House Session Daily (HF 3490 / $1,700 credit debate); MPR News on Walz refusing the opt-in (Mar 2026). Confirm the committee roll call on the official House journal / vote board.</p>
        </article>
        <article class="issue-card">
          <h3>Taxes — high costs, little relief for working families</h3>
          <p>Under DFL control of the governorship and, for long stretches, majorities that set tax and budget direction, Minnesota has remained among the higher-tax states while costs for housing, energy, and childcare stay elevated for suburban/exurban households.</p>
          <p><strong>What voters should demand:</strong> Tax policy that keeps more earnings with families who live and work along Hwy&nbsp;61, Hwy&nbsp;36, and the St.&nbsp;Croix Valley—not policies that treat high state spending as automatic.</p>
          <p><strong>Why that hurts SD&nbsp;33:</strong> Competitive districts like 33A/33B turn on kitchen-table math. When state tax and fee pressure rises, seniors on fixed incomes, young families buying first homes, and small employers feel it first.</p>
        </article>
        <article class="issue-card">
          <h3>Roads &amp; infrastructure — corridors that move our district</h3>
          <p>SD&nbsp;33 depends on safe, well-funded roads: Hwy&nbsp;36, Hwy&nbsp;61, Manning Avenue, CR&nbsp;96, and Main Street corridors that connect Stillwater, Forest Lake, Hugo, Bayport, and every township in between.</p>
          <p><strong>The problem under one-party DFL executive direction:</strong> Major state resources have been steered toward metro priorities and large new spending packages while everyday road maintenance, congestion, and rural/suburban safety remain under pressure. Local residents still wait for practical fixes on the routes they drive every day.</p>
          <p><strong>Why that hurts SD&nbsp;33:</strong> Commuters, school buses, and small businesses pay the price of delayed repairs and under-prioritized corridors. Strong representation means fighting for road dollars and project schedules that match how people actually live here—not only downtown-centric agendas.</p>
        </article>
      </div>
      <p class="muted" style="margin:0.85rem 0 0">Check <strong>Republican (GOP)</strong> candidates on the left for each office. Other-party names on the right are shown for ballot awareness only.</p>
    </section>`;

  const notes = (districts.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");

  const phaseBanner = isPost
    ? `<div class="card home-section" style="border-left:4px solid var(--green);margin-bottom:1rem">
        <span class="badge published">Post-Primary</span>
        <h2 class="section-title" style="margin:0.45rem 0">${esc(phase.postPrimaryTitle || "Post-Primary: Nominees and Team Path")}</h2>
        <p>${esc(phase.postPrimaryBody || "")}</p>
        <p><strong>${esc(phase.teamPushHeadline || "Move Forward as a Team")}</strong> ${esc(phase.teamPushBody || "")}</p>
        ${phase.winnersAsOf ? `<p class="muted">Results published as of ${esc(phase.winnersAsOf)}.</p>` : ""}
      </div>`
    : `<div class="card home-section" style="border-left:4px solid var(--gold);margin-bottom:1rem">
        <span class="badge pri">Pre-Primary</span>
        <h2 class="section-title" style="margin:0.45rem 0">${esc(phase.prePrimaryTitle || "Pre-Primary Preferences")}</h2>
        <p>${esc(phase.prePrimaryBody || "")}</p>
        <p class="muted"><strong>Primary:</strong> ${esc(phase.primaryDateLabel || "August 11, 2026")} · <strong>General election:</strong> ${esc(phase.generalDateLabel || "November 3, 2026")}</p>
        <p class="muted">${esc(phase.winnersNote || "")}</p>
      </div>`;

  return `
    ${thanks}
    <section class="hero cro-ballot-hero">
      <span class="badge pri">What's on My Ballot</span>
      <h2>GOP candidates for your address</h2>
      <p>Enter a street address to view districts and a SOS-style sample ballot. <strong>Republican</strong> rows are checkable; other parties are shown for awareness only.${
        isPost
          ? " Save preferences for the general-election package."
          : " Save pre-primary preferences; after the primary, nominees will be published for a team push."
      }</p>
    </section>

    ${phaseBanner}

    <form class="card stack" method="get" action="/my-gop-ballot" style="margin-bottom:1rem">
      <label for="bal-street">Street Address</label>
      <input id="bal-street" type="text" name="street" value="${esc(formVals.street || "")}" placeholder="123 Main St N" autocomplete="street-address" />
      <label for="bal-city">City / Town</label>
      <select id="bal-city" name="city">
        <option value="">Select city…</option>
        ${[
          "Stillwater",
          "Oak Park Heights",
          "Bayport",
          "Marine on St. Croix",
          "Scandia",
          "May Township",
          "Stillwater Township",
          "Forest Lake",
          "Hugo",
          "Mahtomedi",
          "Dellwood",
          "Grant",
        ]
          .map(
            (c) =>
              `<option value="${esc(c)}" ${
                normalizeCity(formVals.city) === normalizeCity(c) ? "selected" : ""
              }>${esc(c)}</option>`
          )
          .join("")}
      </select>
      <label for="bal-zip">ZIP Code <span class="muted">(optional — improves match)</span></label>
      <input id="bal-zip" type="text" name="zip" value="${esc(formVals.zip || "")}" placeholder="55082" maxlength="10" autocomplete="postal-code" />
      <label for="bal-q">Or Paste Full Address</label>
      <input id="bal-q" type="text" name="q" value="${esc(formVals.q || "")}" placeholder="123 Main St, Stillwater, MN 55082" />
      <div class="row-actions">
        <button class="btn" type="submit">Show Candidates</button>
      </div>
    </form>

    ${
      formVals.submitted
        ? `
    ${precinctDistrictsHtml(districts, formVals)}
    ${issuesContrastHtml}

    <form method="post" action="/my-gop-ballot/prefer" id="pref-form">
      <input type="hidden" name="street" value="${esc(formVals.street || "")}" />
      <input type="hidden" name="city" value="${esc(formVals.city || districts.city || "")}" />
      <input type="hidden" name="zip" value="${esc(formVals.zip || "")}" />
      <input type="hidden" name="q" value="${esc(formVals.q || "")}" />
      <input type="hidden" name="houseDistrict" value="${esc(districts.house || "")}" />
      <input type="hidden" name="usHouse" value="${esc((districts.usHouse || []).join(","))}" />

      ${sampleBallotTableHtml(ballot)}

      <p class="muted" style="margin:0.5rem 0 1rem">Match confidence: <span class="badge ${confColor}">${esc(districts.confidence || "low")}</span>
      · as of ${esc(ballot.asOf || "")}. ${notes ? esc(districts.notes.join(" ")) : ""}</p>

      <div class="card" style="margin-bottom:1rem;border-color:#e0b84a">
        <h3>${isPost ? "General Election Package" : "Preference Period"}</h3>
        ${
          isPost
            ? `<p class="muted">Nominees are highlighted. Confirm who you will support through the general election, then save so captains can issue the correct literature package.</p>
        <label class="lit-box priority">
          <input type="checkbox" name="phase" value="post_package" checked />
          <span>
            <span class="lbl">Post-primary package — support nominees as one team</span>
            <div class="muted">Local slate (Senate 33 / House 33A or 33B) plus statewide and federal nominees when literature is available.</div>
          </span>
        </label>
        <label class="lit-box">
          <input type="checkbox" name="wantFullPackage" value="yes" checked />
          <span>
            <span class="lbl">Send me the full post-primary literature package</span>
            <div class="muted">Governor, U.S. Senate, U.S. House, and local seats for my address.</div>
          </span>
        </label>
        <label class="lit-box">
          <input type="checkbox" name="teamPushOk" value="yes" checked />
          <span>
            <span class="lbl">I will help move forward as a team for the general election</span>
            <div class="muted">Captains may contact me about doors, events, and pack pickup for the winning slate.</div>
          </span>
        </label>`
            : `<p class="muted">Select pre-primary preferences now. After ${esc(
                phase.primaryDateLabel || "the primary"
              )}, winners and results will be uploaded; we will then invite you to support nominees and advance as a team.</p>
        <label class="lit-box priority">
          <input type="checkbox" name="phase" value="pre_primary" checked />
          <span>
            <span class="lbl">Pre-primary preferences</span>
            <div class="muted">Before ${esc(phase.primaryDateLabel || "August 11, 2026")} — select the candidates you prefer in contested primaries and local races.</div>
          </span>
        </label>
        <label class="lit-box">
          <input type="checkbox" name="phase" value="post_package" />
          <span>
            <span class="lbl">Also notify me for the post-primary team package</span>
            <div class="muted">After winners are published, I want the full nominee literature package for my address.</div>
          </span>
        </label>
        <label class="lit-box">
          <input type="checkbox" name="wantFullPackage" value="yes" />
          <span>
            <span class="lbl">I want the full post-primary literature package when available</span>
            <div class="muted">Governor, U.S. Senate, U.S. House, Senate 33, and House 33A or 33B.</div>
          </span>
        </label>
        <label class="lit-box">
          <input type="checkbox" name="teamPushOk" value="yes" checked />
          <span>
            <span class="lbl">After the primary, contact me to move forward as a team</span>
            <div class="muted">Support for nominees and local seats through the general election.</div>
          </span>
        </label>`
        }
      </div>

      <h2 style="margin-top:1rem">By Office — Republican Prominent · Others on the Right</h2>
      <p class="muted">Same races as the sample ballot. Check <strong>REPUBLICAN</strong> names in the table above, then save. DFL and nonpartisan appear on the right for awareness only.</p>
      ${raceBlocks}

      <div class="card stack">
        <h3>Contact Information <span class="muted">(optional — helps with package follow-up)</span></h3>
        <label for="pref-name">Name</label>
        <input id="pref-name" type="text" name="name" maxlength="100" autocomplete="name" />
        <label for="pref-contact">Email or Phone</label>
        <input id="pref-contact" type="text" name="contact" maxlength="160" autocomplete="email" />
        <label for="pref-notes">Notes</label>
        <textarea id="pref-notes" name="notes" rows="2" maxlength="500" placeholder="Optional notes for captains"></textarea>
        <div class="row-actions">
          <button class="btn" type="submit">Save Preferred Candidates</button>
          <a class="btn btn-navy" href="/volunteer">Volunteer Signup</a>
        </div>
      </div>
    </form>

    <div class="card" style="margin-top:1rem;border:2px solid var(--gop)">
      <h3 style="color:var(--gop)">Busy Street Sign Request</h3>
      <p>If this address is on a busy street and the resident supports a candidate, ask about a yard sign location and log it below.</p>
    </div>
    ${signAskCalloutAndForm({
      redirect: "/my-gop-ballot?street=" + encodeURIComponent(formVals.street || "") + "&city=" + encodeURIComponent(formVals.city || "") + "&zip=" + encodeURIComponent(formVals.zip || "") + "&q=" + encodeURIComponent(formVals.q || ""),
      street: formVals.street || "",
      city: formVals.city || "",
    })}

    <div class="card" style="margin-top:1rem">
      <p><a class="btn btn-navy" href="/carry">Choose Literature</a>
      <a class="btn btn-navy" href="/field/doors">Door Lists</a>
      <a class="btn btn-navy" href="/team/sign-asks">Sign Requests</a>
      <a class="btn btn-navy" href="/team/preferences">Preference Totals</a></p>
    </div>`
        : `<div class="card"><p class="muted">Enter an address above to view candidates for your districts and save your preferred selections.</p></div>`
    }`;
}

function contactTable(rows, opts = {}) {
  const showPhone = opts.showPhone !== false;
  return `<table>
    <thead><tr>
      <th>Pri</th><th>Name</th><th>Address</th><th>City</th>
      ${showPhone ? "<th>Phone</th>" : ""}
      <th>Party</th><th>HD</th><th>Near poll / corridor</th><th>Sign</th><th>Notes</th>
    </tr></thead>
    <tbody>${
      rows.length
        ? rows
            .map((c) => {
              const pc = partyClass(c.partyAffiliation);
              const badge =
                pc === "GOP"
                  ? '<span class="tag-gop">GOP</span>'
                  : pc === "DFL"
                    ? '<span class="badge dfl">DFL</span>'
                    : pc === "NP"
                      ? '<span class="badge other">NP/I</span>'
                      : '<span class="badge other">UNK</span>';
              return `<tr class="${c.isDemo ? "demo-row" : ""}">
                <td>${esc(c.doorPriority ?? "")}</td>
                <td><strong>${esc(c.name)}</strong>${c.isDemo ? ' <span class="muted">demo</span>' : ""}</td>
                <td>${esc(c.address)}</td>
                <td>${esc(c.city)} ${esc(c.zip || "")}</td>
                ${showPhone ? `<td>${esc(c.phone || "—")}</td>` : ""}
                <td>${badge}</td>
                <td>${esc(c.houseDistrict)}</td>
                <td class="muted">${esc(c.nearPollingPlace || "—")}<br/>${esc(c.streetCorridor || "")}</td>
                <td>${esc(c.signOk || "")}</td>
                <td class="muted">${esc((c.notes || "").slice(0, 80))}</td>
              </tr>`;
            })
            .join("")
        : `<tr><td colspan="10">No contacts match. Import voter-file CSV at <a href="/field/import">/field/import</a>.</td></tr>`
    }</tbody>
  </table>`;
}
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Private development mode: site is not a live campaign/fundraising service */
const PRIVATE_DEVELOPMENT =
  process.env.PRIVATE_DEVELOPMENT !== "false" && process.env.PRIVATE_DEVELOPMENT !== "0";

const PRIVATE_DEV_NOTICE = {
  title: "St. Croix Valley Field Hub",
  body: [
    "This website is under private development and is not currently operating as a public campaign, political committee, fundraising platform, or volunteer-organizing service.",
    "Candidate, election, geographic, and legislative information appearing in the development environment is provisional and is being reviewed for accuracy, sourcing, privacy, accessibility, and compliance before publication.",
    "No volunteer registrations, contributions, campaign requests, or voter information are being accepted through this development site.",
    "For official election and precinct information, please consult the Minnesota Secretary of State.",
  ],
};

const BLOCKED_WRITE_PREFIXES = [
  "/volunteer",
  "/pulsar",
  "/carry",
  "/log-drop",
  "/field/import",
  "/field/log",
  "/field/sign-ask",
  "/share/feedback",
  "/schedule/signup",
  "/my-gop-ballot/prefer",
  "/donate",
];

const app = express();
app.set("trust proxy", 1);
app.use(morgan(IS_PROD ? "combined" : "dev"));
app.use(express.urlencoded({ extended: true }));
// Short cache so CSS/JS nav updates show quickly after deploy
app.use(
  express.static(path.join(ROOT, "public"), {
    maxAge: IS_PROD ? "5m" : 0,
    etag: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sd33-litdrop-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// Block write/submit endpoints while in private development
app.use((req, res, next) => {
  if (!PRIVATE_DEVELOPMENT) return next();
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH" && req.method !== "DELETE") {
    return next();
  }
  const p = (req.path || "").split("?")[0];
  const blocked = BLOCKED_WRITE_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(prefix + "/")
  );
  // Allow GET-style ballot lookup POST redirect if any; only block data-collection posts
  if (!blocked) return next();
  req.session.flash =
    "This development site is not accepting volunteer registrations, contributions, campaign requests, or other submissions. For official election information, use the Minnesota Secretary of State.";
  const back = req.get("Referer") || "/";
  return res.redirect(back);
});

function isNavActive(href, currentPath) {
  const path = (currentPath || "/").split("?")[0] || "/";
  if (href === "/") return path === "/";
  if (href === "/field") return path === "/field" || path.startsWith("/field/");
  if (href === "/volunteer") return path === "/volunteer" || path.startsWith("/volunteer");
  if (href === "/pulsar") return path === "/pulsar" || path.startsWith("/pulsar");
  return path === href || path.startsWith(href + "/");
}
function navClass(href, currentPath) {
  if (!isNavActive(href, currentPath)) return "";
  return ' class="nav-active" aria-current="page"';
}

function privateDevBannerHtml() {
  if (!PRIVATE_DEVELOPMENT) return "";
  return `
  <aside class="dev-banner" role="status" aria-label="Development preview notice">
    <div class="wrap dev-banner-inner">
      <p class="dev-banner-text"><strong>Development preview</strong> — information is provisional and forms are not accepting submissions.</p>
      <details>
        <summary>Development details</summary>
        <div class="dev-banner-body">
          ${PRIVATE_DEV_NOTICE.body.map((p) => `<p>${esc(p)}</p>`).join("")}
          <p>
            <a href="https://www.sos.mn.gov/" target="_blank" rel="noopener">Minnesota Secretary of State</a>
            ·
            <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">Poll finder</a>
            ·
            <a href="https://myballotmn.sos.mn.gov/" target="_blank" rel="noopener">What's on My Ballot</a>
            ·
            <a href="/about">About this project</a>
          </p>
        </div>
      </details>
    </div>
  </aside>`;
}

function navLink(href, label, currentPath) {
  const active = isNavActive(href, currentPath);
  return `<a href="${esc(href)}"${active ? ' class="nav-active" aria-current="page"' : ""}>${label}</a>`;
}

function layout(title, body, opts = {}) {
  const extraHead = opts.extraHead || "";
  const extraFoot = opts.extraFoot || "";
  const path = opts.path || "/";
  const bodyClass = [
    PRIVATE_DEVELOPMENT ? "private-dev" : "",
    opts.bodyClass || "",
  ]
    .filter(Boolean)
    .join(" ");
  const robots = PRIVATE_DEVELOPMENT
    ? `<meta name="robots" content="noindex, nofollow" />`
    : "";
  const siteTagline =
    "A volunteer-built district organizing and voter-information hub for Minnesota Senate District 33 and House Districts 33A and 33B.";
  const metaDesc = PRIVATE_DEVELOPMENT
    ? `${siteTagline} Private development environment — not currently a public campaign, committee, or fundraising site. Official election info: Minnesota Secretary of State.`
    : `${siteTagline} Maps, candidates, events, and field tools for every community in the district.`;
  const nl = (href, label) => navLink(href, label, path);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${esc(metaDesc)}" />
  ${robots}
  <title>${esc(title)} · St. Croix Valley Field Hub · SD 33</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/design-system.css?v=v1" />
  <link rel="stylesheet" href="/css/lit.css?v=v1compat" />
  ${extraHead}
</head>
<body class="${esc(bodyClass)}">
  <a class="skip-link" href="#main">Skip to main content</a>
  ${privateDevBannerHtml()}
  <header class="site-header" id="site-header" role="banner">
    <div class="wrap site-header-inner">
      <a href="/" class="brand-link" aria-label="St. Croix Valley Field Hub home">
        <span class="brand-mark" aria-hidden="true">SD<br/>33</span>
        <span class="brand-text-block">
          <span class="brand-wordmark">St. Croix Valley Field Hub</span>
          <span class="brand-sub">Minnesota · SD 33 · HD 33A · HD 33B</span>
        </span>
      </a>
      <nav class="primary-nav" id="primary-nav" aria-label="Primary">
        ${nl("/", "Home")}
        ${nl("/my-gop-ballot", "Find My Ballot")}
        ${nl("/candidates", "Candidates")}
        ${nl("/events", "Events")}
        ${nl("/volunteer", "Volunteer")}
        ${nl("/district-facts", "District Facts")}
        <details class="nav-more">
          <summary>More</summary>
          <div class="nav-more-panel" role="group" aria-label="More pages">
            ${nl("/map", "District Map")}
            ${nl("/district-facts#voting-records", "Voting Records")}
            ${nl("/sources", "Sources")}
            ${nl("/corrections", "Corrections")}
            ${nl("/about", "About")}
            ${nl("/es", "Español")}
            ${nl("/accessibility", "Accessibility")}
            ${nl("/privacy", "Privacy")}
            ${nl("/legal", "Legal")}
            ${nl("/review", "Feedback")}
            ${nl("/share", "Share")}
          </div>
        </details>
      </nav>
      <div class="header-actions">
        <a class="header-utility" href="/my-gop-ballot">Find My Ballot</a>
        <a class="btn btn-primary btn-sm" href="/volunteer">Volunteer</a>
        <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">
          <span class="nav-toggle-bars" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </header>
  <div class="mobile-nav" id="mobile-nav" hidden>
    <div class="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Site menu" id="mobile-nav-panel">
      <div class="mobile-nav-head">
        <strong>Menu</strong>
        <button type="button" class="btn btn-secondary btn-sm" id="nav-close" aria-label="Close menu">Close</button>
      </div>
      ${nl("/", "Home")}
      ${nl("/my-gop-ballot", "Find My Ballot")}
      ${nl("/candidates", "Candidates")}
      ${nl("/events", "Events")}
      ${nl("/volunteer", "Volunteer")}
      ${nl("/district-facts", "District Facts")}
      <p class="mobile-nav-section">More</p>
      ${nl("/map", "District Map")}
      ${nl("/district-facts#voting-records", "Voting Records")}
      ${nl("/sources", "Sources")}
      ${nl("/corrections", "Corrections")}
      ${nl("/about", "About")}
      ${nl("/es", "Español")}
      ${nl("/accessibility", "Accessibility")}
      ${nl("/privacy", "Privacy")}
      ${nl("/legal", "Legal")}
      ${nl("/review", "Feedback")}
      <a class="btn btn-primary" href="/volunteer">Volunteer</a>
      <p class="mobile-nav-section">Operations</p>
      ${nl("/portal", "Field / Captain Portal")}
    </div>
  </div>
  <main id="main" class="wrap main" role="main">${body}</main>
  <footer class="site-footer" role="contentinfo">
    <div class="wrap footer-grid">
      <div>
        <span class="footer-brand-name">St. Croix Valley Field Hub</span>
        <p style="margin:0 0 0.5rem;max-width:28rem;color:#94a3b8">Volunteer-built district information and organizing tools for SD&nbsp;33, HD&nbsp;33A, and HD&nbsp;33B in Washington County and the St.&nbsp;Croix Valley.</p>
        <p style="margin:0;font-size:0.85rem;color:#94a3b8">${
          PRIVATE_DEVELOPMENT
            ? "Development status: private preview — not accepting submissions."
            : "Not an official government website. Not legal advice."
        }</p>
      </div>
      <div>
        <h3>Explore</h3>
        <ul>
          <li><a href="/my-gop-ballot">Find My Ballot</a></li>
          <li><a href="/candidates">Candidates</a></li>
          <li><a href="/events">Events</a></li>
          <li><a href="/volunteer">Volunteer</a></li>
          <li><a href="/district-facts">District Facts</a></li>
          <li><a href="/map">District Map</a></li>
        </ul>
      </div>
      <div>
        <h3>Official voting</h3>
        <ul>
          <li><a href="https://pollfinder.sos.mn.gov/" rel="noopener" target="_blank">Poll finder</a></li>
          <li><a href="https://myballotmn.sos.mn.gov/" rel="noopener" target="_blank">What's on My Ballot</a></li>
          <li><a href="https://candidates.sos.mn.gov/" rel="noopener" target="_blank">SOS candidates</a></li>
          <li><a href="https://www.sos.mn.gov/" rel="noopener" target="_blank">sos.mn.gov</a></li>
        </ul>
      </div>
      <div>
        <h3>Trust &amp; policy</h3>
        <ul>
          <li><a href="/sources">Sources</a></li>
          <li><a href="/corrections">Corrections</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/legal">Legal</a></li>
          <li><a href="/accessibility">Accessibility</a></li>
          <li><a href="/review">Feedback</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap footer-bottom">
      <p>Candidate and district data are assembled from public sources and are provisional in development. Always confirm with the Minnesota Secretary of State.</p>
      <p>Poll rules: no campaigning inside a polling place or within <strong>100 feet</strong> of the building — Minn. Stat. §§ 204C.06, 211B.11. Never place literature in U.S. mailboxes. See <a href="/legal">Legal</a>.</p>
    </div>
  </footer>
  <script src="/js/nav-active.js?v=nav5"></script>
  <script src="/js/site-shell.js?v=v1"></script>
  <script src="/js/analytics.js?v=v1"></script>
  ${extraFoot}
</body>
</html>`;
}

/** Send a page with correct active nav tab for this request path */
function sendPage(req, res, title, body, opts = {}) {
  res.send(layout(title, body, { ...opts, path: req.path || "/" }));
}

function partyBadge(party) {
  const p = String(party || "").toUpperCase();
  if (p === "GOP" || p === "REPUBLICAN" || p === "R") return '<span class="badge">GOP</span>';
  if (p === "DFL" || p === "DEMOCRATIC" || p === "D") return '<span class="badge dfl">DFL</span>';
  return `<span class="badge other">${esc(party || "OTHER")}</span>`;
}

function candList(items) {
  return `<ul class="list">${(items || [])
    .map(
      (c) =>
        `<li>
          ${partyBadge(c.party)}
          <span class="cand-name">${esc(c.name)}</span>
          ${c.note ? `<div class="note">${esc(c.note)}</div>` : ""}
        </li>`
    )
    .join("")}</ul>`;
}

/* ---------- GOP ballot by address ---------- */
app.get("/my-gop-ballot", (req, res) => {
  const hasInput = !!(req.query.street || req.query.city || req.query.q || req.query.zip);
  const formVals = {
    street: req.query.street || "",
    city: req.query.city || "",
    zip: req.query.zip || "",
    q: req.query.q || "",
    submitted: hasInput,
  };
  let districts = {
    house: null,
    senate: "33",
    usHouse: [],
    confidence: "low",
    notes: [],
  };
  let ballot = { asOf: "", races: [] };
  if (hasInput) {
    districts = resolveAddress({
      street: formVals.street,
      city: formVals.city,
      zip: formVals.zip,
      q: formVals.q,
    });
    ballot = gopBallotForDistricts(districts);
  }
  sendPage(
    req,
    res,
    "My GOP ballot",
    renderGopBallot(districts, ballot, formVals, { thanks: req.query.saved === "1" })
  );
});

app.post("/my-gop-ballot", (req, res) => {
  const q = new URLSearchParams({
    street: req.body.street || "",
    city: req.body.city || "",
    zip: req.body.zip || "",
    q: req.body.q || "",
  });
  res.redirect("/my-gop-ballot?" + q.toString());
});

app.post("/my-gop-ballot/prefer", (req, res) => {
  let picks = req.body.pick;
  if (!picks) picks = [];
  if (!Array.isArray(picks)) picks = [picks];

  let phases = req.body.phase;
  if (!phases) phases = [];
  if (!Array.isArray(phases)) phases = [phases];
  if (phases.length === 0) phases = ["pre_primary"];

  const preferred = picks
    .map((p) => {
      const [raceKey, ...rest] = String(p).split("||");
      return { raceKey, candidate: rest.join("||"), party: "GOP" };
    })
    .filter((p) => p.raceKey && p.candidate);

  const entry = {
    id: "pref_" + Date.now(),
    at: new Date().toISOString(),
    name: String(req.body.name || "").slice(0, 100),
    contact: String(req.body.contact || "").slice(0, 160),
    notes: String(req.body.notes || "").slice(0, 500),
    address: {
      street: String(req.body.street || "").slice(0, 120),
      city: String(req.body.city || "").slice(0, 80),
      zip: String(req.body.zip || "").slice(0, 10),
      q: String(req.body.q || "").slice(0, 200),
    },
    houseDistrict: String(req.body.houseDistrict || ""),
    usHouse: String(req.body.usHouse || ""),
    phases,
    wantFullPackage: req.body.wantFullPackage === "yes",
    teamPushOk: req.body.teamPushOk === "yes",
    electionMode: (loadElectionPhase().mode || "pre_primary"),
    preferred,
  };

  const all = loadJson(PREFS_FILE);
  all.unshift(entry);
  saveJson(PREFS_FILE, all.slice(0, 5000));

  const q = new URLSearchParams({
    street: entry.address.street,
    city: entry.address.city,
    zip: entry.address.zip,
    q: entry.address.q,
    saved: "1",
  });
  res.redirect("/my-gop-ballot?" + q.toString());
});

app.get("/api/gop-ballot", (req, res) => {
  const districts = resolveAddress({
    street: req.query.street || "",
    city: req.query.city || "",
    zip: req.query.zip || "",
    q: req.query.q || req.query.address || "",
  });
  const ballot = gopBallotForDistricts(districts);
  res.json({
    ok: true,
    address: {
      street: districts.street,
      city: districts.city,
      zip: districts.zip,
    },
    districts: {
      stateSenate: districts.senate,
      stateHouse: districts.house,
      usHouse: districts.usHouse,
      confidence: districts.confidence,
      notes: districts.notes,
      matchedVia: districts.matchedVia,
    },
    gopCandidates: ballot.races,
    asOf: ballot.asOf,
  });
});

/* ---------- Home (public: voters, volunteers, residents) ---------- */
app.get("/", (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  const todayHome = todayYmd();
  const allEvents = loadJson(EVENTS_FILE).events || [];
  const homeEvents = allEvents
    .filter((e) => eventIsConfirmedPublic(e, todayHome))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 3);
  const candData = loadCandidates();
  const areas = candData.districtAreas || {};
  function areaDetails(key) {
    const d = areas[key];
    if (!d) return "";
    const items = (d.areas || []).map((a) => "<li>" + esc(a) + "</li>").join("");
    return `<details><summary>View district communities</summary><ul class="area-grid" style="margin-top:0.5rem">${items}</ul></details>`;
  }
  const cityOptions = [
    "Bayport",
    "Dellwood",
    "Forest Lake",
    "Grant",
    "Hugo",
    "Mahtomedi",
    "Marine on St. Croix",
    "May Township",
    "Oak Park Heights",
    "Scandia",
    "Stillwater",
    "Stillwater Township",
    "Willernie",
  ]
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
    .join("");

  const eventCards = homeEvents.length
    ? homeEvents
        .map((e) => {
          return `
      <article class="event-card-sm">
        <span class="badge confirmed">Confirmed</span>
        <h3>${esc(e.title)}</h3>
        <p class="event-meta"><strong>${esc(e.dayLabel || e.date || "")}</strong> · ${esc(e.time || "")} · ${esc(e.locationName || "")}</p>
        <p class="muted" style="margin:0 0 0.5rem;font-size:0.9rem">${esc((e.districts || []).join(" · "))}</p>
        <div class="cta-row">
          <a class="btn btn-primary btn-sm" href="/events?view=confirmed">View event details</a>
          <a class="btn btn-secondary btn-sm" href="/events/${esc(e.id)}.ics">Add to calendar</a>
        </div>
      </article>`;
        })
        .join("")
    : `<div class="empty-state" style="grid-column:1/-1"><strong>No confirmed public events listed yet</strong><p class="muted">Proposed or venue-TBA items stay under <a href="/events?view=proposed">proposed events</a> until confirmed.</p></div>`;

  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}

    <section class="home-hero" aria-label="Welcome">
      <span class="home-hero-kicker">Washington County · St. Croix Valley</span>
      <h1>Know Your District. Meet the Candidates. Help Shape Minnesota’s Future.</h1>
      <p>Volunteer-built voter information and community organizing for Senate District&nbsp;33 and House Districts&nbsp;33A and&nbsp;33B—every city and township named equally.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="#find-address">Find My Ballot</a>
        <a class="btn btn-secondary" href="/volunteer">Volunteer</a>
        <a class="btn btn-text" href="/candidates">View Candidates</a>
      </div>
    </section>

    <div class="trust-strip" role="region" aria-label="Scope and trust">
      <span class="trust-pill">Senate District 33</span>
      <span class="trust-pill">House Districts 33A &amp; 33B</span>
      <span class="trust-pill">Washington County · St. Croix Valley</span>
      <span class="trust-pill">Volunteer-built</span>
      <span class="trust-pill"><a href="https://www.sos.mn.gov/" target="_blank" rel="noopener">Official SOS sources ↗</a></span>
    </div>

    <section id="find-address" class="lookup-panel section" aria-label="Find your district by address">
      <h2>Find your district and ballot</h2>
      <p class="muted" style="margin-top:0">Enter a street address so we can match precinct and legislative districts for SD&nbsp;33. Results are provisional tools for this project—the Minnesota Secretary of State is the official source.</p>
      <form class="lookup-form stack" method="get" action="/my-gop-ballot">
        <label for="home-q">Full address <span class="muted">(preferred)</span></label>
        <input id="home-q" type="text" name="q" maxlength="200" placeholder="1731 Beach Drive, Forest Lake, MN 55025" autocomplete="street-address" />
        <div class="lookup-grid">
          <div>
            <label for="home-street">Or street only</label>
            <input id="home-street" type="text" name="street" maxlength="120" placeholder="1731 Beach Drive" autocomplete="address-line1" />
          </div>
          <div>
            <label for="home-city">City or township <span class="muted">(optional)</span></label>
            <select id="home-city" name="city">
              <option value="">Select…</option>
              ${cityOptions}
            </select>
          </div>
        </div>
        <label for="home-zip">ZIP <span class="muted">(optional)</span></label>
        <input id="home-zip" type="text" name="zip" maxlength="10" placeholder="55082" autocomplete="postal-code" style="max-width:10rem" />
        <p class="lookup-privacy">We use your address only to estimate districts for this lookup. In development mode, form submissions that store personal data are blocked. Always confirm at <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">pollfinder.sos.mn.gov</a>.</p>
        <div class="cta-row">
          <button class="btn btn-primary" type="submit">Show my districts &amp; ballot</button>
          <a class="btn btn-secondary" href="/map">Open district map</a>
        </div>
      </form>
    </section>

    <section class="section" aria-label="Local priority seats">
      <div class="section-head">
        <h2 class="section-title">Local team highlighted by this project</h2>
        <a class="section-link" href="/candidates">View all filed candidates →</a>
      </div>
      <p class="muted" style="margin-top:0">These three local races are this volunteer project’s organizing focus. Other parties and offices remain fully listed on the candidates page. Labels are project recommendations—not official endorsements by a political committee.</p>
      <div class="grid">
        <article class="cand-card">
          <span class="badge supported">Supported by this volunteer project</span>
          <p class="cand-office">Minnesota State Senate · District 33</p>
          <h3>Karin Housley</h3>
          <span class="tag-gop">Republican</span>
          <p class="cand-desc">Listed for the full Senate District&nbsp;33—every community equally. Verify filing at the Secretary of State.</p>
          ${areaDetails("sd33")}
          <div class="cand-actions">
            <a class="btn btn-primary btn-sm" href="/candidates#race-stateSenate33">Race details</a>
            <a class="btn btn-secondary btn-sm" href="/volunteer?focus=housley">Volunteer</a>
          </div>
        </article>
        <article class="cand-card">
          <span class="badge supported">Supported by this volunteer project</span>
          <p class="cand-office">Minnesota House · District 33A</p>
          <h3>Stacey Stout</h3>
          <span class="tag-gop">Republican</span>
          <p class="cand-desc">Listed for the full House District&nbsp;33A. Verify filing at the Secretary of State.</p>
          ${areaDetails("hd33a")}
          <div class="cand-actions">
            <a class="btn btn-primary btn-sm" href="/candidates#race-house33A">Race details</a>
            <a class="btn btn-secondary btn-sm" href="/volunteer?focus=stout">Volunteer</a>
          </div>
        </article>
        <article class="cand-card">
          <span class="badge supported">Supported by this volunteer project</span>
          <p class="cand-office">Minnesota House · District 33B</p>
          <h3>Jessica L. Johnson</h3>
          <span class="tag-gop">Republican</span>
          <p class="cand-desc">Listed for the full House District&nbsp;33B. Verify filing at the Secretary of State.</p>
          ${areaDetails("hd33b")}
          <div class="cand-actions">
            <a class="btn btn-primary btn-sm" href="/candidates#race-house33B">Race details</a>
            <a class="btn btn-secondary btn-sm" href="/volunteer?focus=johnson">Volunteer</a>
          </div>
        </article>
      </div>
    </section>

    <section class="section" aria-label="Upcoming events">
      <div class="section-head">
        <h2 class="section-title">Next events</h2>
        <a class="section-link" href="/events">Full calendar →</a>
      </div>
      <div class="grid">${eventCards}</div>
    </section>

    <section class="section" aria-label="How to help">
      <div class="section-head">
        <h2 class="section-title">Choose how to help</h2>
      </div>
      <p class="muted" style="margin-top:0">Pick one activity. You’ll land on a short volunteer path—submissions stay closed while this site is in development preview.</p>
      <div class="help-grid">
        <a class="help-tile" href="/volunteer?activity=doors"><strong>Knock doors</strong><span>Walk lists &amp; neighborhood routes</span></a>
        <a class="help-tile" href="/volunteer?activity=events"><strong>Community events</strong><span>Parades, festivals, greeters</span></a>
        <a class="help-tile" href="/volunteer?activity=phones"><strong>Make calls</strong><span>Phone banks when lists are ready</span></a>
        <a class="help-tile" href="/volunteer?activity=lit"><strong>Literature</strong><span>Lit drops &amp; pack prep</span></a>
        <a class="help-tile" href="/volunteer?activity=team_lead"><strong>Lead a small team</strong><span>Host or captain nearby</span></a>
        <a class="help-tile" href="/volunteer?activity=signs"><strong>Yard signs</strong><span>Busy streets with permission</span></a>
      </div>
    </section>

    <section class="section" aria-label="District facts snapshot">
      <div class="section-head">
        <h2 class="section-title">District facts snapshot</h2>
        <a class="section-link" href="/district-facts">Full District Facts →</a>
      </div>
      <div class="facts-grid">
        <div class="fact-tile"><strong>One Senate, two House seats</strong><p>SD&nbsp;33 includes HD&nbsp;33A and HD&nbsp;33B. Local candidates serve whole districts, not a single town.</p></div>
        <div class="fact-tile"><strong>Communities served</strong><p>Bayport, Dellwood, Forest Lake, Grant, Hugo, Mahtomedi, Marine on St.&nbsp;Croix, May Township, Oak Park Heights, Scandia, Stillwater, Stillwater Township, Willernie.</p></div>
        <div class="fact-tile"><strong>Primary &amp; general</strong><p>State primary Aug&nbsp;11, 2026 · General election Nov&nbsp;3, 2026 (verify on SOS calendars).</p></div>
        <div class="fact-tile"><strong>Official ballot tools</strong><p><a href="https://myballotmn.sos.mn.gov/" target="_blank" rel="noopener">What's on My Ballot</a> and <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">poll finder</a> control.</p></div>
        <div class="fact-tile"><strong>Competitive local turf</strong><p>Recent cycles have been close in parts of this district. See methodology on District Facts—no invented vote totals on this page.</p></div>
      </div>
    </section>

    <section class="section transparency-panel" aria-label="Transparency">
      <h2>Transparency</h2>
      <ul>
        <li>This Field Hub is <strong>volunteer-built</strong> and currently in private development.</li>
        <li><strong>Official facts</strong> (filings, precincts, ballots) should be confirmed with the Minnesota Secretary of State.</li>
        <li><strong>Project recommendations</strong> (which local races we organize around) are labeled separately from neutral directories.</li>
        <li><strong>All filed parties</strong> we have on file are viewable on the candidates page—not only Republicans.</li>
        <li>Corrections are welcome via <a href="/corrections">Corrections</a> and <a href="/review">Feedback</a>.</li>
      </ul>
    </section>

    <section class="section final-cta" aria-label="Final call to action">
      <h2>Choose one way to help your community</h2>
      <p class="muted">Start with your ballot, then pick a volunteer activity or an event when you’re ready.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/volunteer">Volunteer</a>
        <a class="btn btn-secondary" href="/events">Find an event</a>
      </div>
    </section>

    <div class="mobile-sticky-cta" role="navigation" aria-label="Quick actions">
      <a class="btn btn-primary" href="#find-address">Find Ballot</a>
      <a class="btn btn-secondary" href="/volunteer">Volunteer</a>
      <a class="btn btn-secondary" href="/events">Events</a>
    </div>
  `;
  sendPage(req, res, "Home", body, { bodyClass: "page-home has-mobile-cta" });
});

/* ---------- Candidates ---------- */
app.get("/candidates", (req, res) => {
  const data = loadCandidates();
  const races = data.races || {};
  const order = [
    { key: "stateSenate33", group: "local", level: "local" },
    { key: "house33A", group: "local", level: "local" },
    { key: "house33B", group: "local", level: "local" },
    { key: "governor", group: "statewide", level: "state" },
    { key: "usSenate", group: "statewide", level: "federal" },
    { key: "usHouse4", group: "federal", level: "federal" },
    { key: "usHouse8", group: "federal", level: "federal" },
    { key: "secretaryOfState", group: "statewide", level: "state" },
    { key: "stateAuditor", group: "statewide", level: "state" },
    { key: "attorneyGeneral", group: "statewide", level: "state" },
    { key: "countySheriff", group: "county", level: "county" },
    { key: "judge10th38", group: "judicial", level: "judicial" },
  ];
  const supported = new Set(["Karin Housley", "Stacey Stout", "Jessica L. Johnson"]);

  function partyLabel(p) {
    const u = String(p || "").toUpperCase();
    if (u === "GOP" || u === "REPUBLICAN" || u === "R") return "Republican";
    if (u === "DFL" || u.includes("DEMOCRATIC")) return "DFL";
    if (u === "NONPARTISAN" || u === "NP") return "Nonpartisan";
    return p || "Other";
  }
  function partyBadgeHtml(p) {
    const u = String(p || "").toUpperCase();
    if (u === "GOP" || u === "REPUBLICAN" || u === "R") return '<span class="tag-gop">Republican</span>';
    if (u === "DFL" || u.includes("DEMOCRATIC")) return '<span class="badge dfl">DFL</span>';
    if (u === "NONPARTISAN" || u === "NP") return '<span class="badge other">Nonpartisan</span>';
    return `<span class="badge other">${esc(partyLabel(p))}</span>`;
  }

  let totalCards = 0;
  const sections = order
    .map(({ key, group, level }) => {
      const r = races[key];
      if (!r) return "";
      const rows = [];
      const pushSide = (arr, side) => {
        (arr || []).forEach((c) => {
          totalCards += 1;
          const isSup = supported.has(c.name);
          const party = c.party || (side === "gop" ? "GOP" : "");
          const search = [c.name, r.office, partyLabel(party), r.scope, c.note || ""].join(" ").toLowerCase();
          rows.push(`
            <article class="cand-directory-card"
              data-name="${esc(c.name).toLowerCase()}"
              data-party="${esc(partyLabel(party)).toLowerCase()}"
              data-office="${esc(r.office).toLowerCase()}"
              data-level="${esc(level)}"
              data-district="${esc(key)}"
              data-search="${esc(search)}"
              data-supported="${isSup ? "1" : "0"}">
              <div class="cand-directory-meta">
                ${partyBadgeHtml(party)}
                ${isSup ? '<span class="badge supported">Supported by this volunteer project</span>' : ""}
              </div>
              <div class="name">${esc(c.name)}</div>
              <div class="muted" style="font-size:0.9rem">${esc(r.office)}</div>
              ${c.note ? `<div class="muted" style="font-size:0.88rem">${esc(c.note)}</div>` : ""}
              <div class="muted" style="font-size:0.82rem;margin-top:0.35rem">Last verified in file: ${esc(data.asOf || "—")} · <a href="https://candidates.sos.mn.gov/" target="_blank" rel="noopener">Official SOS source</a></div>
            </article>`);
        });
      };
      pushSide(r.gop, "gop");
      pushSide(r.other, "other");
      if (!rows.length) return "";
      return `
      <section class="race-group" id="race-${esc(key)}" data-group="${esc(group)}">
        <h2>${esc(r.office)}${r.winSeat ? ' <span class="badge pri">Local priority</span>' : ""}</h2>
        <p class="muted" style="margin-top:0">${esc(r.scope || "")}</p>
        ${r.districtKey ? areaListHtml(r.districtKey) : ""}
        <div class="cand-dir-grid">${rows.join("")}</div>
      </section>`;
    })
    .join("");

  const officeOptions = order
    .map(({ key }) => (races[key] ? `<option value="${esc(key)}">${esc(races[key].office)}</option>` : ""))
    .join("");

  const body = `
    <header class="page-intro">
      <h1>Candidate directory</h1>
      <p>Search and filter candidates from our public file (as of <strong>${esc(data.asOf)}</strong>). All parties on file are listed. Always verify at <a href="https://candidates.sos.mn.gov/" target="_blank" rel="noopener">candidates.sos.mn.gov</a>.</p>
    </header>

    <div class="filter-bar" role="search" aria-label="Filter candidates">
      <label>Search<input type="search" id="cand-q" placeholder="Name or office" autocomplete="off" /></label>
      <label>Office
        <select id="cand-office">
          <option value="">All offices</option>
          ${officeOptions}
        </select>
      </label>
      <label>Level
        <select id="cand-level">
          <option value="">All levels</option>
          <option value="local">Local (SD/HD)</option>
          <option value="state">Statewide</option>
          <option value="federal">Federal</option>
          <option value="county">County</option>
          <option value="judicial">Judicial</option>
        </select>
      </label>
      <label>Party
        <select id="cand-party">
          <option value="">All parties</option>
          <option value="republican">Republican</option>
          <option value="dfl">DFL</option>
          <option value="nonpartisan">Nonpartisan</option>
        </select>
      </label>
      <button type="button" class="btn btn-secondary btn-sm" id="cand-clear">Clear filters</button>
      <span class="filter-result-count" id="cand-count" aria-live="polite">${totalCards} candidates</span>
    </div>

    <p class="muted">${esc(data.note || "")}</p>
    ${sections}
    <p class="muted" style="margin-top:1.5rem">Primary Aug&nbsp;11, 2026 · General Nov&nbsp;3, 2026 (confirm on SOS calendars). This directory does not mark primary “leaders” without a cited official result.</p>
  `;

  const filterJs = `
  <script>
  (function(){
    var q = document.getElementById('cand-q');
    var office = document.getElementById('cand-office');
    var level = document.getElementById('cand-level');
    var party = document.getElementById('cand-party');
    var clear = document.getElementById('cand-clear');
    var count = document.getElementById('cand-count');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.cand-directory-card'));
    function apply(){
      var qs = (q && q.value || '').trim().toLowerCase();
      var of = office && office.value || '';
      var lv = level && level.value || '';
      var py = party && party.value || '';
      var n = 0;
      cards.forEach(function(card){
        var ok = true;
        if (qs && (card.getAttribute('data-search')||'').indexOf(qs) === -1) ok = false;
        if (of && card.getAttribute('data-district') !== of) ok = false;
        if (lv && card.getAttribute('data-level') !== lv) ok = false;
        if (py && (card.getAttribute('data-party')||'').indexOf(py) === -1) ok = false;
        card.hidden = !ok;
        if (ok) n++;
      });
      document.querySelectorAll('.race-group').forEach(function(g){
        var any = g.querySelector('.cand-directory-card:not([hidden])');
        g.hidden = !any;
      });
      if (count) count.textContent = n + ' candidate' + (n===1?'':'s');
    }
    [q, office, level, party].forEach(function(el){ if (el) { el.addEventListener('input', apply); el.addEventListener('change', apply); } });
    if (clear) clear.addEventListener('click', function(){ if(q)q.value=''; if(office)office.value=''; if(level)level.value=''; if(party)party.value=''; apply(); });
  })();
  </script>`;

  sendPage(req, res, "Candidates", body, { extraFoot: filterJs });
});

/* ---------- Carry literature form ---------- */
app.get("/carry", (req, res) => {
  const data = loadCandidates();
  const flash = req.session.flash;
  const err = req.session.err;
  delete req.session.flash;
  delete req.session.err;

  const boxes = (data.literature || [])
    .map((lit) => {
      const cls = lit.priority === 1 ? "lit-box priority" : "lit-box";
      return `<label class="${cls}">
        <input type="checkbox" name="lit" value="${esc(lit.id)}" ${lit.priority === 1 && lit.bundle === "local_three" ? "checked" : ""} />
        <span>
          <span class="lbl">${esc(lit.label)}</span>
          <div class="muted"><span class="tag-gop">${esc(lit.party)}</span> · Seat: ${esc(lit.seat)} · Bundle: ${esc(lit.bundle)}</div>
        </span>
      </label>`;
    })
    .join("");

  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    ${err ? `<div class="flash flash-err">${esc(err)}</div>` : ""}
    <section class="hero">
      <h2>What literature will you carry?</h2>
      <p>Check every piece you want to pick up. Gold-bordered boxes are <strong>priority local GOP lit</strong> for winning all three seats. Submit so captains know inventory demand.</p>
    </section>
    <form class="stack card" method="post" action="/carry">
      <label>Your name</label>
      <input type="text" name="name" required maxlength="100" />
      <label>Email</label>
      <input type="email" name="email" required maxlength="160" />
      <label>Phone</label>
      <input type="tel" name="phone" maxlength="40" />
      <label>I drop in</label>
      <select name="houseDistrict" required>
        <option value="">Select…</option>
        <option value="33A">House 33A — Dellwood, Forest Lake (P-2/4/5), Grant P-2, Hugo, Mahtomedi, Willernie</option>
        <option value="33B">House 33B — Bayport, Forest Lake (P-1/3), Marine, May Twp, Oak Park Heights, Scandia, Stillwater, Stillwater Twp</option>
        <option value="BOTH">Both 33A and 33B (full SD 33)</option>
      </select>
      <label>Town / starting area (any community in the district)</label>
      <input type="text" name="town" maxlength="80" placeholder="Any SD 33 city or township…" list="carry-towns" />
      <datalist id="carry-towns">
        <option>Bayport</option><option>Dellwood</option><option>Forest Lake</option><option>Grant</option>
        <option>Hugo</option><option>Mahtomedi</option><option>Marine on St. Croix</option><option>May Township</option>
        <option>Oak Park Heights</option><option>Scandia</option><option>Stillwater</option>
        <option>Stillwater Township</option><option>Willernie</option>
      </datalist>
      <label>Shift preference</label>
      <select name="shift">
        <option>Saturday morning</option>
        <option>Saturday afternoon</option>
        <option>Weekday evening</option>
        <option>Anytime — text me</option>
      </select>
      <label style="margin-top:1.1rem">Literature to carry <span class="tag-gop">GOP labeled</span></label>
      <p class="muted">Click the boxes for every piece you want. Captains will stage bundles at pickup.</p>
      ${boxes}
      <label>Notes (carpool, quantity, kids helping…)</label>
      <textarea name="notes" maxlength="800" rows="3"></textarea>
      <button class="btn" type="submit">Submit my lit request</button>
    </form>
    <p class="muted" style="margin-top:1rem"><a href="/candidates">Review candidate names first</a> if you are unsure which federal piece matches a door.</p>`;
  sendPage(req, res, "Choose literature", body);
});

app.post("/carry", (req, res) => {
  let lit = req.body.lit;
  if (!lit) lit = [];
  if (!Array.isArray(lit)) lit = [lit];
  if (!req.body.name || !req.body.email) {
    req.session.err = "Name and email are required.";
    return res.redirect("/carry");
  }
  if (lit.length === 0) {
    req.session.err = "Select at least one literature piece.";
    return res.redirect("/carry");
  }
  const data = loadCandidates();
  const litMap = Object.fromEntries((data.literature || []).map((x) => [x.id, x]));
  const labels = lit.map((id) => litMap[id]?.label || id);

  const signups = loadJson(SIGNUPS);
  signups.unshift({
    id: "s_" + Date.now(),
    name: String(req.body.name).slice(0, 100),
    email: String(req.body.email).slice(0, 160),
    phone: String(req.body.phone || "").slice(0, 40),
    houseDistrict: String(req.body.houseDistrict || ""),
    town: String(req.body.town || "").slice(0, 80),
    shift: String(req.body.shift || ""),
    literatureIds: lit,
    literatureLabels: labels,
    notes: String(req.body.notes || "").slice(0, 800),
    createdAt: new Date().toISOString(),
  });
  saveJson(SIGNUPS, signups.slice(0, 2000));

  req.session.flash =
    "Thanks! Your literature request is saved. A captain will confirm pickup. You selected: " +
    labels.join("; ");
  res.redirect("/carry");
});

/* ---------- Turf ---------- */
app.get("/turf", (req, res) => {
  const body = `
    <section class="hero">
      <h2>District Turf: SD 33 = House 33A + House 33B</h2>
      <p>Every volunteer works one house district per shift when possible. Senate&nbsp;33 literature goes on <strong>every</strong> door in both halves. Communities are listed in full so no city or township is left out. Candidates serve the <strong>district</strong>, not a single hometown.</p>
    </section>
    <div class="grid">
      <article class="card">
        <h3>House District 33A — Full Area List</h3>
        <p><span class="tag-gop">GOP</span> <strong>Stacey Stout</strong> · open seat · serves all of HD&nbsp;33A</p>
        ${areaListHtml("hd33a")}
        <p style="margin-top:0.75rem"><strong>Always drop:</strong> SD&nbsp;33 Housley (GOP) + 33A house lit + sample ballot.</p>
        <p class="muted">Skip 33B house piece here unless using a combined SD&nbsp;33 slate piece.</p>
      </article>
      <article class="card">
        <h3>House District 33B — Full Area List</h3>
        <p><span class="tag-gop">GOP</span> <strong>Jessica L. Johnson</strong> · serves all of HD&nbsp;33B</p>
        ${areaListHtml("hd33b")}
        <p style="margin-top:0.75rem"><strong>Always drop:</strong> SD&nbsp;33 Housley (GOP) + 33B house lit + sample ballot.</p>
      </article>
    </div>
    <section class="card" style="margin-top:1rem">
      <h3>Senate District 33 — Full Area List</h3>
      <p><span class="tag-gop">GOP</span> <strong>Karin Housley</strong> · serves the entire Senate district (union of 33A + 33B)</p>
      ${areaListHtml("sd33")}
    </section>
    <section class="card" style="margin-top:1rem">
      <h2>Priority Order Inside a District</h2>
      <ol>
        <li>High-turnout GOP and independent precincts (persuasion + turnout)</li>
        <li>Soft DFL / swing blocks near main corridors in <em>any</em> listed community</li>
        <li>Low-propensity friendly voters (GOTV only in final weeks)</li>
      </ol>
      <p>Captains assign walk sheets across the full district list—not only the largest city. Prefer map apps or printed routes of 40–70 doors per bag.</p>
      <p><a class="btn" href="/carry">Request Literature for My District</a> <a class="btn btn-navy" href="/map">District Map</a></p>
    </section>`;
  sendPage(req, res, "District Turf", body);
});

/* ---------- How-to ---------- */
app.get("/how-to", (req, res) => {
  const body = `
    <section class="hero"><h2>How to lit drop (effective + legal)</h2></section>
    <div class="card">
      <h3>Before you leave</h3>
      <ul class="checklist">
        <li>Confirm house district (33A or 33B) on your walk sheet</li>
        <li>Carry the right <span class="tag-gop">GOP</span> pieces (use /carry checklist)</li>
        <li>Water, comfortable shoes, phone charged, highlighter for walk sheet</li>
        <li>Captain phone number saved</li>
      </ul>
      <h3>At each door (30–60 seconds)</h3>
      <ol>
        <li>Park legally; work one side of the street.</li>
        <li>Leave lit on door handle / between doors / on porch — <strong>never in the mailbox</strong>.</li>
        <li>If someone answers: “Hi, I’m a neighbor volunteer leaving information on Karin Housley and our local house candidate — thank you!” Hand piece; do not debate.</li>
        <li>Mark: dropped / not home / refused / no access.</li>
      </ol>
      <h3>After the shift</h3>
      <ul class="checklist">
        <li>Return leftover lit and walk sheet</li>
        <li>Text captain doors completed</li>
        <li>Log on <a href="/leaderboard">Team progress</a> if asked</li>
      </ul>
      <h3>Winning habits</h3>
      <ul>
        <li>Same streets get 2–3 touches over the cycle</li>
        <li>Pair lit drop with a short canvass in peak weeks on soft IDs</li>
        <li>Early vote cards from mid-September onward</li>
      </ul>
    </div>`;
  sendPage(req, res, "How to drop", body);
});

/* ---------- Leaderboard / progress ---------- */
app.get("/leaderboard", (req, res) => {
  const signups = loadJson(SIGNUPS);
  const logs = loadJson(STATS);
  const litDemand = {};
  for (const s of signups) {
    for (const label of s.literatureLabels || []) {
      litDemand[label] = (litDemand[label] || 0) + 1;
    }
  }
  const demandRows = Object.entries(litDemand)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`)
    .join("");

  const recent = signups
    .slice(0, 15)
    .map(
      (s) =>
        `<tr>
          <td>${esc(s.name)}</td>
          <td>${esc(s.houseDistrict)}</td>
          <td>${esc(s.town)}</td>
          <td class="muted">${esc((s.literatureLabels || []).join("; ").slice(0, 120))}</td>
        </tr>`
    )
    .join("");

  const body = `
    <section class="hero">
      <h2>Team progress</h2>
      <p><strong>${signups.length}</strong> lit requests · <strong>${logs.length}</strong> completed drop logs</p>
    </section>
    <div class="two">
      <div class="card">
        <h3>Literature demand (volunteer selections)</h3>
        <table>
          <thead><tr><th>Piece</th><th>Requests</th></tr></thead>
          <tbody>${demandRows || "<tr><td colspan=2>No requests yet — be the first on /carry</td></tr>"}</tbody>
        </table>
      </div>
      <div class="card">
        <h3>Log a completed drop</h3>
        <form class="stack" method="post" action="/log-drop">
          <label>Name</label>
          <input name="name" required />
          <label>House district</label>
          <select name="houseDistrict"><option>33A</option><option>33B</option></select>
          <label>Doors covered</label>
          <input name="doors" type="text" required placeholder="e.g. 55" />
          <label>Pieces left (approx)</label>
          <input name="pieces" type="text" placeholder="e.g. 60" />
          <button class="btn" type="submit">Log drop</button>
        </form>
      </div>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Recent lit requests</h3>
      <table>
        <thead><tr><th>Volunteer</th><th>HD</th><th>Town</th><th>Lit chosen</th></tr></thead>
        <tbody>${recent || "<tr><td colspan=4>None yet</td></tr>"}</tbody>
      </table>
    </div>`;
  sendPage(req, res, "Progress", body);
});

app.post("/log-drop", (req, res) => {
  const logs = loadJson(STATS);
  logs.unshift({
    id: "d_" + Date.now(),
    name: String(req.body.name || "").slice(0, 100),
    houseDistrict: String(req.body.houseDistrict || ""),
    doors: String(req.body.doors || "").slice(0, 20),
    pieces: String(req.body.pieces || "").slice(0, 20),
    at: new Date().toISOString(),
  });
  saveJson(STATS, logs.slice(0, 2000));
  req.session.flash = "Drop logged. Thank you!";
  res.redirect("/leaderboard");
});

app.get("/api/health", (req, res) => {
  const contacts = loadContacts().contacts || [];
  res.json({
    ok: true,
    site: "sd33-litdrop",
    port: PORT,
    signups: loadJson(SIGNUPS).length,
    contacts: contacts.length,
    demoContacts: contacts.filter((c) => c.isDemo).length,
  });
});

/* ========== FIELD: doors, phones, signs, streets ========== */

app.get("/field", (req, res) => {
  const contacts = loadContacts().contacts || [];
  const thorough = loadJson(THOROUGH_FILE);
  const polls = loadJson(POLLS_FILE);
  const nearPoll = contacts.filter((c) => c.nearPollingPlace).length;
  const gop = contacts.filter((c) => partyClass(c.partyAffiliation) === "GOP").length;
  const body = `
    <section class="hero">
      <span class="badge pri">Field operations</span>
      <h2>Door knocks · Phone banks · Yard signs</h2>
      <p>Prioritize <strong>busy MnDOT / county thoroughfares</strong> and <strong>streets near polling places</strong>. Contact lists show <strong>name, address, phone, party affiliation</strong> when imported from your authorized voter file.</p>
      <p class="muted">${contacts.length} contacts loaded (${contacts.filter((c) => c.isDemo).length} demo placeholders — replace via import).</p>
    </section>
    <div class="grid">
      <article class="card">
        <h3>1. Door knocking (primary)</h3>
        <p>Highest impact for winning SD 33 + 33A + 33B. <strong>Walk lists use Pulsar</strong> — request access and meet a candidate campaign for your login.</p>
        <p><strong style="color:var(--gop)">Busy street + interested → ask for sign location!</strong></p>
        <p><a class="btn btn-gold" href="/pulsar">Get on Pulsar</a>
        <a class="btn" href="/field/doors">Door tips + sign form</a></p>
      </article>
      <article class="card">
        <h3>2. Yard signs</h3>
        <p>Private yards on Hwy 36, Hwy 95, Manning Ave, CR 96, Forest Lake arterials + every polling approach.</p>
        <p>Log <strong>sign location, person spoken to, contact</strong> on the form.</p>
        <p><a class="btn" href="/field/signs">Sign lists + ask form</a></p>
        <p><a class="btn btn-navy" href="/team/sign-asks">View sign asks</a></p>
      </article>
      <article class="card">
        <h3>3. Phone calling</h3>
        <p>Call GOP / UNK with phones on file. Reinforce doors and early vote. Log results.</p>
        <p><a class="btn" href="/field/phones">Phone bank lists</a></p>
      </article>
      <article class="card">
        <h3>Busy streets (DOT + county)</h3>
        <p>${(thorough.corridors || []).length} priority corridors from MnDOT trunk highways &amp; Washington County CSAH routes.</p>
        <p><a class="btn btn-navy" href="/field/streets">Corridor map list</a></p>
      </article>
      <article class="card">
        <h3>Polling places</h3>
        <p>${(polls.electionDay || []).length} Election Day sites + ${(polls.earlyVoteCenters || []).length} early-vote centers listed.</p>
        <p><a class="btn btn-navy" href="/field/polls">Poll &amp; radius plan</a></p>
      </article>
      <article class="card">
        <h3>Import real homeowners</h3>
        <p>CSV: name, address, phone, partyAffiliation (GOP/DFL/NP/UNK), houseDistrict, near poll…</p>
        <p><a class="btn btn-navy" href="/field/import">Import contacts</a></p>
      </article>
    </div>
    <section class="card" style="margin-top:1rem">
      <h2>Win emphasis (order of operations)</h2>
      <ol>
        <li><strong>Signs</strong> on major thoroughfares + poll approaches (visibility before anyone knocks).</li>
        <li><strong>Doors</strong> on residential streets within ~0.5 mile of each polling place (every weekend).</li>
        <li><strong>Doors</strong> on side streets off Hwy 36, Hwy 95, Manning, CR 96, Forest Lake arterials.</li>
        <li><strong>Phones</strong> to GOP/leaners with numbers; chase early vote mid-Sept onward.</li>
        <li><strong>Re-knock</strong> soft IDs; final week poll-adjacent only for GOTV.</li>
      </ol>
      <p class="muted">Stats snapshot: ${nearPoll} contacts tagged near a poll · ${gop} tagged GOP · verify affiliation from voter file.</p>
    </section>`;
  sendPage(req, res, "Field HQ", body);
});

app.get("/field/doors", (req, res) => {
  const data = loadContacts();
  const q = {
    hd: req.query.hd || "",
    party: req.query.party || "",
    corridor: req.query.corridor || "",
    pollOnly: req.query.pollOnly || "",
    q: req.query.q || "",
  };
  let rows = filterContacts(data.contacts || [], q);
  // Door list: prefer high doorPriority; optional poll-first default sort already by doorPriority
  if (req.query.pollFirst === "1") {
    rows = rows.slice().sort((a, b) => {
      const ap = a.nearPollingPlace ? 1 : 0;
      const bp = b.nearPollingPlace ? 1 : 0;
      return bp - ap || (Number(b.doorPriority) || 0) - (Number(a.doorPriority) || 0);
    });
  }
  const thorough = loadJson(THOROUGH_FILE);
  const corridorOpts = (thorough.corridors || [])
    .map((c) => `<option value="${esc(c.id)}" ${q.corridor === c.id ? "selected" : ""}>${esc(c.name)}</option>`)
    .join("");

  const flash = req.session.flash;
  delete req.session.flash;
  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <section class="hero">
      <h2>Door knocking lists</h2>
      <p><strong>Emphasize:</strong> (1) homes near polling places, (2) residential blocks off the busiest thoroughfares. Leave lit + ID support. Never put lit in mailboxes.</p>
      <p><strong style="color:var(--gop)">On a busy street + interested in a candidate → ask for a yard sign location!</strong></p>
      <p><strong>Walk lists run in Pulsar.</strong> Request access and meet a candidate campaign to get on Pulsar before your first solo shift.</p>
      <p><a class="btn btn-gold" href="/pulsar">Get on Pulsar</a>
      <a class="btn btn-navy" href="/schedule">Door shifts</a></p>
      <p class="muted">${esc(data.disclaimer || "")}</p>
    </section>
    ${signAskCalloutAndForm({ redirect: "/field/doors" })}
    <form class="card" method="get" action="/field/doors" style="margin-bottom:1rem">
      <div class="grid" style="align-items:end">
        <div>
          <label><strong>House district</strong></label>
          <select name="hd">
            <option value="">All</option>
            <option value="33A" ${q.hd === "33A" ? "selected" : ""}>33A</option>
            <option value="33B" ${q.hd === "33B" ? "selected" : ""}>33B</option>
          </select>
        </div>
        <div>
          <label><strong>Party</strong></label>
          <select name="party">
            <option value="">All</option>
            <option value="GOP" ${q.party === "GOP" ? "selected" : ""}>GOP</option>
            <option value="DFL" ${q.party === "DFL" ? "selected" : ""}>DFL</option>
            <option value="NP" ${q.party === "NP" ? "selected" : ""}>NP / Independent</option>
            <option value="UNK" ${q.party === "UNK" ? "selected" : ""}>Unknown</option>
          </select>
        </div>
        <div>
          <label><strong>Corridor</strong></label>
          <select name="corridor"><option value="">All streets</option>${corridorOpts}</select>
        </div>
        <div>
          <label><strong>Near poll only</strong></label>
          <select name="pollOnly">
            <option value="">No</option>
            <option value="1" ${q.pollOnly === "1" ? "selected" : ""}>Yes — poll radius first</option>
          </select>
        </div>
        <div>
          <label><strong>Search</strong></label>
          <input type="text" name="q" value="${esc(q.q)}" placeholder="name or street" />
        </div>
        <div>
          <button class="btn" type="submit">Filter doors</button>
          <a class="btn btn-navy" href="/field/doors?pollOnly=1&pollFirst=1">Poll-adjacent only</a>
        </div>
      </div>
    </form>
    <div class="card">
      <p><strong>${rows.length}</strong> households · sorted by door priority</p>
      ${contactTable(rows)}
      <form method="post" action="/field/log" class="stack" style="margin-top:1rem">
        <input type="hidden" name="activity" value="door" />
        <label>Log this shift (name · doors attempted · IDs)</label>
        <input name="volunteer" placeholder="Your name" required />
        <input name="count" placeholder="Doors attempted e.g. 48" />
        <input name="result" placeholder="e.g. 12 support, 20 NH, 5 refuse" />
        <button class="btn" type="submit">Log door shift</button>
      </form>
    </div>
    <p class="muted" style="margin-top:1rem">Print this page for walk sheets, or export via import reverse (copy table). Best practice: walk poll rings first on Saturdays.</p>`;
  sendPage(req, res, "Door knocks", body);
});

app.get("/field/phones", (req, res) => {
  const data = loadContacts();
  const q = {
    hd: req.query.hd || "",
    party: req.query.party || "GOP",
    q: req.query.q || "",
  };
  let rows = filterContacts(data.contacts || [], q);
  // Prefer contacts with phone numbers when real data exists
  rows = rows
    .slice()
    .sort(
      (a, b) =>
        (Number(b.phonePriority) || 0) - (Number(a.phonePriority) || 0) ||
        (b.phone ? 1 : 0) - (a.phone ? 1 : 0)
    );

  const body = `
    <section class="hero">
      <h2>Phone calling lists</h2>
      <p>Call <span class="tag-gop">GOP</span> and unknowns with phones on file. Script: intro → ballot ID (Housley + house candidate) → early vote ask → thank you. Do not call numbers not on your authorized list.</p>
    </section>
    <form class="card" method="get" action="/field/phones" style="margin-bottom:1rem">
      <div class="grid">
        <div>
          <label><strong>House district</strong></label>
          <select name="hd">
            <option value="">All</option>
            <option value="33A" ${q.hd === "33A" ? "selected" : ""}>33A</option>
            <option value="33B" ${q.hd === "33B" ? "selected" : ""}>33B</option>
          </select>
        </div>
        <div>
          <label><strong>Party filter</strong></label>
          <select name="party">
            <option value="">All</option>
            <option value="GOP" ${q.party === "GOP" ? "selected" : ""}>GOP</option>
            <option value="UNK" ${q.party === "UNK" ? "selected" : ""}>Unknown</option>
            <option value="NP" ${q.party === "NP" ? "selected" : ""}>NP/I</option>
            <option value="DFL" ${q.party === "DFL" ? "selected" : ""}>DFL</option>
          </select>
        </div>
        <div>
          <label><strong>Search</strong></label>
          <input name="q" value="${esc(q.q)}" />
        </div>
        <div><button class="btn" type="submit">Filter phones</button></div>
      </div>
    </form>
    <div class="card">
      <p><strong>${rows.length}</strong> records · phones appear after you import voter/phone-appended file</p>
      ${contactTable(rows, { showPhone: true })}
      <h3>Call script (30 sec)</h3>
      <ol>
        <li>“Hi, I’m a volunteer with the SD 33 team — is this [name]?”</li>
        <li>“We’re reminding neighbors about Karin Housley for Senate and our house candidate in [33A/33B].”</li>
        <li>“Can we count on your support? Will you vote early if you can?”</li>
        <li>Mark: support / undecided / oppose / wrong number / NH.</li>
      </ol>
      <form method="post" action="/field/log" class="stack">
        <input type="hidden" name="activity" value="phone" />
        <input name="volunteer" placeholder="Your name" required />
        <input name="count" placeholder="Calls attempted" />
        <input name="result" placeholder="Results summary" />
        <button class="btn" type="submit">Log phone shift</button>
      </form>
    </div>`;
  sendPage(req, res, "Phone lists", body);
});

app.get("/field/signs", (req, res) => {
  const signs = loadJson(SIGNS_FILE);
  const thorough = loadJson(THOROUGH_FILE);
  const contacts = (loadContacts().contacts || []).filter(
    (c) => c.signOk === "yes" || c.signOk === "ask"
  );
  const byPri = (signs.locations || []).slice().sort((a, b) => b.priority - a.priority);

  const locRows = byPri
    .map(
      (s) => `<tr>
        <td>${s.priority}</td>
        <td><strong>${esc(s.label)}</strong><div class="muted">${esc(s.type)}</div></td>
        <td>${esc(s.addressFocus)}</td>
        <td>${esc(s.houseDistrict)}</td>
        <td>${esc(s.action)}</td>
      </tr>`
    )
    .join("");

  const corridorSign = (thorough.corridors || [])
    .slice()
    .sort((a, b) => b.signPriority - a.signPriority)
    .map(
      (c) => `<tr>
        <td>${c.signPriority}</td>
        <td><strong>${esc(c.name)}</strong><div class="muted">${esc(c.source)}</div></td>
        <td>${esc((c.towns || []).join(", "))}</td>
        <td>${esc((c.houseDistricts || []).join(", "))}</td>
        <td class="muted">${esc(c.signTip)}</td>
      </tr>`
    )
    .join("");

  const flash = req.session.flash;
  delete req.session.flash;
  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <section class="hero">
      <h2>Yard sign lists — polls + major thoroughfares</h2>
      <p>Put signs where cars and voters already go: <strong>MnDOT highways, county arterials, and every polling-place approach</strong>. Always private property with permission.</p>
      <p><strong style="color:var(--gop)">If on a busy street and they like a candidate — ask for a sign location, then log person + contact below.</strong></p>
      <ul>${(signs.rules || []).map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
    </section>
    ${signAskCalloutAndForm({ redirect: "/field/signs" })}
    <div class="card">
      <h3>Priority sign locations (polls + early vote + corridors)</h3>
      <table>
        <thead><tr><th>Pri</th><th>Location</th><th>Address focus</th><th>HD</th><th>Action</th></tr></thead>
        <tbody>${locRows}</tbody>
      </table>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Busiest streets for signs (DOT / county data)</h3>
      <table>
        <thead><tr><th>Sign pri</th><th>Corridor</th><th>Towns</th><th>HD</th><th>Tip</th></tr></thead>
        <tbody>${corridorSign}</tbody>
      </table>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Homeowners to ask for signs (from contact file)</h3>
      <p class="muted">Filtered to signOk = yes or ask. Import real names/phones for this list to work fully.</p>
      ${contactTable(contacts)}
      <form method="post" action="/field/log" class="stack" style="margin-top:1rem">
        <input type="hidden" name="activity" value="sign" />
        <input name="volunteer" placeholder="Your name" required />
        <input name="count" placeholder="Signs placed" />
        <input name="result" placeholder="Locations e.g. Manning x3, Hwy95 gateway x2" />
        <button class="btn" type="submit">Log sign placement</button>
      </form>
    </div>`;
  sendPage(req, res, "Sign lists", body);
});

app.get("/field/streets", (req, res) => {
  const thorough = loadJson(THOROUGH_FILE);
  const cards = (thorough.corridors || [])
    .slice()
    .sort((a, b) => b.busyScore - a.busyScore)
    .map(
      (c) => `<article class="card">
        <h3>${esc(c.name)}</h3>
        <p><span class="tag-gop">Busy ${c.busyScore}/10</span>
          · Door pri ${c.doorPriority} · Sign pri ${c.signPriority}</p>
        <p class="muted">Source: ${esc(c.source)} · HD ${(c.houseDistricts || []).map(esc).join(", ")}</p>
        <p><strong>Towns:</strong> ${esc((c.towns || []).join(", "))}</p>
        <p><strong>Segments / addresses focus:</strong></p>
        <ul>${(c.segments || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        <p>${esc(c.signTip)}</p>
        <p><a class="btn btn-navy" href="/field/doors?corridor=${esc(c.id)}">Door list on this corridor</a></p>
      </article>`
    )
    .join("");

  const body = `
    <section class="hero">
      <h2>Busiest streets — MnDOT &amp; county databases</h2>
      <p>${esc(thorough.source)}</p>
      <ul>${(thorough.priorityNotes || []).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    </section>
    <div class="grid">${cards}</div>
    <p class="muted">Cross-check traffic counts on MnDOT maps and Washington County transportation pages before large sign buys.</p>`;
  sendPage(req, res, "Busy streets", body);
});

app.get("/field/polls", (req, res) => {
  const polls = loadJson(POLLS_FILE);
  const early = (polls.earlyVoteCenters || [])
    .map(
      (p) => `<tr>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.address)}</td>
        <td>${esc(p.houseDistrictHint || "")}</td>
        <td class="muted">${esc(p.signRadiusNote || "")}</td>
      </tr>`
    )
    .join("");
  const day = (polls.electionDay || [])
    .map(
      (p) => `<tr>
        <td>${p.doorPriority || 10}</td>
        <td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.precinct)}</div></td>
        <td>${esc(p.address)}</td>
        <td>${esc(p.houseDistrict)}</td>
        <td>${esc((p.nearbyStreets || []).join(", "))}</td>
        <td><a href="/field/doors?pollOnly=1&hd=${esc(p.houseDistrict)}">Doors</a></td>
      </tr>`
    )
    .join("");

  const body = `
    <section class="hero">
      <h2>Polling places — door &amp; sign radius</h2>
      <p>${esc(polls.source)}</p>
      <p class="muted">${esc(polls.note || "")}</p>
    </section>
    <div class="card">
      <h3>Early vote centers (sign + lit from day one of early voting)</h3>
      <table>
        <thead><tr><th>Site</th><th>Address</th><th>Area</th><th>Sign plan</th></tr></thead>
        <tbody>${early}</tbody>
      </table>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Election Day polling places — knock &amp; sign first</h3>
      <table>
        <thead><tr><th>Pri</th><th>Polling place</th><th>Address</th><th>HD</th><th>Nearby streets</th><th></th></tr></thead>
        <tbody>${day}</tbody>
      </table>
    </div>
    <p><a class="btn" href="/field/doors?pollOnly=1">All poll-adjacent door contacts</a>
    <a class="btn btn-navy" href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">SOS Pollfinder</a></p>`;
  sendPage(req, res, "Polling places", body);
});

app.get("/field/import", (req, res) => {
  const data = loadContacts();
  const flash = req.session.flash;
  const err = req.session.err;
  delete req.session.flash;
  delete req.session.err;
  const headers = (data.importFormat && data.importFormat.csvHeaders) || [];

  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    ${err ? `<div class="flash flash-err">${esc(err)}</div>` : ""}
    <section class="hero">
      <h2>Import homeowners / voters</h2>
      <p>Upload authorized list data: <strong>name, address, phone, party affiliation</strong>, house district, corridor, near poll. This replaces or merges into the contact file used by doors, phones, and signs.</p>
      <p class="muted">${esc(data.disclaimer)}</p>
    </section>
    <div class="two">
      <div class="card">
        <h3>Paste CSV</h3>
        <p class="muted">Header row required:<br/><code style="font-size:0.75rem">${esc(headers.join(","))}</code></p>
        <form method="post" action="/field/import" class="stack">
          <label>Mode</label>
          <select name="mode">
            <option value="replace">Replace all contacts</option>
            <option value="merge">Merge by address (add/update)</option>
          </select>
          <label>CSV text</label>
          <textarea name="csv" rows="12" required placeholder="name,address,city,..."></textarea>
          <button class="btn" type="submit">Import contacts</button>
        </form>
        <p><a href="/data/contacts_import_template.csv">Download template CSV</a> (place file in browser via static path if served)</p>
      </div>
      <div class="card">
        <h3>Where to get real data</h3>
        <ul>
          <li>Minnesota political party / caucus voter file export</li>
          <li>NGP VAN / PDI / similar campaign CRM walk lists</li>
          <li>Phone append vendors used by campaigns (lawful use only)</li>
          <li>Volunteer-collected sign permission forms (name + phone + address)</li>
        </ul>
        <p><strong>Party codes:</strong> GOP, DFL, NP, UNK</p>
        <p><strong>streetCorridor ids:</strong> th36, th95, cr96, csah15, csah5, forest_lake_arterials, bayport_marine</p>
        <p>Template file on disk: <code>data/contacts_import_template.csv</code></p>
      </div>
    </div>`;
  sendPage(req, res, "Import contacts", body);
});

app.post("/field/import", (req, res) => {
  const raw = String(req.body.csv || "").trim();
  if (!raw) {
    req.session.err = "Paste CSV content first.";
    return res.redirect("/field/import");
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    req.session.err = "Need header + at least one data row.";
    return res.redirect("/field/import");
  }
  function parseLine(line) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === "," && !inQ) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }
  const headers = parseLine(lines[0]).map((h) => h.trim());
  const required = ["name", "address"];
  for (const r of required) {
    if (!headers.includes(r)) {
      req.session.err = `Missing required column: ${r}`;
      return res.redirect("/field/import");
    }
  }
  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (!cols.length || cols.every((c) => !c)) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || "";
    });
    parsed.push({
      id: "c_" + Date.now() + "_" + i,
      name: row.name,
      address: row.address,
      city: row.city || "",
      zip: row.zip || "",
      phone: row.phone || "",
      email: row.email || "",
      partyAffiliation: (row.partyAffiliation || "UNK").toUpperCase(),
      houseDistrict: row.houseDistrict || "",
      precinct: row.precinct || "",
      streetCorridor: row.streetCorridor || "",
      nearPollingPlace: row.nearPollingPlace || "",
      doorPriority: Number(row.doorPriority) || 5,
      phonePriority: Number(row.phonePriority) || 5,
      signOk: row.signOk || "ask",
      notes: row.notes || "",
      isDemo: false,
    });
  }
  if (!parsed.length) {
    req.session.err = "No data rows parsed.";
    return res.redirect("/field/import");
  }
  const file = loadContacts();
  if (req.body.mode === "merge") {
    const map = new Map();
    for (const c of file.contacts || []) {
      map.set((c.address + "|" + c.city).toLowerCase(), c);
    }
    for (const c of parsed) {
      map.set((c.address + "|" + c.city).toLowerCase(), c);
    }
    file.contacts = Array.from(map.values());
  } else {
    file.contacts = parsed;
  }
  file.disclaimer =
    file.disclaimer ||
    "Imported contact data. Use only for lawful campaign purposes.";
  saveJson(CONTACTS_FILE, file);
  req.session.flash = `Imported ${parsed.length} contacts (${req.body.mode || "replace"}).`;
  res.redirect("/field/doors");
});

app.post("/field/log", (req, res) => {
  const logs = loadJson(FIELD_LOG);
  logs.unshift({
    id: "f_" + Date.now(),
    activity: String(req.body.activity || ""),
    volunteer: String(req.body.volunteer || "").slice(0, 100),
    count: String(req.body.count || "").slice(0, 40),
    result: String(req.body.result || "").slice(0, 300),
    at: new Date().toISOString(),
  });
  saveJson(FIELD_LOG, logs.slice(0, 3000));
  req.session.flash = "Field activity logged.";
  const back =
    req.body.activity === "phone"
      ? "/field/phones"
      : req.body.activity === "sign"
        ? "/field/signs"
        : "/field/doors";
  res.redirect(back);
});

app.post("/field/sign-ask", (req, res) => {
  const entry = {
    id: "sa_" + Date.now(),
    at: new Date().toISOString(),
    volunteer: String(req.body.volunteer || "").slice(0, 100),
    onBusyStreet: String(req.body.onBusyStreet || ""),
    corridor: String(req.body.corridor || ""),
    interested: String(req.body.interested || ""),
    askedForSign: String(req.body.askedForSign || ""),
    signLocation: String(req.body.signLocation || "").slice(0, 200),
    city: String(req.body.city || "").slice(0, 80),
    personSpokenTo: String(req.body.personSpokenTo || "").slice(0, 120),
    contact: String(req.body.contact || "").slice(0, 160),
    candidates: String(req.body.candidates || "").slice(0, 200),
    houseDistrict: String(req.body.houseDistrict || ""),
    notes: String(req.body.notes || "").slice(0, 500),
  };
  const list = loadJson(SIGN_ASKS_FILE);
  list.unshift(entry);
  saveJson(SIGN_ASKS_FILE, list.slice(0, 5000));
  req.session.flash =
    entry.askedForSign === "yes_got" || entry.signLocation
      ? `Saved sign ask: ${entry.personSpokenTo || "contact"} @ ${entry.signLocation || "location TBD"}`
      : "Saved door conversation / sign ask.";
  let redirect = String(req.body.redirect || "/field/doors");
  if (!redirect.startsWith("/")) redirect = "/field/doors";
  res.redirect(redirect);
});

app.get("/team/sign-asks", (req, res) => {
  const list = loadJson(SIGN_ASKS_FILE);
  const yesSigns = list.filter(
    (s) => s.askedForSign === "yes_got" || (s.signLocation && s.interested === "yes")
  );
  const rows = list
    .map(
      (s) => `<tr>
        <td class="muted">${esc((s.at || "").slice(0, 16).replace("T", " "))}</td>
        <td>${esc(s.volunteer)}</td>
        <td>${s.onBusyStreet === "yes" ? '<span class="tag-gop">BUSY</span>' : "side"}</td>
        <td><strong>${esc(s.personSpokenTo)}</strong><div class="muted">${esc(s.contact || "—")}</div></td>
        <td>${esc(s.signLocation || "—")}<div class="muted">${esc(s.city || "")} ${esc(s.houseDistrict || "")}</div></td>
        <td>${esc(s.interested)} / ${esc(s.askedForSign)}</td>
        <td class="muted">${esc(s.candidates || "")} ${esc(s.notes || "")}</td>
      </tr>`
    )
    .join("");

  const body = `
    <section class="hero">
      <h2>Sign asks — person, location, contact</h2>
      <p><strong>${list.length}</strong> logged · <strong>${yesSigns.length}</strong> with interest / sign yes</p>
      <p class="muted">Rule: on a busy street + interested in candidate → ask for sign location.</p>
      <p><a class="btn" href="/field/doors">Log from doors</a> <a class="btn btn-navy" href="/field/signs">Sign lists</a></p>
    </section>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Volunteer</th>
            <th>Street</th>
            <th>Person spoken to · contact</th>
            <th>Sign location</th>
            <th>Interest / ask</th>
            <th>Candidates / notes</th>
          </tr>
        </thead>
        <tbody>${rows || "<tr><td colspan=7>None yet — use the form on Door knocks or Sign lists</td></tr>"}</tbody>
      </table>
    </div>`;
  sendPage(req, res, "Sign asks", body);
});

// Serve template CSV
app.get("/data/contacts_import_template.csv", (req, res) => {
  res.type("text/csv");
  res.sendFile(path.join(DATA, "contacts_import_template.csv"));
});

/* ---------- Public review portal (share this) ---------- */
app.get("/review", (req, res) => {
  const base = phoneShareBase(req);
  const flash = req.session.flash;
  delete req.session.flash;
  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <section class="photo-hero shore">
      <div class="photo-hero-content">
        <span class="badge pri">Share this page</span>
        <h2>Review our SD 33 plan — advise changes</h2>
        <p>You’re invited to look over the volunteer hub for Washington County’s St. Croix Valley races. Tell us what to add, cut, or fix so we win Senate 33, House 33A, and House 33B.</p>
        <p class="review-stars">★★★★★</p>
      </div>
      <span class="photo-credit">Minnesota lake country</span>
    </section>

    ${phoneLinksBox(req)}

    <div class="card" style="margin-bottom:1rem">
      <h3>Copy &amp; share (use phone link on mobile)</h3>
      <p><input class="share-input" id="rev-link" readonly value="${esc(base)}/review" onclick="this.select()" /></p>
      <button type="button" class="btn" onclick="navigator.clipboard.writeText(document.getElementById('rev-link').value);this.textContent='Link copied!'">Copy review link</button>
      <button type="button" class="btn btn-navy" onclick="navigator.clipboard.writeText('Please review our SD 33 volunteer site and leave advice:\\n${esc(base)}/review');this.textContent='Message copied!'">Copy invite text</button>
      <p class="muted" style="margin-top:0.75rem">Also: <a href="/my-gop-ballot">${esc(base)}/my-gop-ballot</a> · <a href="/win-playbook">Win playbook</a></p>
    </div>

    <div class="grid" style="margin-bottom:1rem">
      <article class="card">
        <div class="card-photo loon"></div>
        <h3>1. Try the tools (5 min)</h3>
        <ul class="checklist">
          <li><a href="/my-gop-ballot">GOP ballot by address</a> — check preferred candidates; <span class="badge pri">LEADING</span> where applicable</li>
          <li>Check preferred candidates (pre-primary + post package)</li>
          <li><a href="/field/doors">Doors</a> + busy-street <strong>sign ask</strong></li>
          <li><a href="/carry">Lit to carry</a> checkboxes</li>
        </ul>
      </article>
      <article class="card">
        <div class="card-photo autumn"></div>
        <h3>2. Read the win plan</h3>
        <ul class="checklist">
          <li><a href="/win-playbook">Full winning playbook</a></li>
          <li>Three local seats + top of ticket</li>
          <li>Poll rings, thoroughfares, early vote</li>
          <li>What we may still be missing</li>
        </ul>
      </article>
      <article class="card">
        <div class="card-photo valley"></div>
        <h3>3. Advise us</h3>
        <p>What confuses you? What’s missing for a real win? Be blunt.</p>
        <a class="btn" href="#advise">Leave advice ↓</a>
      </article>
    </div>

    <section class="card" style="margin-bottom:1rem">
      <h3>Snapshot for reviewers</h3>
      <table>
        <tr><th>Focus</th><th>Detail</th></tr>
        <tr><td>Seats to win</td><td>SD 33 (Housley GOP) · HD 33A open · HD 33B challenge</td></tr>
        <tr><td>Candidate lists</td><td><span class="tag-gop">GOP</span> candidates by race; <span class="badge pri">LEADING</span> label when a candidate is leading</td></tr>
        <tr><td>Field emphasis</td><td>Doors &gt; signs on busy streets &gt; phones &gt; lit</td></tr>
        <tr><td>Busy street rule</td><td>Interested in candidate → ask for sign location + log person &amp; contact</td></tr>
        <tr><td>Visual presentation</td><td>St. Croix Valley, lakes, and community imagery</td></tr>
      </table>
    </section>

    <section class="card" id="advise">
      <h2>Your advice &amp; suggested changes</h2>
      <form class="stack" method="post" action="/share/feedback">
        <label>Name (optional)</label>
        <input name="name" maxlength="100" />
        <label>Email or phone (optional)</label>
        <input name="contact" maxlength="160" />
        <label>I am a…</label>
        <select name="role">
          <option>Neighbor / voter</option>
          <option>Volunteer</option>
          <option>Captain / organizer</option>
          <option>Candidate / staff</option>
          <option>Other</option>
        </select>
        <label>Overall usefulness</label>
        <select name="rating">
          <option value="5">5 — ready to share widely</option>
          <option value="4">4 — strong, small fixes</option>
          <option value="3" selected>3 — promising</option>
          <option value="2">2 — needs work</option>
          <option value="1">1 — start over</option>
        </select>
        <label>What should we add, change, or cut?</label>
        <textarea name="message" required rows="5" maxlength="2000" placeholder="e.g. need Spanish, clearer Lindell package, more Forest Lake maps, SMS signup, event calendar…"></textarea>
        <button class="btn btn-gold" type="submit">Submit advice</button>
      </form>
      <p class="muted">Organizers read advice at <a href="/team/feedback">/team/feedback</a>.</p>
    </section>`;
  sendPage(req, res, "Review & advise", body);
});

/* ---------- Win playbook (research-backed tactics) ---------- */
app.get("/win-playbook", (req, res) => {
  const body = `
    <section class="photo-hero autumn">
      <div class="photo-hero-content">
        <span class="badge pri">Playbook</span>
        <h2>Best approach to win SD 33 · 33A · 33B</h2>
        <p>Built from competitive suburban/exurban legislative practice: multiple light touches, poll-adjacent density, early vote, and local trust — with Minnesota character front and center.</p>
      </div>
    </section>

    <div class="card" style="margin-bottom:1rem">
      <h3>North star</h3>
      <p>Win <strong>three local seats</strong> (Senate 33 + both house halves). Use top-of-ticket energy (<span class="tag-gop">GOP</span> Governor, U.S. Senate, U.S. House) to lift turnout — but never skip the local name on the door piece. On candidate lists, <span class="badge pri">LEADING</span> marks who is currently leading in that race.</p>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <h3>What already works on this site</h3>
      <ul class="checklist">
        <li>Address → GOP ballot + checkboxes</li>
        <li>Pre-primary vs post-primary package</li>
        <li><span class="badge pri">LEADING</span> labels when a candidate is leading</li>
        <li>Lit carry checklist</li>
        <li>Doors / phones / signs / poll rings</li>
        <li>Busy-street sign ask + person + contact log</li>
        <li>MnDOT/county thoroughfare priorities</li>
        <li>Share + review + feedback</li>
        <li>Contact CSV import for real voter file</li>
      </ul>
      <p><a class="btn" href="/my-gop-ballot">See ballot</a></p>
    </div>

    <section class="card" style="margin-bottom:1rem">
      <h3>Winning tactics (in order)</h3>
      <div class="tactic"><strong>1. Relational organizing first</strong>Each volunteer lists 20 people they know in SD 33. Text/call them before cold doors. Highest conversion rate in modern campaigns.</div>
      <div class="tactic"><strong>2. Poll-ring saturation</strong>0.25–0.5 mile around every Election Day site + early vote centers. Doors 2–3× + signs with permission. Final weekend: GOTV only.</div>
      <div class="tactic"><strong>3. Busy-street signs with permission</strong>Hwy 36, Hwy 95, Manning, CR 96, Forest Lake arterials. Script: if interested → ask sign location → log person + contact. Never ROW without permit.</div>
      <div class="tactic"><strong>4. Local three always on the piece</strong>Housley (SD33) + 33A GOP + 33B GOP. Top ticket is optional add-on after primary; local names win the legislature.</div>
      <div class="tactic"><strong>5. Early vote chase</strong>From mid-September: who requested absentee / voted early? Chase supporters who haven’t voted. Washington County early sites listed on Field → Polls.</div>
      <div class="tactic"><strong>6. Persuasion vs base split</strong>GOP + lean: turnout + signs. NP/swing: short contrast on schools, taxes, costs, safety. Hard DFL: skip for efficiency unless banked.</div>
      <div class="tactic"><strong>7. Multi-touch cadence</strong>Lit drop → door → text/phone → second door. One contact rarely moves a suburban independent.</div>
      <div class="tactic"><strong>8. Compliance &amp; trust</strong>No mailbox stuffing. Disclose paid for by. Respect no-soliciting counsel. Happy, short door visits beat long arguments.</div>
    </section>

    <section class="card" style="margin-bottom:1rem">
      <h3>Gaps we researched — add these next if you can</h3>
      <table>
        <thead><tr><th>Missing piece</th><th>Why it wins</th><th>Status here</th></tr></thead>
        <tbody>
          <tr><td>Live VAN / voter file sync</td><td>Real phones, scores, vote history</td><td>CSV import ready — connect file</td></tr>
          <tr><td>Peer-to-peer texting (Hustle/OpnSesame style)</td><td>Scale personal asks</td><td>Manual phones only — add export</td></tr>
          <tr><td>Event calendar (parades, fairs, forums)</td><td>Visibility in Stillwater/FL</td><td>Add events page</td></tr>
          <tr><td>Spanish / accessibility pass</td><td>Broader households</td><td>English first — review asked</td></tr>
          <tr><td>Donation / ActBlue-or-WinRed link</td><td>Fund mail &amp; signs</td><td>Not wired — add when legal entity set</td></tr>
          <tr><td>Opposition contrast one-pagers</td><td>Door leave-behind</td><td>Fair contrast only; build post-primary</td></tr>
          <tr><td>Precinct-level targets &amp; win numbers</td><td>Know exact votes needed</td><td>Turf by 33A/33B; refine with past results</td></tr>
          <tr><td>SMS/email capture double opt-in</td><td>Re-engage</td><td>Forms capture contact; expand CRM</td></tr>
          <tr><td>Hosted public URL (not localhost)</td><td>True shareability</td><td>Use LAN IP / host / tunnel for /review</td></tr>
          <tr><td>Volunteer schedule board</td><td>Fill Saturday shifts</td><td>Shift prefs on lit form; expand calendar</td></tr>
        </tbody>
      </table>
    </section>

    <section class="card" style="margin-bottom:1rem">
      <h3>Weekly rhythm (peak season)</h3>
      <ul>
        <li><strong>Tue</strong> phones / texts (GOP + UNK with numbers)</li>
        <li><strong>Thu</strong> captain huddle — turf, sign inventory, early vote chase list</li>
        <li><strong>Sat</strong> doors (poll rings AM, busy-corridor feeders PM) + sign asks</li>
        <li><strong>Sun</strong> optional second canvass or community visibility</li>
      </ul>
    </section>

    <section class="card">
      <h3>St. Croix Valley Imagery</h3>
      <div class="gallery" aria-label="St. Croix Valley and Minnesota lakes">
        <figure>
          <img src="/images/loon-lake.jpg" alt="Common loon on a Minnesota lake" />
        </figure>
        <figure>
          <img src="/images/forest-lake-scenic.jpg?v=4" alt="Lakeside park beach in Forest Lake, Minnesota" />
        </figure>
        <figure>
          <img src="/images/mn-capitol-horizon.jpg?v=4" alt="Minnesota landscape with faint State Capitol on the horizon" />
        </figure>
        <figure>
          <img src="/images/mn-flag-historic.png?v=4" alt="Historic Minnesota state flag with Great Seal" />
        </figure>
      </div>
      <p>Original illustrations reflect Washington County and the St.&nbsp;Croix Valley for a professional local presentation.</p>
      <p><a class="btn btn-gold" href="/review">Send for Review</a> <a class="btn" href="/share">Share Links</a></p>
    </section>`;
  sendPage(req, res, "Field Guide", body);
});

/* ---------- Share site + collect feedback ---------- */
app.get("/share", (req, res) => {
  const base = phoneShareBase(req);
  const shareUrl = `${base}/my-gop-ballot`;
  const homeUrl = `${base}/`;
  const feedbackUrl = `${base}/share#feedback`;
  const flash = req.session.flash;
  delete req.session.flash;

  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <section class="hero">
      <span class="badge pri">Share</span>
      <h2>Share this site for feedback</h2>
      <p>Best public link for review: <a href="/review"><strong>/review</strong></a> — plan + tools + advice form.</p>
      <p><a class="btn btn-gold" href="/review">Open full review portal</a></p>
    </section>
    ${phoneLinksBox(req)}

    <div class="gallery">
      <img src="/images/loon-lake.jpg" alt="Loon" />
      <img src="/images/st-croix-valley.jpg" alt="Valley" />
      <img src="/images/mn-lake-shore.jpg" alt="Shore" />
      <img src="/images/autumn-lakeside.jpg" alt="Autumn" />
    </div>

    <div class="grid">
      <article class="card">
        <h3>Links to copy</h3>
        <p><strong>Review &amp; advise</strong> (best general share)</p>
        <p><input class="share-input" id="link-review" type="text" readonly value="${esc(base)}/review" onclick="this.select()" /></p>
        <button type="button" class="btn btn-gold" onclick="navigator.clipboard.writeText(document.getElementById('link-review').value);this.textContent='Copied!';">Copy review link</button>

        <p style="margin-top:1rem"><strong>GOP ballot + picks</strong></p>
        <p><input class="share-input" id="link-ballot" type="text" readonly value="${esc(shareUrl)}" onclick="this.select()" /></p>
        <button type="button" class="btn" onclick="navigator.clipboard.writeText(document.getElementById('link-ballot').value);this.textContent='Copied!';">Copy ballot link</button>

        <p style="margin-top:1rem"><strong>Home</strong></p>
        <p><input class="share-input" id="link-home" type="text" readonly value="${esc(homeUrl)}" onclick="this.select()" /></p>
        <button type="button" class="btn btn-navy" onclick="navigator.clipboard.writeText(document.getElementById('link-home').value);this.textContent='Copied!';">Copy home link</button>

        <p style="margin-top:1rem"><strong>Feedback form</strong></p>
        <p><input class="share-input" id="link-fb" type="text" readonly value="${esc(feedbackUrl)}" onclick="this.select()" /></p>
        <button type="button" class="btn btn-navy" onclick="navigator.clipboard.writeText(document.getElementById('link-fb').value);this.textContent='Copied!';">Copy feedback link</button>
      </article>

      <article class="card">
        <h3>Text / email blurb</h3>
        <textarea id="blurb" rows="10" readonly class="share-input" style="max-width:100%">Please review the St. Croix Valley Field Hub for Minnesota Senate District 33 and House Districts 33A and 33B. Use the tools and share any feedback so we can win these seats:

${base}/review

GOP ballot by address:
${shareUrl}

Thanks!
</textarea>
        <button type="button" class="btn" onclick="navigator.clipboard.writeText(document.getElementById('blurb').value);this.textContent='Blurb copied!';">Copy message</button>
        <p class="muted" style="margin-top:0.75rem">On your phone: open this page, copy the link, paste into text/email/Facebook group.</p>
        <p class="muted"><strong>Note:</strong> On your home Wi‑Fi, others on the same network can use <code>http://YOUR-PC-IP:3050</code> if Windows Firewall allows port 3050. For the public internet, host this app (or use a tunnel) and share that URL instead of localhost.</p>
      </article>
    </div>

    <section class="card" id="feedback" style="margin-top:1rem">
      <h2>Leave feedback</h2>
      <p class="muted">What works? What’s confusing? Missing candidates? Tell us.</p>
      <form class="stack" method="post" action="/share/feedback">
        <label>Your name (optional)</label>
        <input name="name" maxlength="100" />
        <label>Email or phone (optional)</label>
        <input name="contact" maxlength="160" />
        <label>How useful is this site?</label>
        <select name="rating">
          <option value="5">5 — very useful</option>
          <option value="4">4</option>
          <option value="3" selected>3 — okay</option>
          <option value="2">2</option>
          <option value="1">1 — not useful</option>
        </select>
        <label>Feedback</label>
        <textarea name="message" required rows="4" maxlength="2000" placeholder="e.g. add more towns, unclear checkboxes, want SMS share…"></textarea>
        <label>I am a…</label>
        <select name="role">
          <option>Volunteer</option>
          <option>Neighbor / voter</option>
          <option>Captain / organizer</option>
          <option>Candidate / staff</option>
          <option>Other</option>
        </select>
        <button class="btn" type="submit">Send feedback</button>
      </form>
    </section>

    <section class="card" style="margin-top:1rem">
      <h3>For you (organizer)</h3>
      <ul>
        <li><a href="/team/preferences">Candidate pick totals</a> — who people checked</li>
        <li><a href="/team/feedback">Read feedback</a> — all comments</li>
        <li><a href="/my-gop-ballot">Ballot tool</a> — same link you share</li>
      </ul>
    </section>`;
  sendPage(req, res, "Share & feedback", body);
});

app.post("/share/feedback", (req, res) => {
  const list = loadJson(FEEDBACK_FILE);
  list.unshift({
    id: "fb_" + Date.now(),
    at: new Date().toISOString(),
    name: String(req.body.name || "").slice(0, 100),
    contact: String(req.body.contact || "").slice(0, 160),
    rating: String(req.body.rating || ""),
    role: String(req.body.role || ""),
    message: String(req.body.message || "").slice(0, 2000),
  });
  saveJson(FEEDBACK_FILE, list.slice(0, 2000));
  req.session.flash = "Thanks — your feedback was saved.";
  const ref = String(req.get("referer") || "");
  if (ref.includes("/review")) return res.redirect("/review#advise");
  res.redirect("/share#feedback");
});

app.get("/team/preferences", (req, res) => {
  const prefs = loadJson(PREFS_FILE);
  const counts = {};
  let pre = 0;
  let post = 0;
  let fullPkg = 0;
  for (const p of prefs) {
    if ((p.phases || []).includes("pre_primary")) pre++;
    if ((p.phases || []).includes("post_package")) post++;
    if (p.wantFullPackage) fullPkg++;
    for (const c of p.preferred || []) {
      const key = `${c.raceKey}||${c.candidate}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const rows = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => {
      const [race, name] = k.split("||");
      return `<tr><td><span class="tag-gop">GOP</span> ${esc(name)}</td><td class="muted">${esc(race)}</td><td><strong>${n}</strong></td></tr>`;
    })
    .join("");

  const recent = prefs
    .slice(0, 25)
    .map(
      (p) => `<tr>
        <td class="muted">${esc((p.at || "").slice(0, 16).replace("T", " "))}</td>
        <td>${esc(p.name || "—")}</td>
        <td>${esc(p.address?.city || "")} ${esc(p.houseDistrict || "")}</td>
        <td>${esc((p.phases || []).join(", "))}${p.wantFullPackage ? " · full package" : ""}</td>
        <td class="muted">${esc((p.preferred || []).map((x) => x.candidate).join("; ").slice(0, 100))}</td>
      </tr>`
    )
    .join("");

  const teamPush = prefs.filter((p) => p.teamPushOk).length;
  const phaseInfo = loadElectionPhase();
  const body = `
    <section class="hero">
      <h2>Preferred Candidate Totals</h2>
      <p><strong>${prefs.length}</strong> submissions · Pre-primary: <strong>${pre}</strong> · Post-package: <strong>${post}</strong> · Full package: <strong>${fullPkg}</strong> · Team push: <strong>${teamPush}</strong></p>
      <p class="muted">Election mode: <strong>${esc(phaseInfo.mode || "pre_primary")}</strong>${
        phaseInfo.winnersUploaded ? " · winners published" : " · winners not yet uploaded"
      }. Edit <code>data/election_phase.json</code> after the primary: set <code>mode</code> to <code>post_primary</code>, fill <code>winners</code>, set <code>winnersUploaded</code> to true.</p>
      <p><a class="btn" href="/share">Share Site</a> <a class="btn btn-navy" href="/team/feedback">Feedback List</a></p>
    </section>
    <div class="card">
      <h3>Most Selected GOP Candidates</h3>
      <table>
        <thead><tr><th>Candidate</th><th>Race</th><th>Selections</th></tr></thead>
        <tbody>${rows || "<tr><td colspan=3>No selections yet — share Find Your Ballot</td></tr>"}</tbody>
      </table>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>Recent Submissions</h3>
      <table>
        <thead><tr><th>When</th><th>Name</th><th>Area</th><th>Phase</th><th>Selections</th></tr></thead>
        <tbody>${recent || "<tr><td colspan=5>None yet</td></tr>"}</tbody>
      </table>
    </div>`;
  sendPage(req, res, "Preference Totals", body);
});

app.get("/team/feedback", (req, res) => {
  const list = loadJson(FEEDBACK_FILE);
  const rows = list
    .map(
      (f) => `<tr>
        <td class="muted">${esc((f.at || "").slice(0, 16).replace("T", " "))}</td>
        <td>${esc(f.rating)}/5</td>
        <td>${esc(f.role)}</td>
        <td>${esc(f.name || "—")}<div class="muted">${esc(f.contact || "")}</div></td>
        <td>${esc(f.message)}</td>
      </tr>`
    )
    .join("");
  const body = `
    <section class="hero">
      <h2>Feedback from people</h2>
      <p><strong>${list.length}</strong> comments · <a href="/share">Share link again</a></p>
    </section>
    <div class="card">
      <table>
        <thead><tr><th>When</th><th>Rating</th><th>Role</th><th>Who</th><th>Message</th></tr></thead>
        <tbody>${rows || "<tr><td colspan=5>No feedback yet</td></tr>"}</tbody>
      </table>
    </div>`;
  sendPage(req, res, "Feedback", body);
});

/* ---------- Point-in-polygon + map APIs ---------- */
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function pointInGeometry(lng, lat, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    return pointInRing(lng, lat, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (pointInRing(lng, lat, poly[0])) return true;
    }
  }
  return false;
}
/** Official SOS precinct match inside SD 33 */
function lookupPrecinct(lat, lng) {
  if (!fs.existsSync(PRECINCTS_FILE)) return null;
  const idx = loadJson(PRECINCTS_FILE);
  for (const f of idx.features || []) {
    if (pointInGeometry(lng, lat, f.geometry)) return f.properties;
  }
  return null;
}
function layersContaining(lat, lng, geo) {
  const hit = [];
  for (const layer of geo.layers || []) {
    const g = layer.geojson?.geometry;
    if (g && pointInGeometry(lng, lat, g)) hit.push(layer);
  }
  return hit;
}

app.get("/api/districts-geo", (req, res) => {
  res.json(loadJson(DISTRICTS_GEO_FILE));
});

app.get("/api/geocode", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ ok: false, error: "Missing query" });
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
      encodeURIComponent(q);
    const r = await fetch(url, {
      headers: {
        "User-Agent": "SD33-FieldHub/1.0 (volunteer organizing; contact@local)",
        Accept: "application/json",
      },
    });
    const arr = await r.json();
    if (!arr || !arr[0]) return res.json({ ok: false, error: "Not found" });
    res.json({
      ok: true,
      lat: Number(arr[0].lat),
      lng: Number(arr[0].lon),
      display_name: arr[0].display_name,
    });
  } catch (e) {
    res.json({ ok: false, error: "Geocoder unavailable" });
  }
});

app.get("/api/map-lookup", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.json({ ok: false, error: "Invalid coordinates" });
  }
  const geo = loadJson(DISTRICTS_GEO_FILE);
  const candData = loadCandidates();
  const prec = lookupPrecinct(lat, lng);

  let house = null;
  let senate = null;
  let cong = null;
  let precinctName = null;
  const matchedLayers = [];

  if (prec) {
    // Official SOS precinct attributes (May 2026 file)
    house = prec.MNLegDist || null;
    senate = prec.MNSenDist || null;
    cong = String(prec.CongDist || "");
    precinctName = (prec.Precinct || "") + (prec.County ? " (" + prec.County + ")" : "");
    if (house === "33A") matchedLayers.push("State House · HD 33A");
    if (house === "33B") matchedLayers.push("State House · HD 33B");
    if (senate === "33") matchedLayers.push("State Senate · SD 33");
    if (cong === "4") matchedLayers.push("U.S. House · MN-04");
    if (cong === "8") matchedLayers.push("U.S. House · MN-08");
  } else {
    // Fallback: layer hit + nearest town pin
    const hits = layersContaining(lat, lng, geo);
    for (const h of hits) {
      matchedLayers.push(h.label);
      if (h.id === "hd_33a") house = "33A";
      if (h.id === "hd_33b") house = "33B";
      if (h.id === "us_house_4") cong = cong || "4";
      if (h.id === "us_house_8") cong = "8";
      if (h.id === "sd_33") senate = "33";
    }
    let nearest = null;
    let bestD = Infinity;
    for (const t of geo.townPins || []) {
      const d = (t.lat - lat) ** 2 + (t.lng - lng) ** 2;
      if (d < bestD) {
        bestD = d;
        nearest = t;
      }
    }
    if (nearest && bestD < 0.004) {
      house = nearest.house || house;
      cong = nearest.usHouse ? String(nearest.usHouse) : cong;
      senate = nearest.senate || senate;
    }
  }

  if (house !== "33A" && house !== "33B") house = "BOTH";
  const usHouse = cong ? [cong] : house === "33A" ? ["8"] : ["4"];

  const districts = {
    house,
    senate: senate || "33",
    usHouse,
  };
  const ballot = gopBallotForDistricts(districts);
  function gopList(key) {
    const r = (ballot.races || []).find((x) => x.key === key);
    return r?.candidates || candData.races[key]?.gop || [];
  }

  const levels = [];
  if (house === "33A") {
    levels.push({
      level: "Local · State House",
      office: "State House · HD 33A",
      districtNote:
        "GOP: Stacey Stout · House District 33A (full): Dellwood; Forest Lake P-2/P-4/P-5; Grant P-2; Hugo; Mahtomedi; Willernie" +
        (precinctName ? " · Matched precinct: " + precinctName : ""),
      candidates: gopList("house33A"),
    });
  } else if (house === "33B") {
    levels.push({
      level: "Local · State House",
      office: "State House · HD 33B",
      districtNote:
        "GOP: Jessica L. Johnson · House District 33B (full): Bayport; Forest Lake P-1/P-3; Marine on St. Croix; May Township; Oak Park Heights; Scandia; Stillwater; Stillwater Township" +
        (precinctName ? " · Matched precinct: " + precinctName : ""),
      candidates: gopList("house33B"),
    });
  } else {
    levels.push({
      level: "Local · State House",
      office: "State House · HD 33A or 33B",
      districtNote: "Outside mapped SD 33 precincts or on a boundary — confirm at pollfinder.sos.mn.gov",
      candidates: [...gopList("house33A"), ...gopList("house33B")],
    });
  }

  levels.push({
    level: "State · Senate",
    office: "State Senate · SD 33",
    districtNote: "GOP: Karin Housley" + (precinctName ? " · Precinct: " + precinctName : ""),
    candidates: gopList("stateSenate33"),
  });
  levels.push({
    level: "State · Statewide",
    office: "Governor of Minnesota",
    districtNote: "Statewide",
    candidates: gopList("governor"),
  });
  levels.push({
    level: "Federal · U.S. Senate",
    office: "U.S. Senate · Minnesota",
    districtNote: "Statewide",
    candidates: gopList("usSenate"),
  });
  for (const n of usHouse) {
    const key = n === "8" ? "usHouse8" : n === "6" ? "usHouse6" : "usHouse4";
    const office =
      n === "8" ? "U.S. House · MN-08" : n === "6" ? "U.S. House · MN-06" : "U.S. House · MN-04";
    levels.push({
      level: "Federal · U.S. House",
      office,
      districtNote:
        (n === "8"
          ? "Within SD 33: Forest Lake, Hugo, Scandia, Marine, May Twp (SOS)"
          : "Within SD 33: Stillwater, Bayport, Oak Park Heights, Mahtomedi, Dellwood (SOS)") +
        (precinctName ? " · Precinct: " + precinctName : ""),
      candidates: gopList(key),
    });
  }

  res.json({
    ok: true,
    addressLabel: req.query.label || precinctName || "",
    matchedLayers,
    house: districts.house,
    senate: districts.senate,
    cong: cong || null,
    precinct: precinctName,
    source: prec ? "Minnesota SOS precinct GeoJSON (May 2026)" : "fallback map layers",
    levels,
  });
});

app.get("/map", (req, res) => {
  const geo = loadJson(DISTRICTS_GEO_FILE);
  const legend = (geo.layers || [])
    .map(
      (l) =>
        `<span><i class="swatch" style="background:${esc(l.color)}"></i> ${esc(l.label)} <span class="muted">(${esc(
          l.level
        )})</span></span>`
    )
    .join("");
  const body = `
    <section class="hero prose">
      <span class="badge pri">Interactive map</span>
      <h2>Find your races — local, state &amp; federal</h2>
      <p>Enter an address or click the map. Layers use <strong>Minnesota Secretary of State precinct boundaries (May 2026)</strong> — not freehand shapes. Town markers: <span style="background:#fde047;padding:0 0.35rem;border-radius:3px">yellow = HD 33A</span> · <span style="background:#f9a8d4;padding:0 0.35rem;border-radius:3px">pink = HD 33B</span>.</p>
      <p class="muted">${esc(geo.note || "")}</p>
      <div class="card" style="margin:0.75rem 0;font-size:0.92rem">
        <p><strong>HD 33A</strong> — <span class="tag-gop">GOP</span> Stacey Stout (full district)</p>
        ${areaListHtml("hd33a")}
        <p style="margin-top:0.75rem"><strong>HD 33B</strong> — <span class="tag-gop">GOP</span> Jessica L. Johnson (full district)</p>
        ${areaListHtml("hd33b")}
        <p style="margin-top:0.75rem"><strong>SD 33</strong> — <span class="tag-gop">GOP</span> Karin Housley (full Senate district)</p>
        ${areaListHtml("sd33")}
        <p style="margin-top:0.75rem"><strong>U.S. House within SD 33</strong> (not MN-06 for most addresses):</p>
        <p class="muted" style="margin:0.35rem 0"><strong>MN-04:</strong> ${esc(formatAreaList("cd4_in_sd33", "; "))}</p>
        <p class="muted" style="margin:0"><strong>MN-08:</strong> ${esc(formatAreaList("cd8_in_sd33", "; "))}</p>
      </div>
      <p class="muted">Cross-checked with SOS legislative maps and Ballotpedia 2026 candidate lists. Official ballot: <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">pollfinder.sos.mn.gov</a>. Candidates are presented by district geography—not hometown spin.</p>
    </section>
    <div class="map-legend" aria-label="District color legend">${legend}</div>
    <div class="map-layout">
      <div>
        <div id="district-map" role="application" aria-label="District map of Senate 33 area"></div>
        <form id="map-address-form" class="card stack" style="margin-top:1rem">
          <h3>Pin an address</h3>
          <label for="map-street">Street</label>
          <input id="map-street" name="street" placeholder="123 Main St N" autocomplete="street-address" />
          <label for="map-city">City or township (any in SD 33)</label>
          <input id="map-city" name="city" placeholder="Any district community" list="map-cities" autocomplete="address-level2" />
          <datalist id="map-cities">
            <option>Bayport</option><option>Dellwood</option><option>Forest Lake</option><option>Grant</option>
            <option>Hugo</option><option>Mahtomedi</option><option>Marine on St. Croix</option>
            <option>May Township</option><option>Oak Park Heights</option><option>Scandia</option>
            <option>Stillwater</option><option>Stillwater Township</option><option>Willernie</option>
          </datalist>
          <label for="map-zip">ZIP</label>
          <input id="map-zip" name="zip" placeholder="55082" autocomplete="postal-code" />
          <button class="btn" type="submit">Show candidates for this address</button>
        </form>
      </div>
      <aside class="card" id="map-results-panel">
        <h3>Candidates at pin</h3>
        <div id="map-results">
          <p class="muted">Search an address or click the map to load local, state, and federal races.</p>
        </div>
      </aside>
    </div>`;
  sendPage(req, res, "District map", body, {
    extraHead: `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />`,
    extraFoot: `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
<script>window.SD33_DISTRICTS = ${JSON.stringify(geo)};</script>
<script src="/js/map-app.js"></script>`,
  });
});

/* ---------- Events + gear + filters ---------- */
/** Public event status for CRO: confirmed | proposed | cancelled | past */
function eventPublicStatus(e, todayStr) {
  const st = String(e.status || "").toLowerCase();
  const loc = String(e.locationName || "") + " " + String(e.address || "");
  const end = String(e.dateEnd || e.date || "");
  if (st === "cancelled") return "cancelled";
  if (end && todayStr && end < todayStr) return "past";
  if (st === "confirmed") {
    if (/tba|to be announced|venue pending/i.test(loc)) return "venue_pending";
    return "confirmed";
  }
  if (st === "planned" || st === "idea" || st === "proposed") return "proposed";
  if (/tba|to be announced|venue pending/i.test(loc)) return "venue_pending";
  // annual/recurring/scheduled without explicit confirmed → treat as proposed for public trust
  if (st === "annual" || st === "recurring" || st === "scheduled") return "proposed";
  return st ? "proposed" : "proposed";
}

function eventIsConfirmedPublic(e, todayStr) {
  return eventPublicStatus(e, todayStr) === "confirmed";
}

function eventStatusBadgeHtml(publicStatus) {
  const map = {
    confirmed: '<span class="badge confirmed">Confirmed</span>',
    venue_pending: '<span class="badge planned">Venue pending</span>',
    proposed: '<span class="badge planned">Proposed</span>',
    cancelled: '<span class="badge other">Cancelled</span>',
    past: '<span class="badge other">Past</span>',
  };
  return map[publicStatus] || '<span class="badge planned">Listed</span>';
}

function eventCardHtml(e, opts = {}) {
  const today = opts.today || todayYmd();
  const publicStatus = opts.publicStatus || eventPublicStatus(e, today);
  const isConfirmed = publicStatus === "confirmed";
  const scope = e.districtScope === "nearby" ? "nearby" : "in";
  const scopeBadge =
    scope === "nearby"
      ? '<span class="badge other">Nearby</span>'
      : '<span class="badge published">In district</span>';
  const gear = e.gear || {};
  const roles = (e.volunteerRoles || []).map((r) => `<li>${esc(r)}</li>`).join("");
  const gCal = isConfirmed ? googleCalendarUrl(e) : "";
  const share = e.socialShare || `${e.title} — ${e.dayLabel || e.date || ""}.`;
  const desc = String(e.description || "").trim();
  const shortDesc = desc.length > 160 ? desc.slice(0, 157) + "…" : desc;
  const typeLabel = String(e.type || "event").replace(/_/g, " ");
  return `<article class="card event-card event-card--${esc(publicStatus)}" style="margin-bottom:1rem" data-scope="${scope}" data-status="${esc(publicStatus)}" data-district="${esc(
    (e.districts || []).join(" ")
  )}" data-type="${esc(e.type || "")}" data-community="${esc(e.community || "")}">
    <div class="event-card-badges" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem">
      ${eventStatusBadgeHtml(publicStatus)}
      ${scopeBadge}
      <span class="badge other">${esc(typeLabel)}</span>
      ${e.community ? `<span class="badge published">${esc(e.community)}</span>` : ""}
    </div>
    <h2 class="event-card-title" style="margin:0.25rem 0;font-size:1.2rem;font-family:var(--font-display)">${esc(e.title)}</h2>
    <p class="event-card-when" style="margin:0.35rem 0"><strong>${esc(e.dayLabel || e.date || "Date TBA")}</strong>${e.time ? " · " + esc(e.time) : ""}</p>
    <p class="event-card-where" style="margin:0.25rem 0">${esc(e.locationName || "Location TBA")}${e.address ? " · " + esc(e.address) : ""}</p>
    ${shortDesc ? `<p class="event-card-desc" style="margin:0.5rem 0">${esc(shortDesc)}</p>` : ""}
    <p class="muted" style="margin:0.35rem 0;font-size:0.9rem">${esc((e.districts || []).join(" · "))}</p>
    <details class="event-details-accordion" style="margin:0.75rem 0">
      <summary style="cursor:pointer;font-weight:700;color:var(--navy)">Volunteer details &amp; gear</summary>
      <div style="margin-top:0.65rem">
        ${
          e.nearbyReason
            ? `<p><strong>Why nearby still matters:</strong> ${esc(e.nearbyReason)}</p>`
            : ""
        }
        <ul style="margin:0;padding-left:1.2rem">
          <li><strong>Stickers:</strong> ${esc(gear.stickers || "Ask captain")}</li>
          <li><strong>Literature:</strong> ${esc(gear.literature || "Match house district + Senate 33")}</li>
          <li><strong>Shirts:</strong> ${esc(gear.shirts || "Campaign shirt or solid color")}</li>
        </ul>
        ${roles ? `<p class="muted" style="margin-top:0.65rem"><strong>Roles:</strong></p><ul>${roles}</ul>` : ""}
        ${e.source ? `<p class="muted">Source: <a href="${esc(e.source)}" target="_blank" rel="noopener">Read the source</a></p>` : ""}
      </div>
    </details>
    <p class="cta-row">
      <a class="btn btn-primary" href="/volunteer?event=${encodeURIComponent(e.id || "")}">Sign up for this event</a>
      ${
        isConfirmed
          ? `${gCal ? `<a class="btn btn-secondary" href="${esc(gCal)}" target="_blank" rel="noopener">Add to Google Calendar</a>` : ""}
      <a class="btn btn-secondary" href="/events/${encodeURIComponent(e.id || "")}.ics">Add to calendar (.ics)</a>`
          : `<span class="muted" style="align-self:center">Calendar file available after venue is confirmed.</span>`
      }
      <button type="button" class="btn btn-ghost" onclick="navigator.clipboard.writeText(${JSON.stringify(share)});this.textContent='Copied!'">Copy share text</button>
    </p>
  </article>`;
}

/** Hide past events; keep undated recurring items only if no end before today */
function isEventUpcoming(e, todayStr) {
  if (!e || !e.date) return false;
  const end = e.dateEnd || e.date;
  return String(end) >= todayStr;
}

function todayYmd() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function googleCalendarUrl(event) {
  if (!event || !event.date) return "";
  const title = encodeURIComponent(event.title || "SD 33 event");
  const details = encodeURIComponent(
    [event.description || "", event.socialShare || "", "https://sd33-field-hub.onrender.com/events"].join("\n\n")
  );
  const loc = encodeURIComponent([event.locationName, event.address].filter(Boolean).join(", "));
  const startT = (event.timeStart || "09:00").replace(":", "");
  const endT = (event.timeEnd || "12:00").replace(":", "");
  const start = String(event.date).replace(/-/g, "") + "T" + startT + "00";
  const endDate = String(event.dateEnd || event.date).replace(/-/g, "");
  const end = endDate + "T" + endT + "00";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${loc}`;
}

app.get("/events", (req, res) => {
  const data = loadJson(EVENTS_FILE);
  const today = todayYmd();
  const allEvents = data.events || [];
  const filter = req.query.scope || "all"; // all | in | nearby
  const district = req.query.district || ""; // 33A | 33B | SD33
  const typeFilter = String(req.query.type || "");
  const community = String(req.query.community || "");
  const statusView = String(req.query.view || "confirmed"); // confirmed | proposed | past | all
  const q = String(req.query.q || "").trim().toLowerCase();

  function applyFilters(list) {
    let out = list.slice();
    if (filter === "in") out = out.filter((e) => e.districtScope !== "nearby");
    if (filter === "nearby") out = out.filter((e) => e.districtScope === "nearby");
    if (district === "33A") out = out.filter((e) => (e.districts || []).some((d) => /33A/i.test(d)));
    if (district === "33B") out = out.filter((e) => (e.districts || []).some((d) => /33B/i.test(d)));
    if (district === "SD33") {
      out = out.filter(
        (e) =>
          (e.districts || []).some((d) => /SD\s*33|Senate/i.test(d)) || e.districtScope === "in"
      );
    }
    if (community) {
      out = out.filter((e) => String(e.community || "").toLowerCase() === community.toLowerCase());
    }
    if (typeFilter === "social") {
      out = out.filter((e) => /social|happy_hour|breakfast|lunch|karaoke/i.test(String(e.type || "")));
    } else if (typeFilter) {
      out = out.filter((e) => String(e.type || "").toLowerCase() === typeFilter.toLowerCase());
    }
    if (q) {
      out = out.filter((e) => {
        const blob = [e.title, e.locationName, e.community, e.description, (e.districts || []).join(" ")]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  const annotated = allEvents.map((e) => ({
    e,
    publicStatus: eventPublicStatus(e, today),
  }));
  const confirmedPool = annotated.filter((x) => x.publicStatus === "confirmed").map((x) => x.e);
  const proposedPool = annotated
    .filter((x) => x.publicStatus === "proposed" || x.publicStatus === "venue_pending")
    .map((x) => x.e);
  const pastPool = annotated
    .filter((x) => x.publicStatus === "past" || x.publicStatus === "cancelled")
    .map((x) => x.e)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  let sourcePool = confirmedPool;
  if (statusView === "proposed") sourcePool = proposedPool;
  else if (statusView === "past") sourcePool = pastPool;
  else if (statusView === "all") sourcePool = allEvents.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  else sourcePool = confirmedPool;

  const list = applyFilters(sourcePool);
  const communities = [
    ...new Set(allEvents.map((e) => e.community).filter(Boolean)),
  ].sort();
  const cards = list
    .map((e) => eventCardHtml(e, { today, publicStatus: eventPublicStatus(e, today) }))
    .join("");
  const emptyMsg =
    statusView === "confirmed"
      ? `<div class="empty-state"><strong>No confirmed events match these filters.</strong><p class="muted">View <a href="/events?view=proposed">proposed activities</a> or <a href="/volunteer">volunteer for future opportunities</a>.</p></div>`
      : `<div class="empty-state"><strong>No events match these filters.</strong><p class="muted"><a href="/events">Clear filters</a> or <a href="/volunteer">volunteer</a>.</p></div>`;

  function viewHref(view) {
    const p = new URLSearchParams();
    p.set("view", view);
    if (filter && filter !== "all") p.set("scope", filter);
    if (district) p.set("district", district);
    if (typeFilter) p.set("type", typeFilter);
    if (community) p.set("community", community);
    if (q) p.set("q", q);
    return "/events?" + p.toString();
  }
  function chip(active, href, label) {
    return `<a class="btn ${active ? "btn-primary" : "btn-secondary"} btn-sm" href="${esc(href)}">${label}</a>`;
  }

  const body = `
    <header class="page-intro">
      <h1>Events</h1>
      <p>Confirmed public events first. Proposed or venue-pending activities are separated so neighbors are not misled. As of <strong>${esc(today)}</strong>.</p>
      <p class="muted">${esc(data.note || "")}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/volunteer">Volunteer for events</a>
        <a class="btn btn-secondary" href="/volunteer#ideas">Suggest an event idea</a>
      </div>
    </header>

    <div class="filter-bar" role="search" aria-label="Filter events">
      <label>Search<input type="search" name="q" form="events-filter" id="ev-q" value="${esc(req.query.q || "")}" placeholder="Name, city, or activity" /></label>
      <label>Status
        <select id="ev-view" form="events-filter" onchange="location.href=this.value">
          <option value="${esc(viewHref("confirmed"))}" ${statusView === "confirmed" ? "selected" : ""}>Confirmed only</option>
          <option value="${esc(viewHref("proposed"))}" ${statusView === "proposed" ? "selected" : ""}>Proposed / venue pending</option>
          <option value="${esc(viewHref("past"))}" ${statusView === "past" ? "selected" : ""}>Past or cancelled</option>
          <option value="${esc(viewHref("all"))}" ${statusView === "all" ? "selected" : ""}>All listed</option>
        </select>
      </label>
      <span class="filter-result-count" aria-live="polite">${list.length} event${list.length === 1 ? "" : "s"} · ${confirmedPool.length} confirmed · ${proposedPool.length} proposed</span>
    </div>

    <p class="cta-row" style="flex-wrap:wrap;margin:0.75rem 0 1rem">
      ${chip(statusView === "confirmed", viewHref("confirmed"), "Confirmed")}
      ${chip(statusView === "proposed", viewHref("proposed"), "Proposed")}
      ${chip(statusView === "past", viewHref("past"), "Past")}
      ${chip(filter === "in", "/events?view=" + encodeURIComponent(statusView) + "&scope=in", "In district")}
      ${chip(filter === "nearby", "/events?view=" + encodeURIComponent(statusView) + "&scope=nearby", "Nearby")}
      ${chip(district === "33A", "/events?view=" + encodeURIComponent(statusView) + "&district=33A", "HD 33A")}
      ${chip(district === "33B", "/events?view=" + encodeURIComponent(statusView) + "&district=33B", "HD 33B")}
      ${chip(district === "SD33", "/events?view=" + encodeURIComponent(statusView) + "&district=SD33", "SD 33")}
      ${chip(typeFilter === "social", "/events?view=" + encodeURIComponent(statusView) + "&type=social", "Social / meals")}
      <a class="btn btn-ghost btn-sm" href="/events">Clear filters</a>
    </p>
    <p class="muted" style="margin:0 0 0.75rem"><strong>Community:</strong>
      ${communities
        .map(
          (c) =>
            `<a href="/events?view=${encodeURIComponent(statusView)}&community=${encodeURIComponent(c)}">${esc(c)}</a>`
        )
        .join(" · ")}
    </p>

    <details class="card section" style="margin-bottom:1rem">
      <summary style="cursor:pointer;font-weight:700">Month calendar &amp; gear guide</summary>
      <div style="margin-top:1rem">
        <section id="live-calendar" class="live-calendar-wrap" aria-label="Interactive month calendar">
          <div class="cal-toolbar">
            <div class="cal-nav">
              <button type="button" class="btn btn-secondary btn-sm" id="cal-prev" aria-label="Previous month">←</button>
              <button type="button" class="btn btn-secondary btn-sm" id="cal-today">Today</button>
              <button type="button" class="btn btn-secondary btn-sm" id="cal-next" aria-label="Next month">→</button>
            </div>
            <h2 id="cal-month-label" class="cal-month-label">Loading…</h2>
          </div>
          <div class="cal-layout">
            <div id="cal-grid" class="cal-grid" role="grid" aria-labelledby="cal-month-label"></div>
            <div id="cal-day-detail" class="cal-day-detail" aria-live="polite"><p class="muted">Select a day…</p></div>
          </div>
        </section>
        <script src="/js/calendar-app.js?v=2"></script>
        <div style="margin-top:1rem;overflow-x:auto">
          <table>
            <thead><tr><th>Setting</th><th>Stickers</th><th>Literature</th><th>Shirts</th></tr></thead>
            <tbody>
              <tr><td>Parade</td><td>Yes</td><td>Palm cards by house district + Senate 33</td><td>Team shirts</td></tr>
              <tr><td>Festival / fair</td><td>Yes</td><td>Door lit or palm cards; booth rules</td><td>Booth crew shirt</td></tr>
              <tr><td>Meal / social</td><td>Subtle</td><td>Light table lit if host allows</td><td>Solid / small logo</td></tr>
            </tbody>
          </table>
          <p class="muted">Never place materials in U.S. mailboxes. Follow organizer rules and Minnesota poll-buffer law near voting places.</p>
        </div>
      </div>
    </details>

    <h2 id="list" class="section-title">${
      statusView === "confirmed"
        ? "Confirmed upcoming"
        : statusView === "proposed"
          ? "Proposed or venue pending"
          : statusView === "past"
            ? "Past or cancelled"
            : "All listed events"
    }</h2>
    ${cards || emptyMsg}

    <section class="card section" style="margin-top:1.25rem">
      <h3 style="margin-top:0">Don’t see your event?</h3>
      <p class="muted">Suggest a parade, fair, breakfast, or community gathering—including nearby events that draw district neighbors.</p>
      <a class="btn btn-primary" href="/volunteer#ideas">Suggest an event idea</a>
    </section>`;
  sendPage(req, res, "Events", body);
});

/* ---------- General volunteer signup + event ideas ---------- */
function activityCheck(value, labelHtml) {
  return `<label class="check-row"><input type="checkbox" name="interest" value="${esc(value)}" /><span>${labelHtml}</span></label>`;
}
function issueCheck(value, labelHtml) {
  return `<label class="check-row"><input type="checkbox" name="issues" value="${esc(value)}" /><span>${labelHtml}</span></label>`;
}
function campaignCheck(value, labelHtml) {
  return `<label class="check-row"><input type="checkbox" name="campaigns" value="${esc(value)}" class="campaign-cb" data-campaign="${esc(value)}" /><span>${labelHtml}</span></label>`;
}
function socialCheck(value, labelHtml) {
  return `<label class="check-row"><input type="checkbox" name="social" value="${esc(value)}" /><span>${labelHtml}</span></label>`;
}

const CAMPAIGN_KIT_MAP = {
  local_three: {
    title: "Win all three local — Housley + Stout + Johnson",
    lit: "Combined local-three pack: SD 33 + 33A + 33B pieces (or joint door piece when printed)",
    events: "All in-district SD 33 / 33A / 33B events",
    shirt: "Local slate shirt if available",
  },
  housley: {
    title: "Karin Housley — Senate District 33 (full district)",
    lit: "Senate 33 lit on every door and event table across all SD 33 communities",
    events: "All SD 33 events in every city and township in the district",
    shirt: "SD 33 / Housley shirt if available",
  },
  stout: {
    title: "Stacey Stout — House District 33A (full district)",
    lit: "House 33A lit for all 33A communities: Dellwood; Forest Lake P-2/4/5; Grant P-2; Hugo; Mahtomedi; Willernie",
    events: "HD 33A-labeled events on /events?district=33A — every 33A community",
    shirt: "Stout / 33A shirt if available",
  },
  johnson: {
    title: "Jessica L. Johnson — House District 33B (full district)",
    lit: "House 33B lit for all 33B communities: Bayport; Forest Lake P-1/3; Marine on St. Croix; May Township; Oak Park Heights; Scandia; Stillwater; Stillwater Township",
    events: "HD 33B-labeled events on /events?district=33B — every 33B community",
    shirt: "Johnson / 33B shirt if available",
  },
  lindell: {
    title: "Mike Lindell & Phillip C. Parrish — Governor / Lt. Governor",
    lit: "AUTO: Governor ticket lit when issued — incorporate with local SD 33 slate",
    events: "District events + statewide governor presence; kit pickup with captains",
    shirt: "Lindell / governor shirt if that campaign issues inventory",
  },
  gov_gop: {
    title: "Governor — GOP nominee (post-primary pack)",
    lit: "Post-primary governor lit for the GOP nominee when issued",
    events: "All community events for local ID + statewide GOTV",
    shirt: "Governor nominee shirt if available",
  },
  us_senate: {
    title: "U.S. Senate — GOP (MN)",
    lit: "U.S. Senate GOP lit (post-primary nominee when issued; pre-primary field pieces when campaigns supply)",
    events: "District + nearby events; federal palm cards only where appropriate",
    shirt: "U.S. Senate campaign shirt if issued",
  },
  ag: {
    title: "Attorney General — GOP",
    lit: "AG GOP lit when field / nominee campaigns issue pieces",
    events: "In-district + nearby community events with full-slate pack",
    shirt: "AG shirt if issued",
  },
  sos: {
    title: "Secretary of State — GOP",
    lit: "SOS GOP lit when field / nominee campaigns issue pieces",
    events: "In-district + nearby; election-integrity messaging only via official lit",
    shirt: "SOS shirt if issued",
  },
  auditor: {
    title: "State Auditor — GOP",
    lit: "Auditor GOP lit when field / nominee campaigns issue pieces",
    events: "Full-slate pack at tables and doors",
    shirt: "Auditor shirt if issued",
  },
  emmer: {
    title: "Tom Emmer — U.S. House MN-06",
    lit: "AUTO: Emmer lit when issued for incorporation. Note: most SD 33 addresses are MN-04 or MN-08 (SOS).",
    events: "Nearby / ticket events + SD 33 community list",
    shirt: "Emmer shirt if that campaign issues inventory",
  },
  stauber: {
    title: "U.S. House MN-08 GOP — Stauber / Hamilton (SD 33 portion)",
    lit: "MN-08 GOP lit (Stauber or Hamilton) for: Forest Lake; Hugo; Marine on St. Croix; May Township; Scandia; Stillwater Township P-1",
    events: "Events in all MN-08 / SD 33 communities listed above",
    shirt: "MN-08 campaign shirt if available",
  },
  cd4: {
    title: "U.S. House MN-04 GOP field (SD 33 portion)",
    lit: "MN-04 GOP lit for: Bayport; Dellwood; Mahtomedi; Oak Park Heights; Stillwater; Willernie; parts of Stillwater Township",
    events: "Events in all MN-04 / SD 33 communities listed above",
    shirt: "MN-04 campaign shirt if available",
  },
};

function campaignKitFor(codes) {
  return codes.map((c) => CAMPAIGN_KIT_MAP[c]).filter(Boolean);
}

function buildBundlePack(codes, houseDistrict) {
  const cand = loadJson(path.join(DATA, "candidates.json"));
  const litIndex = Object.fromEntries((cand.literature || []).map((l) => [l.id, l]));
  const bundleMeta = cand.volunteerBundleCampaigns || [];
  const litIds = new Set(["lit_sample_ballot", "lit_early_vote", "lit_full_slate"]);
  for (const code of codes) {
    const meta = bundleMeta.find((b) => b.id === code);
    if (meta && meta.autoLit) meta.autoLit.forEach((id) => litIds.add(id));
    // Turf-aware local pieces
    if (code === "local_three" || code === "housley") litIds.add("lit_sd33");
    if (code === "local_three" || code === "stout" || houseDistrict === "33A" || houseDistrict === "BOTH")
      litIds.add("lit_33a");
    if (code === "local_three" || code === "johnson" || houseDistrict === "33B" || houseDistrict === "BOTH")
      litIds.add("lit_33b");
  }
  const pieces = [...litIds]
    .map((id) => litIndex[id])
    .filter(Boolean)
    .sort((a, b) => (a.priority || 9) - (b.priority || 9));
  return {
    litPieces: pieces,
    summary:
      pieces.length > 0
        ? pieces.map((p) => p.label).join("; ")
        : "Captains will assemble a starter pack after confirming inventory.",
  };
}

function eventScopeLabel(scope) {
  const map = {
    in: "In-district only (SD 33 / 33A / 33B)",
    nearby: "Nearby events just outside district lines",
    either: "Either in-district or nearby",
    all: "All events — in-district and nearby",
  };
  return map[scope] || "Not specified";
}

function eventScopeHref(scope) {
  if (scope === "in") return "/events?scope=in";
  if (scope === "nearby") return "/events?scope=nearby";
  return "/events";
}

function countPeerVolunteers(entry, allVols) {
  const camps = new Set(entry.campaigns || []);
  const social = new Set(entry.social || []);
  return allVols.filter((v) => {
    if (!v || v.id === entry.id) return false;
    if (!v.connectVolunteers && !v.optIn) return false;
    const shareCamp = (v.campaigns || []).some((c) => camps.has(c));
    const sameHd =
      !entry.houseDistrict ||
      !v.houseDistrict ||
      entry.houseDistrict === "BOTH" ||
      v.houseDistrict === "BOTH" ||
      entry.houseDistrict === v.houseDistrict;
    const shareSocial = (v.social || []).some((s) => social.has(s));
    return (shareCamp || shareSocial) && sameHd;
  }).length;
}

app.get("/volunteer", (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  const eventId = req.query.event || "";
  const today = todayYmd();
  const events = (loadJson(EVENTS_FILE).events || [])
    .filter((e) => isEventUpcoming(e, today))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(
      (e) =>
        `<option value="${esc(e.id)}" ${eventId === e.id ? "selected" : ""}>${esc(e.community ? e.community + " · " : "")}${esc(e.title)} — ${esc(e.dayLabel || e.date || "")}</option>`
    )
    .join("");

  const preActivity = String(req.query.activity || "").trim();
  const preFocus = String(req.query.focus || "").trim();
  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <header class="page-intro">
      <span class="badge pri">About 2 minutes</span>
      <h1>Volunteer with neighbors in SD&nbsp;33</h1>
      <p>Help doors, events, literature, phones, or signs across Senate District&nbsp;33 and House Districts&nbsp;33A and&nbsp;33B. Start with a short interest form—optional details come after.</p>
      <p class="muted"><strong>Development preview:</strong> this form is for layout testing only. Submissions are not stored or transmitted while private development is active.</p>
    </header>

    <section class="card section" aria-label="Short volunteer path">
      <h2 class="section-title" style="margin-top:0">Step 1 — Basic interest</h2>
      <p class="muted" style="margin-top:0">Required fields only. Estimated time: under two minutes.</p>
      <form class="stack" method="post" action="/volunteer" id="vol-form-short">
        <label for="vol-name-s">First and last name *</label>
        <input id="vol-name-s" name="name" required maxlength="100" autocomplete="name" />
        <label for="vol-email-s">Email *</label>
        <input id="vol-email-s" name="email" type="email" required maxlength="160" autocomplete="email" />
        <label for="vol-phone-s">Mobile phone <span class="muted">(optional for now)</span></label>
        <input id="vol-phone-s" name="phone" type="tel" maxlength="40" autocomplete="tel" placeholder="651-555-0100" inputmode="tel" />
        <label for="vol-town-s">City or township <span class="muted">(optional)</span></label>
        <input id="vol-town-s" name="town" maxlength="80" list="vol-towns-s" autocomplete="address-level2" />
        <datalist id="vol-towns-s">
          <option>Bayport</option><option>Dellwood</option><option>Forest Lake</option><option>Grant</option>
          <option>Hugo</option><option>Mahtomedi</option><option>Marine on St. Croix</option><option>May Township</option>
          <option>Oak Park Heights</option><option>Scandia</option><option>Stillwater</option>
          <option>Stillwater Township</option><option>Willernie</option>
        </datalist>
        <label for="vol-act-s">Preferred activity *</label>
        <select id="vol-act-s" name="activities" required>
          <option value="doors" ${preActivity === "doors" ? "selected" : ""}>Knock doors</option>
          <option value="events" ${preActivity === "events" ? "selected" : ""}>Community events</option>
          <option value="phones" ${preActivity === "phones" ? "selected" : ""}>Make calls</option>
          <option value="lit" ${preActivity === "lit" ? "selected" : ""}>Help with literature</option>
          <option value="team_lead" ${preActivity === "team_lead" ? "selected" : ""}>Host or lead a small team</option>
          <option value="signs" ${preActivity === "signs" ? "selected" : ""}>Help with signs</option>
        </select>
        <label for="vol-focus-s">Candidate or district preference <span class="muted">(optional)</span></label>
        <select id="vol-focus-s" name="campaigns">
          <option value="">No preference yet</option>
          <option value="local_three" ${preFocus === "local" ? "selected" : ""}>All three local seats</option>
          <option value="housley" ${preFocus === "housley" ? "selected" : ""}>Karin Housley — SD 33</option>
          <option value="stout" ${preFocus === "stout" ? "selected" : ""}>Stacey Stout — HD 33A</option>
          <option value="johnson" ${preFocus === "johnson" ? "selected" : ""}>Jessica L. Johnson — HD 33B</option>
        </select>
        <fieldset class="consent-fieldset" style="border:1px solid var(--line);border-radius:var(--radius-sm);padding:0.75rem 1rem;margin:0">
          <legend style="font-weight:700;padding:0 0.35rem">Consent *</legend>
          <label class="check-row"><input type="checkbox" name="consentContact" value="yes" required /><span>I understand this is a development preview and that real volunteer intake is not active until the owner enables public mode.</span></label>
          <label class="check-row"><input type="checkbox" name="consentPrivacy" value="yes" required /><span>I have read the <a href="/privacy">privacy notice</a> and understand how contact info would be used when public mode is enabled.</span></label>
        </fieldset>
        <input type="hidden" name="whyVolunteer" value="Quick start interest (full form optional)" />
        <div class="cta-row">
          <button class="btn btn-primary" type="submit">Choose My Volunteer Role</button>
          <a class="btn btn-secondary" href="#vol-full">Add optional preferences</a>
        </div>
        <p class="muted">No marketing, SMS, or data-sharing boxes are pre-checked. Optional contact preferences appear only when public mode is enabled.</p>
      </form>
    </section>

    <div class="two" id="vol-full">
      <section class="card">
        <h3>Full volunteer form</h3>
        <p class="muted">Optional: issues, multiple activities, candidate preferences, and pack notes.</p>
        <form class="stack" method="post" action="/volunteer" id="vol-form">
          <label for="vol-name">Full name *</label>
          <input id="vol-name" name="name" required maxlength="100" autocomplete="name" />

          <label for="vol-email">Email *</label>
          <input id="vol-email" name="email" type="email" required maxlength="160" autocomplete="email" />

          <label for="vol-phone">Mobile phone * <span class="muted">(confirmation text when enabled)</span></label>
          <input id="vol-phone" name="phone" type="tel" required maxlength="40" autocomplete="tel" placeholder="651-555-0100" inputmode="tel" />

          <label for="vol-town">City or township (any in SD 33)</label>
          <input id="vol-town" name="town" maxlength="80" placeholder="Any district community…" list="vol-towns" />
          <datalist id="vol-towns">
            <option>Bayport</option><option>Dellwood</option><option>Forest Lake</option><option>Grant</option>
            <option>Hugo</option><option>Mahtomedi</option><option>Marine on St. Croix</option><option>May Township</option>
            <option>Oak Park Heights</option><option>Scandia</option><option>Stillwater</option>
            <option>Stillwater Township</option><option>Willernie</option>
          </datalist>

          <label for="vol-hd">House District (if known)</label>
          <select id="vol-hd" name="houseDistrict">
            <option value="">Not sure</option>
            <option value="33A">33A — Stacey Stout (Dellwood, FL P-2/4/5, Grant P-2, Hugo, Mahtomedi, Willernie)</option>
            <option value="33B">33B — Jessica L. Johnson (Bayport, FL P-1/3, Marine, May Twp, OPH, Scandia, Stillwater, Stillwater Twp)</option>
            <option value="BOTH">Either / both (full SD 33)</option>
          </select>

          <label for="why-volunteer">Why Are You Volunteering This Election Cycle?</label>
          <textarea id="why-volunteer" name="whyVolunteer" rows="3" maxlength="1200" required placeholder="Examples: candidate merit and leadership for our community, transparency, taxes, schools, public safety, Minnesota’s future…"></textarea>
          <p class="muted" style="margin:0.25rem 0 0.75rem;max-width:520px">We value true merit, leadership for the community, and transparency—along with the issues that matter most to you.</p>

          <p class="form-label-strong" style="font-weight:700;margin:1rem 0 0.35rem">Major Issue(s) of Concern <span class="muted">(check all that apply)</span></p>
          <div class="check-list" role="group" aria-label="Major issues of concern">
            ${issueCheck("taxes", "Taxes")}
            ${issueCheck("education", "Education")}
            ${issueCheck("roads", "Roads")}
            ${issueCheck("public_safety", "Public safety")}
            ${issueCheck("wellbeing", "General well-being of Minnesota and its future")}
            ${issueCheck("all_above", "All of the above and more")}
            <label class="check-row"><input type="checkbox" name="issues" value="other" id="issue-other" /><span>Other</span></label>
          </div>
          <div id="issue-other-box" class="shirt-size-box" aria-live="polite">
            <label for="issue-other-text">Please describe other issue(s)</label>
            <input id="issue-other-text" name="issuesOther" maxlength="400" placeholder="Optional detail if you selected Other" />
          </div>

          <p class="form-label-strong" style="font-weight:700;margin:1rem 0 0.35rem">Preferred Volunteer Activities <span class="muted">(check all that apply)</span></p>
          <div class="check-list" role="group" aria-label="Volunteer activities">
            ${activityCheck("doors", "Door knocking")}
            ${activityCheck("pulsar", "Get on <strong>Pulsar</strong> / field walk lists — meet campaign for access")}
            ${activityCheck("phones", "Phone banking")}
            ${activityCheck("lit", "Literature drops")}
            ${activityCheck("parades", "Parades &amp; festivals")}
            ${activityCheck("breakfasts", "Pancake breakfasts / community meals")}
            ${activityCheck("events", "Event setup / greeters")}
            ${activityCheck("signs", "Yard signs")}
            ${activityCheck("captain", "Town captain / leadership")}
            ${activityCheck("team_lead", "Lead a <strong>small team</strong> through the general election")}
          </div>

          <p class="form-label-strong camp-section-title">Who I want to campaign for <span class="muted">(check all that apply — builds your bundle pack)</span></p>
          <p class="muted camp-hint">Local candidates running in your district first; then U.S. Senate, statewide (Gov, SOS, AG, Auditor), and federal house. Verify names at <a href="https://candidates.sos.mn.gov/" target="_blank" rel="noopener">candidates.sos.mn.gov</a>.</p>

          <p class="camp-group-label">Local priority — full districts (all communities listed on home and /turf)</p>
          <div class="check-list" role="group" aria-label="Local candidates">
            ${campaignCheck("local_three", "<strong>Win all three local</strong> — Housley + Stout + Johnson (full SD 33 / 33A / 33B)")}
            ${campaignCheck("housley", "<strong>Karin Housley</strong> — Senate District 33 (entire district)")}
            ${campaignCheck("stout", "<strong>Stacey Stout</strong> — House District 33A (entire district)")}
            ${campaignCheck("johnson", "<strong>Jessica L. Johnson</strong> — House District 33B (entire district)")}
          </div>

          <p class="camp-group-label">Statewide — Governor, U.S. Senate, SOS, AG, Auditor</p>
          <div class="check-list" role="group" aria-label="Statewide candidates">
            ${campaignCheck("lindell", "<strong>Mike Lindell &amp; Phillip C. Parrish</strong> — Governor / Lt. Governor")}
            ${campaignCheck("gov_gop", "Governor — other <strong>GOP tickets</strong> (Qualls, Demuth, etc. / post-primary nominee pack)")}
            ${campaignCheck("us_senate", "<strong>U.S. Senate</strong> — GOP (Schwarze, Tafoya, White, Weiler, Carney, Gail, Hassan, Lacey, Munro)")}
            ${campaignCheck("ag", "<strong>Attorney General</strong> — Ronald J. Schutz (GOP)")}
            ${campaignCheck("sos", "<strong>Secretary of State</strong> — Wendy Phillips / Tad Jude (GOP)")}
            ${campaignCheck("auditor", "<strong>State Auditor</strong> — Nate George / Scott Jensen / Will Finn (GOP)")}
          </div>

          <p class="camp-group-label">U.S. House (by district portion within SD 33)</p>
          <div class="check-list" role="group" aria-label="Federal house candidates">
            ${campaignCheck("stauber", "<strong>Pete Stauber / Anthony Hamilton</strong> — U.S. House MN-08 GOP (Forest Lake; Hugo; Marine; May Twp; Scandia; Stillwater Twp P-1)")}
            ${campaignCheck("cd4", "<strong>U.S. House MN-04 GOP</strong> — Wikstrom / field (Bayport; Dellwood; Mahtomedi; Oak Park Heights; Stillwater; Willernie; parts of Stillwater Twp)")}
            ${campaignCheck("emmer", "<strong>Tom Emmer</strong> — U.S. House MN-06 (optional connect; most of SD 33 is MN-04 or MN-08)")}
          </div>
          <div id="campaign-kit" class="campaign-kit" aria-live="polite"></div>

          <div class="check-list" style="margin-top:0.75rem">
            <label class="check-row"><input type="checkbox" name="wantBundlePack" value="yes" id="want-pack" />
              <span><strong>Send me a bundle pack</strong> for the candidates I checked (lit, stickers, shirt if sized, early-vote cards when available) — optional, not pre-checked</span></label>
            <label class="check-row"><input type="checkbox" name="requestDbAccess" value="yes" id="req-db" />
              <span><strong>Request field database access</strong> (Pulsar / campaign walk lists) after I meet a captain or candidate campaign. <span class="muted">Not a public voter-file dump — campaign-controlled access only.</span></span></label>
            <label class="check-row"><input type="checkbox" name="connectVolunteers" value="yes" id="connect-vols" />
              <span><strong>Connect me with other volunteers</strong> who share my candidates nearby — optional, not pre-checked</span></label>
          </div>

          <p class="form-label-strong" style="font-weight:700;margin:1rem 0 0.35rem">Events I want to do with like-minded neighbors</p>
          <div class="check-list" role="group" aria-label="Social events">
            ${socialCheck("happy_hour", "Happy hours")}
            ${socialCheck("breakfast", "Breakfasts / pancake mornings")}
            ${socialCheck("lunch", "Working lunches")}
            ${socialCheck("community_events", "Parades, festivals, karaoke &amp; community events")}
            ${socialCheck("doors_together", "Door shifts with a buddy / small team")}
          </div>

          <label for="event-scope">Where should we invite me? <span class="muted">(district geography)</span></label>
          <select id="event-scope" name="eventScope">
            <option value="in">In-district only (SD 33 / 33A / 33B)</option>
            <option value="nearby">Nearby only (just outside district lines)</option>
            <option value="either" selected>Either in-district <strong>or</strong> nearby</option>
            <option value="all">All events — near <strong>and</strong> within district</option>
          </select>
          <p class="muted" style="margin:0.25rem 0 0.75rem">Browse the matching list anytime: <a href="/events?scope=in">in-district</a> · <a href="/events?scope=nearby">nearby</a> · <a href="/events">all</a> · <a href="/events?type=social">social / happy hour / breakfast / lunch</a></p>

          <label for="vol-event">First preferred event <span class="muted">(adds to your calendar after signup)</span></label>
          <select id="vol-event" name="eventId">
            <option value="">No specific event yet — captains will suggest</option>
            ${events}
          </select>

          <p class="form-label-strong" style="font-weight:700;margin:1rem 0 0.35rem">Team lead through general election</p>
          <div class="check-list">
            <label class="check-row"><input type="checkbox" name="teamLead" value="yes" id="team-lead" />
              <span>I want to be a <strong>team lead volunteer</strong> — lead a small team of neighbors through the general election (doors, events, pack handouts)</span></label>
          </div>
          <div id="team-lead-box" class="shirt-size-box" aria-live="polite">
            <label for="team-size">Ideal small-team size</label>
            <select id="team-size" name="teamSize">
              <option value="">Not sure yet</option>
              <option value="2-3">2–3 people</option>
              <option value="4-6">4–6 people</option>
              <option value="7-10">7–10 people</option>
            </select>
            <label for="team-note">Towns / turf I know best (optional)</label>
            <textarea id="team-note" name="teamLeadNote" rows="2" maxlength="400" placeholder="e.g. Stillwater south of Hwy 36, Forest Lake, Hugo…"></textarea>
          </div>

          <label for="vol-avail">Days / times that work</label>
          <textarea id="vol-avail" name="availability" rows="2" maxlength="400" placeholder="e.g. Saturday mornings, Tuesday evenings, lunch hours"></textarea>

          <label for="vol-notes">Notes</label>
          <textarea id="vol-notes" name="notes" rows="2" maxlength="800"></textarea>

          <div class="check-list">
            <label class="check-row"><input type="checkbox" name="optIn" value="yes" id="opt-in" checked />
              <span>Yes — <strong>email and text me</strong> a confirmation, shifts, pack pickup, team connects, and events. I can opt out anytime. <span class="muted">(Msg &amp; data rates may apply.)</span></span></label>
            <label class="check-row"><input type="checkbox" name="wearShirt" value="yes" id="wear-shirt" />
              <span>I can wear a campaign shirt or sticker at public events</span></label>
          </div>
          <div id="shirt-size-box" class="shirt-size-box" aria-live="polite">
            <label for="shirt-size"><strong>Shirt size *</strong> <span class="muted">(required if you checked the shirt box)</span></label>
            <select id="shirt-size" name="shirtSize">
              <option value="">Select size…</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="2XL">2XL</option>
              <option value="3XL">3XL</option>
              <option value="4XL">4XL</option>
            </select>
            <p class="muted" style="margin:0.4rem 0 0">Included in your bundle pack when shirts are in stock.</p>
          </div>

          <div class="check-list" style="margin-top:1rem">
            <label class="check-row"><input type="checkbox" name="wantContribute" value="yes" id="want-contrib" />
              <span><strong>I would like to make a monetary contribution</strong> to a campaign because I don’t have time to volunteer this election cycle; however, I care about our future here in the great state of Minnesota.</span></label>
          </div>
          <div id="contrib-box" class="contrib-box" aria-live="polite">
            <p><strong>Important legal notice (not legal advice — please read):</strong></p>
            <ul style="margin:0.35rem 0;padding-left:1.2rem;font-size:0.92rem">
              <li>This form <strong>does not accept or process payments</strong> and does <strong>not</strong> create a campaign contribution.</li>
              <li>Checking this box only records your <strong>interest</strong>. A captain will follow up with the <strong>official campaign committee</strong> giving page.</li>
              <li>Contributions are subject to federal and/or Minnesota campaign finance rules and are generally <strong>not tax-deductible</strong>.</li>
              <li><strong>Do not</strong> send cash, checks, card numbers, or amounts through this form.</li>
              <li>See <a href="/legal">Legal</a> and <a href="/donate">Donate</a>. Confirm with counsel / CFB / FEC as applicable.</li>
            </ul>
            <label for="contrib-for">I am most interested in supporting (optional)</label>
            <select id="contrib-for" name="contributeFor">
              <option value="">Any / not sure — captain will help</option>
              <option value="local_three">Local three (Housley / Stout / Johnson)</option>
              <option value="housley">Karin Housley — SD 33</option>
              <option value="stout">Stacey Stout — HD 33A</option>
              <option value="johnson">Jessica L. Johnson — HD 33B</option>
              <option value="lindell">Mike Lindell — Governor</option>
              <option value="us_senate">U.S. Senate GOP</option>
              <option value="ag">Attorney General GOP</option>
              <option value="sos">Secretary of State GOP</option>
              <option value="auditor">State Auditor GOP</option>
              <option value="emmer">Tom Emmer — MN-06</option>
              <option value="stauber">Pete Stauber — MN-08</option>
              <option value="cd4">U.S. House MN-04 GOP</option>
            </select>
          </div>

          <button class="btn btn-gold" type="submit">Submit signup · request pack</button>
          <p class="muted" style="max-width:520px">By submitting with contact opt-in, you request confirmation and agree captains may connect you with preferred campaigns, issue a pack, schedule database access after a meet, and introduce you to peer volunteers. <a href="/privacy">Privacy</a> · <a href="/legal">Legal</a></p>
        </form>
      </section>

      <section class="card" id="ideas">
        <h3>What your bundle pack includes</h3>
        <ul>
          <li><strong>Literature</strong> for every candidate you check (local three, U.S. Senate, Gov, SOS, AG, Auditor, federal house) when inventory is available</li>
          <li><strong>Sample ballot / early-vote cards</strong> and stickers</li>
          <li><strong>Shirt</strong> if you checked size (parades &amp; festivals)</li>
          <li><strong>Field access path</strong> — Pulsar / walk lists after captain meet (campaign-controlled)</li>
          <li><strong>Peer team</strong> — happy hours, breakfasts, lunches, events with neighbors who chose the same races</li>
        </ul>
        <p class="muted">Packs are assembled by captains; statewide / federal pieces ship only when those campaigns provide inventory.</p>

        <h3 style="margin-top:1.5rem">Suggest an event idea</h3>
        <p class="muted">Parade, fair, pancake breakfast, happy hour, lunch, or church meal — in district or nearby.</p>
        <form class="stack" method="post" action="/volunteer/idea">
          <label>Your name</label>
          <input name="name" maxlength="100" />
          <label>Contact (email or phone)</label>
          <input name="contact" maxlength="160" />
          <label>Event name *</label>
          <input name="eventName" required maxlength="160" />
          <label>Date (if known)</label>
          <input name="eventDate" maxlength="80" placeholder="e.g. first Saturday in September" />
          <label>Location / city *</label>
          <input name="location" required maxlength="120" />
          <label>In district or nearby?</label>
          <select name="scope">
            <option value="in">Inside SD 33 / 33A / 33B</option>
            <option value="nearby">Just outside — voters will be there</option>
            <option value="unsure">Not sure</option>
          </select>
          <label>Event type</label>
          <select name="eventType">
            <option>Parade</option>
            <option>Pancake breakfast</option>
            <option>Happy hour</option>
            <option>Working lunch</option>
            <option>Festival / fair</option>
            <option>Farmers market</option>
            <option>School / sports</option>
            <option>Church / community meal</option>
            <option>Other</option>
          </select>
          <label>Why it matters / who attends</label>
          <textarea name="why" rows="3" maxlength="1000" required placeholder="e.g. Draws Forest Lake and Hugo families…"></textarea>
          <label>Suggested gear (stickers / lit / shirts)</label>
          <textarea name="gearIdea" rows="2" maxlength="400" placeholder="Optional"></textarea>
          <button class="btn" type="submit">Submit idea</button>
        </form>
        <p style="margin-top:1.25rem"><a href="/events">← Full events list</a> · <a href="/events?type=social">Social calendar</a></p>
      </section>
    </div>

    <section class="card" style="margin-top:1rem">
      <h3>Team lead · general election path</h3>
      <ol>
        <li>Sign up and check candidates → pack is queued.</li>
        <li>Captain connects you to peers and (if requested) database / Pulsar after a short meet.</li>
        <li>Team leads get a small team (2–10), a turf slice, and the events calendar through Nov. 3, 2026.</li>
        <li>Do happy hours, breakfasts, lunches, and doors together — either in-district, nearby, or both.</li>
      </ol>
      <p class="muted">See <a href="/events">event cards</a> for stickers / lit / shirts by setting.</p>
    </section>
    <script src="/js/volunteer-form.js?v=5"></script>`;
  sendPage(req, res, "Volunteer Signup", body);
});

function asArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function buildIcs(event, volunteerName) {
  if (!event || !event.date) return null;
  const uid = (event.id || "event") + "-" + Date.now() + "@sd33-field-hub";
  const summary = (event.title || "SD 33 volunteer event").replace(/\n/g, " ");
  const desc = [
    event.description || "",
    volunteerName ? "Volunteer: " + volunteerName : "",
    event.community ? "Community: " + event.community : "",
    "Gear: stickers / lit / shirts per Field Hub event card",
    "https://sd33-field-hub.onrender.com/events",
  ]
    .filter(Boolean)
    .join("\\n")
    .replace(/\n/g, "\\n");
  const loc = [event.locationName, event.address].filter(Boolean).join(", ");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  let dtStartLine;
  let dtEndLine;
  if (event.timeStart) {
    // Local America/Chicago wall time as floating local (no Z) for phone calendars
    const s = String(event.date).replace(/-/g, "") + "T" + String(event.timeStart).replace(":", "") + "00";
    const endDate = String(event.dateEnd || event.date).replace(/-/g, "");
    const e =
      endDate +
      "T" +
      String(event.timeEnd || event.timeStart || "12:00").replace(":", "") +
      "00";
    dtStartLine = "DTSTART;TZID=America/Chicago:" + s;
    dtEndLine = "DTEND;TZID=America/Chicago:" + e;
  } else {
    const start = String(event.date).replace(/-/g, "");
    let end = event.dateEnd ? String(event.dateEnd).replace(/-/g, "") : start;
    if (end === start) {
      const d = new Date(event.date + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() + 1);
      end = d.toISOString().slice(0, 10).replace(/-/g, "");
    } else {
      const d = new Date((event.dateEnd || event.date) + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() + 1);
      end = d.toISOString().slice(0, 10).replace(/-/g, "");
    }
    dtStartLine = "DTSTART;VALUE=DATE:" + start;
    dtEndLine = "DTEND;VALUE=DATE:" + end;
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SD33 Field Hub//Volunteer//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + stamp,
    dtStartLine,
    dtEndLine,
    "SUMMARY:" + summary,
    "DESCRIPTION:" + desc,
    "LOCATION:" + loc.replace(/\n/g, " "),
    "URL:https://sd33-field-hub.onrender.com/events",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: SD 33 volunteer event",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function notifySignup(entry, eventObj, kits) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.NOTIFY_EMAIL || "";
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE || "";
  const subject = `[SD33] New volunteer: ${entry.name}${entry.teamLead ? " · TEAM LEAD" : ""}${entry.wantBundlePack ? " · PACK" : ""}`;
  const bodyText = [
    `New Field Hub signup`,
    `Name: ${entry.name}`,
    `Email: ${entry.email}`,
    `Phone: ${entry.phone}`,
    `Town: ${entry.town || "—"}`,
    `HD: ${entry.houseDistrict || "—"}`,
    `Why volunteering: ${entry.whyVolunteer || "—"}`,
    `Issues: ${(entry.issues || []).join(", ") || "—"}${entry.issuesOther ? " · other: " + entry.issuesOther : ""}`,
    `Activities: ${(entry.interests || []).join(", ") || "—"}`,
    `Campaigns: ${(entry.campaigns || []).join(", ") || "—"}`,
    `Bundle pack: ${entry.wantBundlePack ? "YES — assemble lit pack" : "no"}`,
    `DB/Pulsar access request: ${entry.requestDbAccess ? "YES — schedule meet" : "no"}`,
    `Connect with peers: ${entry.connectVolunteers ? "yes" : "no"}`,
    `Social: ${(entry.social || []).join(", ") || "—"}`,
    `Event scope: ${entry.eventScope || "—"} (${eventScopeLabel(entry.eventScope || "")})`,
    `Team lead: ${entry.teamLead ? "YES size=" + (entry.teamSize || "?") : "no"} ${entry.teamLeadNote || ""}`,
    `Event: ${entry.eventId || "—"} ${eventObj ? "(" + eventObj.title + ")" : ""}`,
    `Shirt: ${entry.wearShirt ? "yes size=" + (entry.shirtSize || "?") : "no"}`,
    `Wants to contribute (no payment on form): ${entry.wantContribute ? "YES — reach out with legal committee link" : "no"}`,
    `Contribute for: ${entry.contributeFor || "—"}`,
    `Opt-in contact: ${entry.optIn ? "yes" : "no"}`,
    `Notes: ${entry.notes || "—"}`,
    `Availability: ${entry.availability || "—"}`,
    `ACTION: Reach out — connect to preferred candidates, issue pack, peer intro, DB access if requested, assign team if lead.`,
    kits.length
      ? "Kits:\n" + kits.map((k) => `- ${k.title}: lit=${k.lit}`).join("\n")
      : "",
    entry.packSummary ? "Pack lit: " + entry.packSummary : "",
  ].join("\n");

  const result = { email: false, sms: false, adminEmail: false, adminSms: false, errors: [] };

  // Volunteer confirmation email (optional SMTP)
  if (entry.optIn && entry.email && process.env.SMTP_URL) {
    try {
      // Lightweight: use fetch to a webhook if NOTIFY_WEBHOOK set, else skip real SMTP without nodemailer dep
      result.errors.push("SMTP_URL set but nodemailer not bundled — use NOTIFY_WEBHOOK or mailto fallback on confirm page");
    } catch (e) {
      result.errors.push(String(e.message || e));
    }
  }

  // Webhook notification (Zapier/Make/n8n/email service) — recommended on Render
  if (process.env.NOTIFY_WEBHOOK) {
    try {
      await fetch(process.env.NOTIFY_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "volunteer_signup",
          subject,
          text: bodyText,
          entry,
          event: eventObj
            ? { id: eventObj.id, title: eventObj.title, date: eventObj.date }
            : null,
          kits,
          adminEmail,
          adminPhone,
        }),
      });
      result.email = true;
      result.adminEmail = true;
    } catch (e) {
      result.errors.push("webhook: " + (e.message || e));
    }
  }

  // Twilio SMS (optional)
  if (
    entry.optIn &&
    entry.phone &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  ) {
    try {
      const to = entry.phone.replace(/[^\d+]/g, "");
      const msg = `SD33 Field Hub: Thanks ${entry.name.split(" ")[0] || ""}! We got your signup. Captains will connect you to your preferred campaigns. Events: https://sd33-field-hub.onrender.com/events Calendar: https://sd33-field-hub.onrender.com/volunteer/calendar/${entry.id}.ics`;
      const auth = Buffer.from(
        process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
      ).toString("base64");
      const params = new URLSearchParams({
        To: to.startsWith("+") ? to : "+1" + to.replace(/\D/g, "").slice(-10),
        From: process.env.TWILIO_FROM,
        Body: msg.slice(0, 320),
      });
      const r = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + auth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      if (r.ok) result.sms = true;
      else result.errors.push("twilio volunteer: " + (await r.text()).slice(0, 120));
    } catch (e) {
      result.errors.push("twilio: " + (e.message || e));
    }
  }

  if (adminPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    try {
      const to = adminPhone.replace(/[^\d+]/g, "");
      const msg = `SD33 new signup: ${entry.name} ${entry.phone} campaigns=${(entry.campaigns || []).join("+") || "none"} contribute=${entry.wantContribute ? "Y" : "N"} — connect them.`;
      const auth = Buffer.from(
        process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
      ).toString("base64");
      const params = new URLSearchParams({
        To: to.startsWith("+") ? to : "+1" + to.replace(/\D/g, "").slice(-10),
        From: process.env.TWILIO_FROM,
        Body: msg.slice(0, 320),
      });
      const r = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + auth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      if (r.ok) result.adminSms = true;
    } catch (e) {
      result.errors.push("admin sms: " + (e.message || e));
    }
  }

  return result;
}

app.post("/volunteer", async (req, res) => {
  // Accept multi-check interest[] or single select name="activities" from quick-start form
  const interests = [
    ...asArray(req.body.interest).map(String),
    ...asArray(req.body.activities).map(String),
  ].filter(Boolean);
  const campaigns = asArray(req.body.campaigns).map(String).filter(Boolean);
  const social = asArray(req.body.social).map(String);
  const issues = asArray(req.body.issues).map(String);
  const pack = buildBundlePack(campaigns, String(req.body.houseDistrict || ""));
  const entry = {
    id: "vol_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    at: new Date().toISOString(),
    name: String(req.body.name || "").slice(0, 100),
    email: String(req.body.email || "").slice(0, 160),
    phone: String(req.body.phone || "").slice(0, 40),
    town: String(req.body.town || "").slice(0, 80),
    houseDistrict: String(req.body.houseDistrict || ""),
    whyVolunteer: String(req.body.whyVolunteer || "").slice(0, 1200),
    issues,
    issuesOther: String(req.body.issuesOther || "").slice(0, 400),
    interests,
    campaigns,
    social,
    eventScope: String(req.body.eventScope || "either").slice(0, 20),
    wantBundlePack: req.body.wantBundlePack === "yes",
    requestDbAccess: req.body.requestDbAccess === "yes" || interests.includes("pulsar"),
    connectVolunteers: req.body.connectVolunteers === "yes",
    teamLead: req.body.teamLead === "yes" || interests.includes("team_lead"),
    teamSize: String(req.body.teamSize || "").slice(0, 20),
    teamLeadNote: String(req.body.teamLeadNote || "").slice(0, 400),
    packLitIds: (pack.litPieces || []).map((p) => p.id),
    packSummary: String(pack.summary || "").slice(0, 2000),
    eventId: String(req.body.eventId || ""),
    availability: String(req.body.availability || "").slice(0, 400),
    notes: String(req.body.notes || "").slice(0, 800),
    optIn: req.body.optIn === "yes",
    wearShirt: req.body.wearShirt === "yes",
    shirtSize: String(req.body.shirtSize || "").slice(0, 10),
    wantContribute: req.body.wantContribute === "yes",
    contributeFor: String(req.body.contributeFor || "").slice(0, 40),
    consentContact: req.body.consentContact === "yes",
    consentPrivacy: req.body.consentPrivacy === "yes",
    needsCaptainFollowUp: true,
    packStatus: req.body.wantBundlePack === "yes" ? "queued" : "none",
    dbAccessStatus: req.body.requestDbAccess === "yes" || interests.includes("pulsar") ? "requested" : "none",
  };
  if (!entry.name || !entry.email) {
    req.session.flash = "Name and email are required.";
    return res.redirect("/volunteer");
  }
  if (!entry.whyVolunteer || entry.whyVolunteer.trim().length < 3) {
    req.session.flash = "Please share a brief note about why you want to help (or use the quick-start form).";
    return res.redirect("/volunteer");
  }
  if (entry.wearShirt && !entry.shirtSize) {
    req.session.flash = "Please select a shirt size if you can wear a campaign shirt.";
    return res.redirect("/volunteer");
  }

  const list = loadJson(VOL_SIGNUPS_FILE);
  list.unshift(entry);
  saveJson(VOL_SIGNUPS_FILE, list.slice(0, 5000));

  const allEvents = loadJson(EVENTS_FILE).events || [];
  const eventObj = allEvents.find((e) => e.id === entry.eventId) || null;
  const kits = campaignKitFor(campaigns);
  const peerCount = countPeerVolunteers(entry, list);

  // Persist ICS text for download route
  const ics = buildIcs(eventObj, entry.name);
  if (ics) {
    entry.ics = ics;
    list[0] = entry;
    saveJson(VOL_SIGNUPS_FILE, list.slice(0, 5000));
  }

  let notify = { email: false, sms: false, adminEmail: false, adminSms: false, errors: [] };
  try {
    notify = await notifySignup(entry, eventObj, kits);
  } catch (e) {
    notify.errors.push(String(e.message || e));
  }

  const scopeHref = eventScopeHref(entry.eventScope);
  const litListHtml =
    pack.litPieces && pack.litPieces.length
      ? `<ul>${pack.litPieces.map((p) => `<li>${esc(p.label)}</li>`).join("")}</ul>`
      : `<p class="muted">Captains will match inventory to your checked candidates.</p>`;

  const kitHtml = kits.length
    ? `<div class="card" style="margin-top:1rem"><h3>Your campaign kits</h3>
        ${kits
          .map(
            (k) => `<div class="campaign-kit is-open" style="display:block;margin-bottom:0.65rem">
              <strong>${esc(k.title)}</strong>
              <ul>
                <li><strong>Literature:</strong> ${esc(k.lit)}</li>
                <li><strong>Events:</strong> ${esc(k.events)}</li>
                <li><strong>Shirt:</strong> ${esc(k.shirt)}${entry.wearShirt && entry.shirtSize ? " · size " + esc(entry.shirtSize) : ""}</li>
              </ul>
            </div>`
          )
          .join("")}
        </div>`
    : "";

  const packHtml = entry.wantBundlePack
    ? `<div class="card" style="margin-top:1rem;border-left:4px solid var(--gold)">
        <h3>Bundle pack queued</h3>
        <p>Captains will assemble and send / hand off your pack for the races you checked.</p>
        <h4 style="margin:0.75rem 0 0.35rem">Pack contents (when inventory available)</h4>
        ${litListHtml}
        ${entry.wearShirt && entry.shirtSize ? `<p><strong>Shirt size:</strong> ${esc(entry.shirtSize)}</p>` : ""}
        <p class="muted">Status: <strong>${esc(entry.packStatus)}</strong> · Captains mark shipped after handoff.</p>
      </div>`
    : "";

  const accessHtml = entry.requestDbAccess
    ? `<div class="card" style="margin-top:1rem">
        <h3>Field database / Pulsar access</h3>
        <p>Requested. A captain or candidate campaign will meet you, then issue <strong>campaign-controlled</strong> walk-list / Pulsar access. This is not a public voter-file download.</p>
        <p><a class="btn btn-navy" href="/pulsar">Complete Pulsar request form</a></p>
      </div>`
    : "";

  const peersHtml = entry.connectVolunteers
    ? `<div class="card" style="margin-top:1rem">
        <h3>Connect with like-minded volunteers</h3>
        <p>About <strong>${peerCount}</strong> other signup(s) share your campaigns, social interests, or house district. Captains will introduce you for happy hours, breakfasts, lunches, door buddies, and events.</p>
        <p><strong>Your event preference:</strong> ${esc(eventScopeLabel(entry.eventScope))}</p>
        <p>
          <a class="btn btn-gold" href="${scopeHref}">Open matching events</a>
          <a class="btn" href="/events?type=social">Happy hour · breakfast · lunch</a>
        </p>
        <p class="muted">Social picks: ${esc((social || []).join(", ") || "none checked yet — captains will still invite you")}</p>
      </div>`
    : "";

  const leadHtml = entry.teamLead
    ? `<div class="card" style="margin-top:1rem;border-left:4px solid var(--gop)">
        <h3>Team lead — through the general election</h3>
        <p>You’re flagged to lead a small team${entry.teamSize ? ` (preferred size: <strong>${esc(entry.teamSize)}</strong>)` : ""} through Nov. 3, 2026.</p>
        ${entry.teamLeadNote ? `<p class="muted">Turf notes: ${esc(entry.teamLeadNote)}</p>` : ""}
        <p>A captain will assign neighbors, share pack inventory for your team, and put happy hours / breakfasts / lunches on your calendar.</p>
      </div>`
    : "";

  const contribHtml = entry.wantContribute
    ? `<div class="legal-callout"><strong>Contribution interest recorded (no payment taken).</strong>
        A captain will reach out with the <em>official</em> committee giving link for
        ${esc(entry.contributeFor || "your preferred campaign")}.
        Contributions are not tax-deductible. Do not send contribution details by text to random numbers.
        <a href="/donate">Donate info</a> · <a href="/legal">Legal</a></div>`
    : "";

  const calUrl = eventObj
    ? `/volunteer/calendar/${encodeURIComponent(entry.id)}.ics`
    : "";
  const gCal = eventObj ? googleCalendarUrl(eventObj) : "";
  const calHtml = eventObj
    ? `<p><strong>${esc(eventObj.title)}</strong> — ${esc(eventObj.dayLabel || eventObj.date || "")}${
        eventObj.community ? " · " + esc(eventObj.community) : ""
      }</p>
       <p class="cta-row">
         <a class="btn btn-gold" id="cal-download" href="${calUrl}">Download to calendar (.ics)</a>
         ${gCal ? `<a class="btn btn-navy" id="gcal-open" href="${esc(gCal)}" target="_blank" rel="noopener">Open in Google Calendar</a>` : ""}
         <a class="btn" href="/events/${encodeURIComponent(eventObj.id)}.ics">Direct event .ics</a>
       </p>
       <p class="muted">Your calendar file downloads automatically. On iPhone: open the file → Add to Calendar. On Android/Gmail: use Google Calendar. Outlook: open the .ics file.</p>
       <script>
         (function(){
           try {
             var a = document.getElementById("cal-download");
             if (a) setTimeout(function(){ window.location.href = a.getAttribute("href"); }, 400);
             var g = document.getElementById("gcal-open");
             if (g && /Android|iPhone|iPad/i.test(navigator.userAgent) === false) {
               /* desktop: also open Google Calendar tab shortly after */
               setTimeout(function(){ /* keep user on confirm page; they can click Google */ }, 0);
             }
           } catch (e) {}
         })();
       </script>`
    : `<p class="muted">No specific event selected — pick one on <a href="${scopeHref}">upcoming events</a> (signup will send it to your calendar).</p>`;

  const selfEmailBody = [
    "Thanks for signing up with the SD 33 Field Hub.",
    "",
    "Name: " + entry.name,
    "Phone: " + entry.phone,
    "Email: " + entry.email,
    "Campaigns: " + (campaigns.join(", ") || "—"),
    "Bundle pack: " + (entry.wantBundlePack ? "queued" : "no"),
    "Pack lit: " + (entry.packSummary || "—"),
    "DB/Pulsar access: " + (entry.requestDbAccess ? "requested" : "no"),
    "Connect peers: " + (entry.connectVolunteers ? "yes" : "no"),
    "Event scope: " + eventScopeLabel(entry.eventScope),
    "Team lead: " + (entry.teamLead ? "yes " + (entry.teamSize || "") : "no"),
    "Event: " + (eventObj ? eventObj.title + " " + (eventObj.dayLabel || "") : "none yet"),
    eventObj ? "Calendar: https://sd33-field-hub.onrender.com" + calUrl : "",
    "Events: https://sd33-field-hub.onrender.com" + scopeHref,
    "",
    "A captain will reach out to connect you to preferred candidates, issue your pack, and introduce peer volunteers.",
  ]
    .filter(Boolean)
    .join("\n");

  const notifyHtml = `<div class="card"><h3>Email, text &amp; captain follow-up</h3>
    <ul>
      <li>Captains were flagged to <strong>reach out, connect you to preferred candidates, issue your pack, and introduce peers</strong>${notify.adminEmail || notify.adminSms ? " (automated notify sent)" : " (saved at /team/volunteers)"}.</li>
      <li>Your confirmation text: ${notify.sms ? "<strong>sent</strong>" : entry.optIn ? "ready when Twilio is set on Render" : "check opt-in next time"}.</li>
      <li>Your confirmation email: ${notify.email ? "<strong>sent</strong>" : entry.optIn ? "use the button below; set NOTIFY_WEBHOOK for full auto" : "opt-in next time"}.</li>
    </ul>
    <p>
      <a class="btn btn-navy" href="mailto:${encodeURIComponent(entry.email)}?subject=${encodeURIComponent("SD33 Field Hub — your volunteer signup & pack")}&body=${encodeURIComponent(selfEmailBody)}">Open confirmation email to yourself</a>
      <a class="btn" href="mailto:${esc(process.env.ADMIN_NOTIFY_EMAIL || "")}?subject=${encodeURIComponent("SD33 volunteer " + entry.name + (entry.teamLead ? " TEAM LEAD" : "") + " — pack & connect")}&body=${encodeURIComponent("ACTION: Connect volunteer · issue pack · peers · DB if requested · team if lead.\n\nName: " + entry.name + "\nPhone: " + entry.phone + "\nEmail: " + entry.email + "\nCampaigns: " + campaigns.join(", ") + "\nPack: " + (entry.wantBundlePack ? "YES" : "no") + "\nDB: " + (entry.requestDbAccess ? "YES" : "no") + "\nTeam lead: " + (entry.teamLead ? "YES " + entry.teamSize : "no") + "\nScope: " + entry.eventScope + "\nSocial: " + social.join(", "))}">Email captains</a>
    </p>
  </div>`;

  const body = `
    <section class="hero prose">
      <span class="badge published">Signup complete</span>
      <h2>Thank you, ${esc(entry.name.split(" ")[0] || entry.name)}!</h2>
      <p>We have your phone <strong>${esc(entry.phone)}</strong> and email <strong>${esc(entry.email)}</strong>. Next: pack${entry.wantBundlePack ? " queued" : ""}, captain connect, ${entry.connectVolunteers ? "peer introductions, " : ""}${entry.requestDbAccess ? "database access meet, " : ""}${entry.teamLead ? "team-lead assignment, " : ""}and events in your chosen geography.</p>
    </section>
    ${contribHtml}
    ${packHtml}
    ${accessHtml}
    ${peersHtml}
    ${leadHtml}
    <div class="card">
      <h3>Your calendar</h3>
      ${calHtml}
    </div>
    ${kitHtml}
    ${notifyHtml}
    <p style="margin-top:1rem">
      <a class="btn btn-gold" href="/pulsar">Pulsar / door access</a>
      <a class="btn btn-navy" href="/schedule">Claim a shift</a>
      <a class="btn" href="${scopeHref}">Events for you</a>
      <a class="btn" href="/win-three">Three-seat win plan</a>
    </p>`;
  sendPage(req, res, "Signup confirmed", body);
});

app.get("/volunteer/calendar/:id.ics", (req, res) => {
  const id = String(req.params.id || "").replace(/\.ics$/i, "");
  const list = loadJson(VOL_SIGNUPS_FILE);
  const entry = list.find((v) => v.id === id);
  if (!entry || !entry.ics) {
    return res.status(404).type("text").send("Calendar event not found. Re-submit signup with an event selected.");
  }
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="sd33-${id.slice(0, 12)}.ics"`);
  res.send(entry.ics);
});

/** Public .ics only for confirmed upcoming events (no signup required) */
app.get("/events/:id.ics", (req, res) => {
  const id = String(req.params.id || "").replace(/\.ics$/i, "");
  const today = todayYmd();
  const event = (loadJson(EVENTS_FILE).events || []).find((e) => e.id === id);
  if (!event || !isEventUpcoming(event, today)) {
    return res.status(404).type("text").send("Event not found or already past.");
  }
  if (!eventIsConfirmedPublic(event, today)) {
    return res
      .status(404)
      .type("text")
      .send("Calendar file is available only for confirmed events with a known venue. Check the events page for status.");
  }
  const ics = buildIcs(event, "");
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="sd33-event-${id.slice(0, 24)}.ics"`);
  res.send(ics);
});

/** JSON feed for interactive calendar (includes multi-day spans) */
app.get("/api/events.json", (req, res) => {
  const today = todayYmd();
  const all = loadJson(EVENTS_FILE).events || [];
  // Calendar shows upcoming + current multi-day; also recent 7 days for context optional
  const events = all
    .filter((e) => e.date && String(e.dateEnd || e.date) >= today)
    .map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      status: e.status,
      date: e.date,
      dateEnd: e.dateEnd || e.date,
      timeStart: e.timeStart || null,
      timeEnd: e.timeEnd || null,
      dayLabel: e.dayLabel,
      time: e.time,
      community: e.community || "",
      locationName: e.locationName || "",
      address: e.address || "",
      districts: e.districts || [],
      districtScope: e.districtScope || "in",
      priority: e.priority || "",
      description: e.description || "",
      socialShare: e.socialShare || "",
      source: e.source || "",
      gear: e.gear || {},
      volunteerRoles: e.volunteerRoles || [],
      highlight: !!e.highlight,
      googleCalendar: googleCalendarUrl(e),
    }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  res.setHeader("Cache-Control", "public, max-age=120");
  res.json({
    asOf: today,
    count: events.length,
    events,
  });
});

app.get("/calendar", (req, res) => {
  res.redirect(302, "/events#live-calendar");
});

app.post("/volunteer/idea", (req, res) => {
  const entry = {
    id: "idea_" + Date.now(),
    at: new Date().toISOString(),
    name: String(req.body.name || "").slice(0, 100),
    contact: String(req.body.contact || "").slice(0, 160),
    eventName: String(req.body.eventName || "").slice(0, 160),
    eventDate: String(req.body.eventDate || "").slice(0, 80),
    location: String(req.body.location || "").slice(0, 120),
    scope: String(req.body.scope || ""),
    eventType: String(req.body.eventType || ""),
    why: String(req.body.why || "").slice(0, 1000),
    gearIdea: String(req.body.gearIdea || "").slice(0, 400),
  };
  const list = loadJson(EVENT_IDEAS_FILE);
  list.unshift(entry);
  saveJson(EVENT_IDEAS_FILE, list.slice(0, 2000));
  req.session.flash = "Thanks — your event idea was submitted for review.";
  res.redirect("/volunteer#ideas");
});

/* ---------- Pulsar (door knocking app access) ---------- */
app.get("/pulsar", (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <section class="hero prose">
      <span class="badge pri">Door knocking</span>
      <h2>Pulsar — our door-knocking tool</h2>
      <p><strong>Pulsar</strong> is the app used for organized door knocking in this district: walk lists, turf, voter IDs, and results. You cannot self-create a full campaign login. Access is issued after you connect with a candidate campaign or field captain.</p>
    </section>

    <div class="grid" style="margin-bottom:1rem">
      <article class="card">
        <h3>How to get on Pulsar</h3>
        <ol>
          <li><strong>Sign up below</strong> to request Pulsar access.</li>
          <li><strong>Meet a candidate’s campaign</strong> (or field captain) for training and account activation.</li>
          <li>Install / open Pulsar as directed and log in with the credentials they provide.</li>
          <li>Join a Saturday door shift with a buddy until you are comfortable solo.</li>
        </ol>
        <p class="muted">Accounts are campaign-controlled for data security and compliance. This Field Hub does not store voter-file passwords.</p>
      </article>
      <article class="card">
        <h3>Which campaign?</h3>
        <p>Ask for Pulsar through the team you are walking for:</p>
        <ul>
          <li><strong>State Senate SD 33</strong> — Karin Housley (GOP)</li>
          <li><strong>House 33A</strong> — Stacey Stout (GOP)</li>
          <li><strong>House 33B</strong> — Jessica L. Johnson (GOP)</li>
          <li>Or the joint field team coordinating St. Croix Valley turf</li>
        </ul>
        <p><a class="btn btn-navy" href="/volunteer">General volunteer signup</a>
        <a class="btn" href="/schedule">Door shifts</a></p>
      </article>
    </div>

    <div class="two">
      <section class="card">
        <h3>Request Pulsar access</h3>
        <form class="stack" method="post" action="/pulsar">
          <label>Full name *</label>
          <input name="name" required maxlength="100" />
          <label>Email *</label>
          <input name="email" type="email" required maxlength="160" />
          <label>Phone *</label>
          <input name="phone" required maxlength="40" />
          <label>City / town</label>
          <input name="town" maxlength="80" />
          <label>I want to walk for *</label>
          <select name="campaign" required>
            <option value="">Select…</option>
            <option value="housley">Senate 33 — Karin Housley</option>
            <option value="stout">House 33A — Stacey Stout</option>
            <option value="johnson">House 33B — Jessica L. Johnson</option>
            <option value="joint">Joint / any St. Croix Valley doors</option>
            <option value="unsure">Not sure yet</option>
          </select>
          <label>House district turf (if known)</label>
          <select name="houseDistrict">
            <option value="">Not sure</option>
            <option value="33A">33A</option>
            <option value="33B">33B</option>
            <option value="BOTH">Either / both</option>
          </select>
          <label>Door-knocking experience</label>
          <select name="experience">
            <option value="none">New — never used a walk app</option>
            <option value="some">Some doors / other apps</option>
            <option value="pulsar">Already used Pulsar before</option>
            <option value="captain">Ready to lead turf</option>
          </select>
          <label>I can meet a campaign for setup *</label>
          <select name="meet" required>
            <option value="yes_saturday">Yes — Saturday door shift</option>
            <option value="yes_weekday">Yes — weekday evening</option>
            <option value="yes_call">Yes — phone/Zoom first</option>
            <option value="need_times">Need times offered to me</option>
          </select>
          <label>Preferred meet times</label>
          <textarea name="meetTimes" rows="2" maxlength="400" placeholder="e.g. Saturdays after 10 a.m., Tuesday evenings"></textarea>
          <label>Device you’ll use</label>
          <select name="device">
            <option value="iphone">iPhone</option>
            <option value="android">Android</option>
            <option value="either">Either / not sure</option>
          </select>
          <label>Notes</label>
          <textarea name="notes" rows="2" maxlength="800" placeholder="Prior campaigns, neighborhood you know best…"></textarea>
          <label style="font-weight:500"><input type="checkbox" name="optIn" value="yes" required /> I understand a campaign captain must approve my Pulsar login and may contact me to schedule a meet.</label>
          <label style="font-weight:500"><input type="checkbox" name="contactOk" value="yes" required /> Yes — email/text me about Pulsar setup and door shifts</label>
          <button class="btn btn-gold" type="submit">Request Pulsar access</button>
        </form>
      </section>

      <section class="card">
        <h3>What happens after you submit</h3>
        <ol>
          <li>Your request is saved for the field team.</li>
          <li>A captain from the campaign you selected contacts you.</li>
          <li>You meet (in person or call) for a short training and account invite.</li>
          <li>You download/open <strong>Pulsar</strong> with the invite they send — not a public self-serve signup.</li>
          <li>You pull turf in Pulsar and walk doors (often with a buddy the first time).</li>
        </ol>
        <div class="card" style="background:#fffbeb;border:1px solid #e0b84a;box-shadow:none;margin-top:1rem">
          <h3 style="margin-top:0">Important</h3>
          <p style="margin:0">There is no public “create account” button that grants campaign voter data. If someone online asks you for money or a password to “join Pulsar,” stop and contact your campaign captain instead.</p>
        </div>
        <p style="margin-top:1rem"><a class="btn btn-navy" href="/field/doors">Door lists &amp; field tips</a></p>
      </section>
    </div>`;
  sendPage(req, res, "Pulsar access", body);
});

app.post("/pulsar", (req, res) => {
  const entry = {
    id: "pul_" + Date.now(),
    at: new Date().toISOString(),
    name: String(req.body.name || "").slice(0, 100),
    email: String(req.body.email || "").slice(0, 160),
    phone: String(req.body.phone || "").slice(0, 40),
    town: String(req.body.town || "").slice(0, 80),
    campaign: String(req.body.campaign || ""),
    houseDistrict: String(req.body.houseDistrict || ""),
    experience: String(req.body.experience || ""),
    meet: String(req.body.meet || ""),
    meetTimes: String(req.body.meetTimes || "").slice(0, 400),
    device: String(req.body.device || ""),
    notes: String(req.body.notes || "").slice(0, 800),
    optIn: req.body.optIn === "yes",
    contactOk: req.body.contactOk === "yes",
    status: "pending_campaign_meet",
  };
  if (!entry.name || !entry.email || !entry.phone || !entry.campaign) {
    req.session.flash = "Please complete name, email, phone, and campaign.";
    return res.redirect("/pulsar");
  }
  const list = loadJson(PULSAR_FILE);
  list.unshift(entry);
  saveJson(PULSAR_FILE, list.slice(0, 3000));
  req.session.flash =
    "Request received. A campaign captain will contact you to meet and get you on Pulsar. Check your email/phone.";
  res.redirect("/pulsar");
});

app.get("/team/pulsar", (req, res) => {
  const list = loadJson(PULSAR_FILE);
  const rows = list
    .map(
      (p) => `<tr>
        <td class="muted">${esc((p.at || "").slice(0, 16).replace("T", " "))}</td>
        <td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.email)} · ${esc(p.phone)}</div></td>
        <td>${esc(p.campaign)} · HD ${esc(p.houseDistrict || "?")}</td>
        <td>${esc(p.experience)} · ${esc(p.device)}</td>
        <td>${esc(p.meet)}<div class="muted">${esc(p.meetTimes || "")}</div></td>
        <td class="muted">${esc(p.status || "pending")}</td>
      </tr>`
    )
    .join("");
  const body = `
    <section class="hero">
      <h2>Pulsar access requests</h2>
      <p><strong>${list.length}</strong> pending / recent · Contact volunteers to schedule campaign meet &amp; issue login</p>
      <p><a class="btn" href="/pulsar">Public Pulsar page</a></p>
    </section>
    <div class="card">
      <table>
        <thead><tr><th>When</th><th>Volunteer</th><th>Campaign</th><th>Experience</th><th>Meet</th><th>Status</th></tr></thead>
        <tbody>${rows || "<tr><td colspan=6>No requests yet</td></tr>"}</tbody>
      </table>
    </div>`;
  sendPage(req, res, "Pulsar requests", body);
});

app.get("/team/volunteers", (req, res) => {
  const vols = loadJson(VOL_SIGNUPS_FILE);
  const ideas = loadJson(EVENT_IDEAS_FILE);
  const packQueued = vols.filter((v) => v.wantBundlePack || v.packStatus === "queued").length;
  const teamLeads = vols.filter((v) => v.teamLead).length;
  const dbReq = vols.filter((v) => v.requestDbAccess || v.dbAccessStatus === "requested").length;
  const vrows = vols
    .slice(0, 150)
    .map(
      (v) =>
        `<tr>
          <td>${esc(v.name)}${v.teamLead ? ' <span class="badge pri">TEAM LEAD</span>' : ""}
            <div class="muted">${esc(v.email)} ${esc(v.phone || "")}</div></td>
          <td>${esc(v.town)} ${esc(v.houseDistrict)}
            <div class="muted">Scope: ${esc(v.eventScope || "—")}</div></td>
          <td>${esc((v.interests || []).join(", "))}
            <div class="muted">Why: ${esc((v.whyVolunteer || "").slice(0, 100))}</div>
            <div class="muted">Issues: ${esc((v.issues || []).join(", ") || "—")}${v.issuesOther ? " · " + esc(String(v.issuesOther).slice(0, 60)) : ""}</div>
            <div class="muted">Campaigns: ${esc((v.campaigns || []).join(", ") || "—")}</div>
            <div class="muted">Social: ${esc((v.social || []).join(", ") || "—")}</div></td>
          <td>
            ${v.wantBundlePack ? `<strong>PACK ${esc(v.packStatus || "queued")}</strong><div class="muted" style="max-width:220px">${esc((v.packSummary || "").slice(0, 120))}</div>` : "—"}
            ${v.requestDbAccess ? "<div>DB/Pulsar requested</div>" : ""}
            ${v.connectVolunteers ? "<div>Connect peers</div>" : ""}
            ${v.teamLead ? `<div>Lead ${esc(v.teamSize || "")} ${esc((v.teamLeadNote || "").slice(0, 60))}</div>` : ""}
          </td>
          <td>${v.optIn ? "opt-in" : "—"} ${v.wantContribute ? "· <strong>GIVE</strong>" : ""} ${v.wearShirt ? "· shirt " + esc(v.shirtSize || "") : ""}
            <div class="muted">${esc((v.at || "").slice(0, 16))}</div></td>
        </tr>`
    )
    .join("");
  const irows = ideas
    .slice(0, 50)
    .map(
      (i) =>
        `<tr>
          <td><strong>${esc(i.eventName)}</strong><div class="muted">${esc(i.eventType)} · ${esc(i.scope)}</div></td>
          <td>${esc(i.location)} · ${esc(i.eventDate)}</td>
          <td>${esc(i.why)}</td>
          <td class="muted">${esc(i.name)} ${esc(i.contact)}</td>
        </tr>`
    )
    .join("");
  const body = `
    <section class="hero"><h2>Volunteer signups &amp; event ideas</h2>
    <p>${vols.length} signups · <strong>${packQueued}</strong> packs · <strong>${teamLeads}</strong> team leads · <strong>${dbReq}</strong> DB/Pulsar requests · ${ideas.length} ideas</p>
    <p class="muted">ACTION per row: issue pack, connect to candidates, peer intro, DB meet, assign team if lead.</p></section>
    <div class="card"><h3>Signups</h3>
    <table><thead><tr><th>Name</th><th>Town / HD / scope</th><th>Interests · campaigns · social</th><th>Pack · DB · peers · lead</th><th>Flags / when</th></tr></thead>
    <tbody>${vrows || "<tr><td colspan=5>None yet</td></tr>"}</tbody></table></div>
    <div class="card" style="margin-top:1rem"><h3>Event ideas</h3>
    <table><thead><tr><th>Event</th><th>Where / when</th><th>Why</th><th>From</th></tr></thead>
    <tbody>${irows || "<tr><td colspan=4>None yet</td></tr>"}</tbody></table></div>`;
  sendPage(req, res, "Volunteer admin", body);
});

/* ---------- Volunteer schedule board ---------- */
app.get("/schedule", (req, res) => {
  const data = loadJson(SCHEDULE_FILE);
  const flash = req.session.flash;
  delete req.session.flash;
  const rows = (data.shifts || [])
    .map((s) => {
      const n = (s.signedUp || []).length;
      const open = Math.max(0, (s.slots || 0) - n);
      const names = (s.signedUp || [])
        .map((u) => esc(u.name))
        .join(", ");
      return `<tr>
        <td><strong>${esc(s.label)}</strong><div class="muted">${esc(s.date)} · ${esc(s.time)}</div></td>
        <td>${esc(s.location)}</td>
        <td>${n} / ${esc(s.slots)} <span class="muted">(${open} open)</span></td>
        <td class="muted">${names || "—"}</td>
        <td>
          <form method="post" action="/schedule/signup" class="stack" style="margin:0">
            <input type="hidden" name="shiftId" value="${esc(s.id)}" />
            <input name="name" required placeholder="Your name" maxlength="80" style="max-width:140px" />
            <input name="contact" placeholder="Email or phone" maxlength="120" style="max-width:140px" />
            <label style="font-weight:500;font-size:0.85rem"><input type="checkbox" name="optIn" value="yes" /> Email/SMS updates (opt-in)</label>
            <button class="btn btn-sm" type="submit" ${open <= 0 ? "disabled" : ""}>Sign up</button>
          </form>
        </td>
      </tr>`;
    })
    .join("");
  const body = `
    ${flash ? `<div class="flash">${esc(flash)}</div>` : ""}
    <section class="hero prose">
      <h2>Volunteer schedule board</h2>
      <p>Claim a shift for doors, phones, or community events—including Karaoke Night in Stillwater. Captains follow up by email or phone when you opt in.</p>
    </section>
    <div class="card">
      <table>
        <thead><tr><th>Shift</th><th>Location</th><th>Filled</th><th>Signed up</th><th>Join</th></tr></thead>
        <tbody>${rows || "<tr><td colspan=5>No shifts posted</td></tr>"}</tbody>
      </table>
    </div>`;
  sendPage(req, res, "Volunteer board", body);
});

app.post("/schedule/signup", (req, res) => {
  const id = String(req.body.shiftId || "");
  const name = String(req.body.name || "").trim().slice(0, 80);
  const contact = String(req.body.contact || "").trim().slice(0, 120);
  const optIn = req.body.optIn === "yes";
  if (!name) {
    req.session.flash = "Name is required.";
    return res.redirect("/schedule");
  }
  withDbSafeSchedule((data) => {
    const s = (data.shifts || []).find((x) => x.id === id);
    if (!s) return;
    if ((s.signedUp || []).length >= (s.slots || 99)) return;
    s.signedUp = s.signedUp || [];
    s.signedUp.push({
      name,
      contact,
      optIn,
      at: new Date().toISOString(),
    });
  });
  req.session.flash = "You are signed up. Thank you for volunteering.";
  res.redirect("/schedule");
});

function withDbSafeSchedule(fn) {
  const data = loadJson(SCHEDULE_FILE);
  fn(data);
  saveJson(SCHEDULE_FILE, data);
}

/* ---------- Roadmap / gaps (professional) ---------- */
app.get("/roadmap", (req, res) => {
  const road = loadJson(ROADMAP_FILE);
  const rows = (road.items || [])
    .map(
      (i) => `<tr>
        <td><strong>${esc(i.piece)}</strong></td>
        <td>${esc(i.why)}</td>
        <td>${esc(i.status)}</td>
        <td class="${i.done ? "status-done" : "status-open"}">${i.done ? "In place" : "Next"}</td>
      </tr>`
    )
    .join("");
  const body = `
    <section class="hero prose">
      <h2>${esc(road.title || "Roadmap")}</h2>
      <p>${esc(road.intro || "")}</p>
    </section>
    <div class="card" style="margin-bottom:1rem">
      <h3>Capacity gaps &amp; status</h3>
      <table>
        <thead><tr><th>Missing piece</th><th>Why it wins</th><th>Status here</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="card prose">
      <h3>Sample win-number framework (illustrative)</h3>
      <p>Close house races in this region have been decided by hundreds of votes. Organizing targets (refine with past precinct returns):</p>
      <ul>
        <li><strong>House 33B:</strong> prioritize Stillwater and corridor precincts; multi-touch doors + early vote.</li>
        <li><strong>House 33A:</strong> Forest Lake / Hugo density; open-seat visibility.</li>
        <li><strong>Senate 33:</strong> every turf carries Senate literature with house pieces.</li>
      </ul>
      <p><a class="btn" href="/field/phones/export">Export phone list (CSV)</a>
      <a class="btn btn-navy" href="/map">District map</a></p>
    </div>`;
  sendPage(req, res, "Roadmap", body);
});

/* ---------- Phone export for P2P tools ---------- */
app.get("/field/phones/export", (req, res) => {
  const contacts = (loadContacts().contacts || []).filter((c) => c.phone || c.name);
  const header = "name,phone,city,houseDistrict,partyAffiliation,notes\n";
  const lines = contacts
    .map((c) =>
      [c.name, c.phone, c.city, c.houseDistrict, c.partyAffiliation, (c.notes || "").replace(/,/g, ";")]
        .map((x) => `"${String(x || "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="sd33-phone-export.csv"');
  res.send(header + lines);
});

/* ---------- Donate placeholder ---------- */
app.get("/donate", (req, res) => {
  const body = `
    <section class="hero prose">
      <h2>Support field work</h2>
      <p>Contributions help fund literature, yard signs, and volunteer supplies across Senate District 33 and House Districts 33A and 33B.</p>
    </section>
    <div class="card prose">
      <h3>Online giving</h3>
      <p class="muted">A WinRed or committee donation link will appear here once the legal campaign entity is designated. Until then, contact the field team to contribute through the proper channel.</p>
      <p><strong>Placeholder:</strong> <span class="muted">[WinRed / committee URL — not yet connected]</span></p>
      <p>Paid for by the sponsoring committee when designated. Contributions are not tax-deductible.</p>
      <a class="btn btn-navy" href="/schedule">Volunteer instead</a>
    </div>`;
  sendPage(req, res, "Support", body);
});

/* ---------- Spanish quick guide ---------- */
app.get("/es", (req, res) => {
  const body = `
    <section class="hero prose">
      <h2>Guía rápida (Español)</h2>
      <p>Bienvenidos al centro de voluntarios del Valle de St. Croix — Distrito del Senado 33 y Distritos de la Cámara 33A y 33B en el condado de Washington, Minnesota.</p>
    </section>
    <div class="card prose">
      <ul>
        <li><a href="/map">Mapa de distritos</a> — busque su dirección y vea candidatos</li>
        <li><a href="/events">Eventos</a> — incluido karaoke el sábado 1 de agosto de 2026 en Stillwater</li>
        <li><a href="/schedule">Horario de voluntarios</a> — inscríbase en un turno</li>
        <li><a href="/my-gop-ballot">Boleta</a> — candidatos republicanos (GOP) por dirección</li>
      </ul>
      <p class="muted">El sitio principal está en inglés. Para la boleta oficial: <a href="https://pollfinder.sos.mn.gov/">pollfinder.sos.mn.gov</a>.</p>
      <a class="btn" href="/">English home</a>
    </div>`;
  sendPage(req, res, "Español", body);
});

app.get("/accessibility", (req, res) => {
  const body = `
    <section class="hero prose">
      <h2>Accessibility</h2>
      <p>We aim for clear language, keyboard-friendly forms, skip links, and readable contrast. Report barriers via the <a href="/review">feedback form</a>.</p>
      <ul>
        <li>Skip to main content link on every page</li>
        <li>Visible focus outlines on controls</li>
        <li>Map has a text address form alternative to clicking</li>
        <li>Spanish quick guide at <a href="/es">/es</a></li>
      </ul>
    </section>`;
  sendPage(req, res, "Accessibility", body);
});

/* ---------- Legal / privacy / win three seats ---------- */
/* Launch/hosting/cost notes are NOT on the public site — see docs/LAUNCH-AND-COSTS.md */

app.get("/legal", (req, res) => {
  const body = `
    <section class="hero prose">
      <span class="badge pri">Compliance</span>
      <h2>Legal &amp; election rules (state &amp; federal)</h2>
      <p><strong>This page is educational for volunteers and the public. It is not legal advice.</strong>
      Campaigns and committees should confirm requirements with counsel, the
      <a href="https://cfb.mn.gov/" target="_blank" rel="noopener">Minnesota Campaign Finance Board</a>, and (for federal races) the
      <a href="https://www.fec.gov/" target="_blank" rel="noopener">Federal Election Commission</a>.</p>
    </section>

    <div class="legal-callout">
      <strong>What this site is:</strong> An independent St. Croix Valley field / volunteer resource focused on
      <strong>Senate District 33</strong>, <strong>House 33A</strong>, and <strong>House 33B</strong>.
      It is <strong>not</strong> a government website and does not replace the Secretary of State or county election offices.
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>1. Minnesota — campaigning near polls (Election Day / primary)</h3>
      <ul>
        <li><strong>No campaigning</strong> inside a polling place or <strong>within 100 feet</strong> of the building where a polling place is located, or anywhere on the <strong>public property</strong> where a polling place sits (Minn. Stat. §§ <a href="https://www.revisor.mn.gov/statutes/cite/204C.06" target="_blank" rel="noopener">204C.06</a>, <a href="https://www.revisor.mn.gov/statutes/cite/211B.11" target="_blank" rel="noopener">211B.11</a>).</li>
        <li>Similar rules can apply near <strong>ballot drop boxes</strong> (see statutes / SOS guidance).</li>
        <li>Adjacent <strong>private property</strong> is treated differently from public polling property — still follow captain instructions and local counsel.</li>
        <li>Official SOS summary: <a href="https://www.sos.mn.gov/elections-voting/election-day-voting/polling-place-rules/" target="_blank" rel="noopener">Polling place rules</a>.</li>
      </ul>
      <div class="legal-ok"><strong>Field practice:</strong> Use GOTV chase lists and legal distances only. Do not wear/campaign inside the restricted zone.</div>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>2. Minnesota — campaign materials &amp; signs (Ch. 211B)</h3>
      <ul>
        <li>Fair Campaign Practices (Minn. Stat. Ch. <a href="https://www.revisor.mn.gov/statutes/cite/211B" target="_blank" rel="noopener">211B</a>) cover false statements, certain campaign conduct, and related rules.</li>
        <li><strong>Yard signs:</strong> Prefer private property with owner permission. Avoid public rights-of-way / boulevards unless lawfully permitted. Local ordinances may also apply outside protected periods.</li>
        <li>Printed / paid materials funded by a committee generally need correct <strong>“Paid for by…”</strong> disclaimer language. Have the treasurer/counsel set final wording before mass print or paid digital ads.</li>
        <li>Register and report as required with the <a href="https://cfb.mn.gov/" target="_blank" rel="noopener">Campaign Finance Board</a> if you form or act as a committee.</li>
      </ul>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>3. Federal — mailboxes, FEC, federal candidates</h3>
      <ul>
        <li><strong>Never place literature in U.S. Postal Service mailboxes</strong> (federal mailbox protection rules). Use doors, hangers, or hand-to-hand only.</li>
        <li>This site lists federal races (U.S. Senate, U.S. House MN-04 / MN-08) for volunteer awareness. Activity that is paid and expressly advocates federal candidates can trigger <a href="https://www.fec.gov/" target="_blank" rel="noopener">FEC</a> registration, reporting, and disclaimer rules for the paying committee.</li>
        <li>Do not use government resources (public employee time, official emails, public funds) for campaigning.</li>
      </ul>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>4. Texting &amp; email (TCPA / CAN-SPAM principles)</h3>
      <ul>
        <li>This hub uses <strong>opt-in checkboxes</strong> before marketing/shift texts or emails.</li>
        <li>Only message people who opted in or who provided a number for campaign follow-up consistent with applicable law and carrier rules.</li>
        <li>Provide a way to stop messages; honor opt-outs promptly.</li>
        <li>Campaigns using peer-to-peer platforms must follow that vendor’s compliance rules and federal/state telemarketing law.</li>
      </ul>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>5. Voter data, Pulsar &amp; privacy</h3>
      <ul>
        <li>Minnesota voter file / campaign CRM data (including <strong>Pulsar</strong> walk lists) is restricted. Use only for lawful political purposes authorized by the campaign.</li>
        <li>Do not scrape, sell, or post personal voter data from this site.</li>
        <li>Pulsar logins are issued by a campaign after a meet — not via public self-registration for full voter data.</li>
        <li>See our <a href="/privacy">Privacy notice</a> for how volunteer form data is handled.</li>
      </ul>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>6. Accuracy of candidates &amp; maps</h3>
      <ul>
        <li>Map layers are built from <strong>SOS precinct GeoJSON (May 2026)</strong> for visualization; always confirm ballots at <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">pollfinder</a>.</li>
        <li>Candidate lists are from public filings/reporting and may change. Verify before printing lit.</li>
      </ul>
    </div>

    <div class="card prose">
      <h3>Checklist for captains before big actions</h3>
      <ul class="checklist">
        <li>Correct paid-for-by line on printed/paid pieces</li>
        <li>Private property permission for signs</li>
        <li>No mailbox stuffing</li>
        <li>100-foot / public-property poll rules on Election Day</li>
        <li>Opt-in only for texts/emails</li>
        <li>Pulsar users trained; no sharing logins</li>
        <li>Questions → campaign counsel / CFB / FEC as appropriate</li>
      </ul>
      <p><a class="btn" href="/win-three">Maximize the three-seat win</a>
      <a class="btn btn-navy" href="/privacy">Privacy</a></p>
    </div>`;
  sendPage(req, res, "Legal", body);
});

app.get("/privacy", (req, res) => {
  const body = `
    <section class="hero prose">
      <h2>Privacy notice</h2>
      <p>How this Field Hub handles information you submit. <strong>Not legal advice.</strong></p>
    </section>
    <div class="card prose">
      <h3>What we collect</h3>
      <ul>
        <li>Volunteer signups (name, contact, town, interests, availability)</li>
        <li>Pulsar access requests (including preferred campaign and meet times)</li>
        <li>Event ideas and feedback comments</li>
        <li>Shift board signups</li>
        <li>Optional literature / preference responses</li>
      </ul>
      <h3>How we use it</h3>
      <ul>
        <li>To schedule volunteers and issue Pulsar / walk assignments via candidate campaigns</li>
        <li>To improve the site and field plan</li>
        <li>Only for political / organizing purposes related to SD 33, HD 33A, HD 33B and related tickets</li>
      </ul>
      <h3>What we do not do</h3>
      <ul>
        <li>Sell your contact list</li>
        <li>Publish your phone number on public pages without need</li>
        <li>Provide public access to the full voter file</li>
      </ul>
      <h3>Retention &amp; security</h3>
      <p>Data is stored on the hosting server (and local campaign copies if captains export it). Access should be limited to trusted organizers. You may request correction or removal of your volunteer signup by contacting the field team email used by captains.</p>
      <h3>Cookies</h3>
      <p>A session cookie supports login for any admin tools and flash messages. It is not used for third-party ad tracking on this hub.</p>
      <p><a class="btn btn-navy" href="/legal">Legal &amp; election rules</a></p>
    </div>`;
  sendPage(req, res, "Privacy", body);
});

app.get("/win-three", (req, res) => {
  const body = `
    <section class="photo-hero valley">
      <div class="photo-hero-content">
        <span class="badge pri">Recruit · Organize · Win</span>
        <h2>Three seats. One district. Full slate.</h2>
        <p>Everything on this hub points to winning <strong>Senate District 33</strong>, <strong>House 33A</strong>, and <strong>House 33B</strong> — then stacking turnout for the ticket.</p>
        <div class="cta-row">
          <a class="btn btn-gold" href="/volunteer">Volunteer now</a>
          <a class="btn" href="/pulsar">Get on Pulsar</a>
          <a class="btn btn-navy" href="/events">Events &amp; parades</a>
        </div>
      </div>
    </section>

    <div class="grid" style="margin-bottom:1.25rem">
      <article class="card win-seat-card">
        <span class="tag-gop">GOP</span> <span class="badge pri">SD 33</span>
        <h3>State Senate 33</h3>
        <p style="font-size:1.2rem;font-weight:800;margin:0.35rem 0">Karin Housley</p>
        <p class="muted">Every turf · every door piece · every event welcome table</p>
        <ul class="checklist">
          <li>Always on the lit bundle</li>
          <li>Name ID in Pulsar conversations</li>
          <li>Yard signs with house piece where possible</li>
        </ul>
      </article>
      <article class="card win-seat-card">
        <span class="tag-gop">GOP</span> <span class="badge pri">HD 33A</span>
        <h3>State House 33A</h3>
        <p style="font-size:1.2rem;font-weight:800;margin:0.35rem 0">Stacey Stout</p>
        <p class="muted">Hugo · Mahtomedi · Dellwood · Forest Lake P-2/4/5 · Willernie</p>
        <ul class="checklist">
          <li>Open seat — visibility wins</li>
          <li>Pulsar turf in 33A only</li>
          <li>Priority: Hugo + FL 33A precincts</li>
        </ul>
        <a class="btn" href="/map">Map 33A</a>
      </article>
      <article class="card win-seat-card">
        <span class="tag-gop">GOP</span> <span class="badge pri">HD 33B</span>
        <h3>State House 33B</h3>
        <p style="font-size:1.2rem;font-weight:800;margin:0.35rem 0">Jessica L. Johnson</p>
        <p class="muted">Stillwater · Bayport · OPH · Scandia · Marine · May Twp · FL P-1/3</p>
        <ul class="checklist">
          <li>Challenge race — multi-touch doors</li>
          <li>Lumberjack Days + Main Street presence</li>
          <li>Pulsar + busy-street signs</li>
        </ul>
        <a class="btn" href="/map">Map 33B</a>
      </article>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>Recruitment engine (use this sequence)</h3>
      <ol>
        <li><strong>Sign up</strong> — <a href="/volunteer">/volunteer</a> (doors, events, breakfasts, parades)</li>
        <li><strong>Get on Pulsar</strong> — <a href="/pulsar">/pulsar</a> then meet Housley / Stout / Johnson campaign</li>
        <li><strong>Claim a shift</strong> — <a href="/schedule">/schedule</a></li>
        <li><strong>Staff events</strong> — <a href="/events">/events</a> with correct stickers, lit, shirts</li>
        <li><strong>Bring a friend</strong> — every volunteer lists 5 neighbors to invite</li>
      </ol>
    </div>

    <div class="card prose" style="margin-bottom:1rem">
      <h3>Field math for a true win</h3>
      <ul>
        <li>33B has been decided by roughly hundreds of votes — every shift matters</li>
        <li>33A is open — first name ID + yard signs in Hugo/Mahtomedi/FL 33A</li>
        <li>SD 33 unifies the slate — never drop Housley from the door kit</li>
        <li>Forest Lake is split — always check precinct (map / Pulsar / pollfinder)</li>
      </ul>
      <div class="legal-ok"><strong>Legal while winning:</strong> private-property signs, no mailboxes, 100-foot poll rules, opt-in texts, accurate lit. Details on <a href="/legal">/legal</a>.</div>
    </div>

    <div class="grid">
      <article class="card">
        <h3>Start this week</h3>
        <a class="btn btn-gold" href="/volunteer">Volunteer signup</a><br/>
        <a class="btn" href="/pulsar">Pulsar request</a><br/>
        <a class="btn btn-navy" href="/events">Pick an event</a>
      </article>
      <article class="card">
        <h3>Share recruitment link</h3>
        <p>Send neighbors: <code>https://sd33-field-hub.onrender.com/win-three</code></p>
        <a class="btn" href="/share">Copy share tools</a>
      </article>
      <article class="card">
        <h3>Captains</h3>
        <p><a href="/team/volunteers">Volunteer list</a> · <a href="/team/pulsar">Pulsar queue</a> · <a href="/team/sign-asks">Sign asks</a></p>
      </article>
    </div>`;
  sendPage(req, res, "Win the three seats", body);
});

/* ---------- District Facts, About, Sources, Corrections, Portal ---------- */
app.get("/district-facts", (req, res) => {
  const data = loadCandidates();
  const body = `
    <header class="page-intro">
      <h1>District Facts</h1>
      <p>Geography and structure for Senate District&nbsp;33 and House Districts&nbsp;33A and&nbsp;33B. Election results and vote totals are only stated when cited from official sources—verify before publishing.</p>
    </header>
    <section class="card section">
      <h2 class="section-title">How the district is structured</h2>
      <p>Minnesota Senate District&nbsp;33 elects one state senator and is paired with two House districts: <strong>33A</strong> and <strong>33B</strong>. Local candidates serve the <strong>full district</strong> for which they file—not a single hometown.</p>
      <div class="grid" style="margin-top:1rem">
        <article class="community-tile">${areaListHtml("sd33")}</article>
        <article class="community-tile">${areaListHtml("hd33a")}</article>
        <article class="community-tile">${areaListHtml("hd33b")}</article>
      </div>
    </section>
    <section class="card section">
      <h2 class="section-title">U.S. House within SD&nbsp;33</h2>
      <p class="muted">Parts of SD&nbsp;33 fall in MN-04 and MN-08. Lists below are geography, not candidate residence.</p>
      <div class="grid" style="margin-top:0.75rem">
        <article class="community-tile">${areaListHtml("cd4_in_sd33")}</article>
        <article class="community-tile">${areaListHtml("cd8_in_sd33")}</article>
      </div>
    </section>
    <section class="card section">
      <h2 class="section-title">Key election dates (verify with SOS)</h2>
      <ul>
        <li>State primary: <strong>August 11, 2026</strong> (confirm on SOS calendar)</li>
        <li>General election: <strong>November 3, 2026</strong> (confirm on SOS calendar)</li>
      </ul>
      <p class="muted">Candidate file as of ${esc(data.asOf || "—")}. <a href="https://www.sos.mn.gov/" target="_blank" rel="noopener">sos.mn.gov</a></p>
    </section>
    <section class="card section" id="voting-records">
      <h2 class="section-title">Voting records &amp; results</h2>
      <p>This page intentionally does <strong>not</strong> invent 2024 presidential city-level totals, legislative margins, or turnout figures. When the owner attaches cited official results (SOS canvass, county abstract, or legislative journals), they will appear here with clear “official result” versus “site calculation” labels.</p>
      <ul>
        <li>Use the Minnesota Secretary of State for official election results and filings.</li>
        <li>Legislative roll-call voting records belong to the Minnesota Legislature’s official systems—not this Field Hub.</li>
        <li>Competitive history for organizing context is discussed only when cited; see Corrections if a figure looks wrong.</li>
      </ul>
      <p class="muted">Map: <a href="/map">District Map</a> · Candidate directory: <a href="/candidates">Candidates</a></p>
    </section>
    <section class="card section">
      <h2 class="section-title">Methodology &amp; sources</h2>
      <ul>
        <li>Community lists: assembled from public SOS precinct geography notes maintained in this project’s data files.</li>
        <li>Candidate names: public filings / SOS-style lists as recorded in <code>candidates.json</code>.</li>
        <li>Official ballot and precinct: always use <a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">pollfinder.sos.mn.gov</a> and <a href="https://myballotmn.sos.mn.gov/" target="_blank" rel="noopener">myballotmn.sos.mn.gov</a>.</li>
      </ul>
      <p>See also <a href="/sources">Sources</a> and <a href="/corrections">Corrections</a>. Map: <a href="/map">District Map</a>.</p>
    </section>`;
  sendPage(req, res, "District Facts", body);
});

app.get("/about", (req, res) => {
  const body = `
    <header class="page-intro">
      <h1>About this Field Hub</h1>
      <p>A volunteer-built district organizing and voter-information project for Minnesota Senate District&nbsp;33 and House Districts&nbsp;33A and&nbsp;33B.</p>
    </header>
    <section class="card prose section">
      <h2>What this is</h2>
      <p>Neighbors in the St.&nbsp;Croix Valley use this site to look up districts, review candidates on file, find events, and—when public mode is activated—volunteer for field work.</p>
      <h2>What this is not</h2>
      <ul>
        <li>Not an official government website</li>
        <li>Not legal advice</li>
        <li>Not currently a public campaign, political committee, or fundraising platform (development preview)</li>
        <li>Not paid for by a candidate committee unless and until the owner documents otherwise</li>
      </ul>
      <h2>Development status</h2>
      <p>Built with uncompensated volunteer time on free hosting. Forms that would collect volunteer or contribution data are blocked while <code>PRIVATE_DEVELOPMENT</code> is active.</p>
      <p><a href="/sources">Sources</a> · <a href="/corrections">Corrections</a> · <a href="/legal">Legal</a> · <a href="/privacy">Privacy</a></p>
    </section>`;
  sendPage(req, res, "About", body);
});

app.get("/sources", (req, res) => {
  const body = `
    <header class="page-intro">
      <h1>Sources</h1>
      <p>Primary official sources for elections, precincts, and candidate filings in Minnesota.</p>
    </header>
    <section class="card section">
      <ul>
        <li><a href="https://www.sos.mn.gov/" target="_blank" rel="noopener">Minnesota Secretary of State</a></li>
        <li><a href="https://pollfinder.sos.mn.gov/" target="_blank" rel="noopener">Poll finder / precinct lookup</a></li>
        <li><a href="https://myballotmn.sos.mn.gov/" target="_blank" rel="noopener">What's on My Ballot</a></li>
        <li><a href="https://candidates.sos.mn.gov/" target="_blank" rel="noopener">Candidate filings</a></li>
      </ul>
      <p class="muted">This Field Hub’s JSON data files are secondary compilations for organizing convenience. They can lag or contain errors—always confirm with the SOS.</p>
      <p><a href="/corrections">Report a correction →</a></p>
    </section>`;
  sendPage(req, res, "Sources", body);
});

app.get("/corrections", (req, res) => {
  const body = `
    <header class="page-intro">
      <h1>Corrections</h1>
      <p>Help us keep district, candidate, and event information accurate.</p>
    </header>
    <section class="card prose section">
      <p>If you find an error in geography, candidate names, party labels, or event details:</p>
      <ol>
        <li>Check the official source (usually the Minnesota Secretary of State).</li>
        <li>Send a note through the <a href="/review">feedback form</a> with the page URL, what is wrong, and the correct source link.</li>
      </ol>
      <p class="muted">While this site is in development preview, submissions may be blocked. You can still use the feedback page to capture a draft note for the owner.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/review">Open feedback</a>
        <a class="btn btn-secondary" href="/sources">View sources</a>
      </div>
    </section>`;
  sendPage(req, res, "Corrections", body);
});

app.get("/portal", (req, res) => {
  const body = `
    <div class="portal-notice">
      <h1>Field &amp; Captain Portal</h1>
      <p style="margin:0;max-width:40rem">Operational tools for authorized field work. These pages are not part of the main public journey. They remain available for development and captains; they are not a password-secured campaign system unless separately configured.</p>
    </div>
    <p class="muted">Public visitors: start with <a href="/my-gop-ballot">Find My Ballot</a>, <a href="/volunteer">Volunteer</a>, or <a href="/events">Events</a>.</p>
    <div class="portal-grid section">
      <a class="portal-link" href="/field"><strong>Field tools hub</strong><span>Doors, phones, signs, streets, polls</span></a>
      <a class="portal-link" href="/field/doors"><strong>Door lists</strong><span>Walk list views</span></a>
      <a class="portal-link" href="/field/phones"><strong>Phone lists</strong><span>Call list views</span></a>
      <a class="portal-link" href="/pulsar"><strong>Pulsar request</strong><span>Door-walk platform intake</span></a>
      <a class="portal-link" href="/schedule"><strong>Shift board</strong><span>Sign-ups for shifts</span></a>
      <a class="portal-link" href="/team/volunteers"><strong>Volunteer list</strong><span>Captain view</span></a>
      <a class="portal-link" href="/team/sign-asks"><strong>Sign asks</strong><span>Yard sign log</span></a>
      <a class="portal-link" href="/team/preferences"><strong>Preference totals</strong><span>Ballot preference rollups</span></a>
      <a class="portal-link" href="/roadmap"><strong>Roadmap</strong><span>Capacity &amp; build plan</span></a>
      <a class="portal-link" href="/win-playbook"><strong>Field guide</strong><span>Playbook content</span></a>
      <a class="portal-link" href="/win-three"><strong>Win path</strong><span>Three-seat plan</span></a>
      <a class="portal-link" href="/carry"><strong>Carry literature</strong><span>Pack selection form</span></a>
    </div>`;
  sendPage(req, res, "Field Portal", body, { bodyClass: "page-portal" });
});

app.listen(PORT, "0.0.0.0", () => {
  const ips = lanIps();
  console.log(`St. Croix Valley Field Hub`);
  console.log(`  Local:  http://localhost:${PORT}`);
  if (PUBLIC_URL) console.log(`  Public: ${PUBLIC_URL}`);
  if (ips.length) {
    for (const ip of ips) console.log(`  LAN:    http://${ip}:${PORT}`);
  }
});
