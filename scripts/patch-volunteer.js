/**
 * One-shot patch: replace volunteer GET route with two-step form.
 */
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "server.js");
let s = fs.readFileSync(file, "utf8");
const start = s.indexOf('app.get("/volunteer", (req, res) => {');
const end = s.indexOf("function asArray(val)", start);
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `app.get("/volunteer", (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;
  const eventId = req.query.event || "";
  const today = todayYmd();
  const events = dedupeEvents(loadJson(EVENTS_FILE).events || [])
    .filter((e) => isEventUpcoming(e, today))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map(
      (e) =>
        \`<option value="\${esc(e.id)}" \${eventId === e.id ? "selected" : ""}>\${esc(e.community ? e.community + " · " : "")}\${esc(e.title)} — \${esc(e.dayLabel || e.date || "")}</option>\`
    )
    .join("");

  const preActivity = String(req.query.activity || "").trim();
  const preFocus = String(req.query.focus || "").trim();
  const devNote = PRIVATE_DEVELOPMENT
    ? \`<div class="flash" role="status"><strong>Development preview:</strong> You can test this interface. No personal information is stored or transmitted while private development is active.</div>\`
    : "";

  const body = \`
    \${flash ? \`<div class="flash">\${esc(flash)}</div>\` : ""}
    \${devNote}
    <header class="page-intro">
      <span class="badge pri">Two short steps</span>
      <h1>Volunteer</h1>
      <p>Help doors, events, literature, phones, or signs in Senate District&nbsp;33 and House Districts&nbsp;33A and&nbsp;33B. Step&nbsp;1 is required. Step&nbsp;2 is optional.</p>
    </header>

    <form class="stack card section" method="post" action="/volunteer" id="vol-two-step">
      <div id="vol-step-1" class="vol-step">
        <h2 class="section-title" style="margin-top:0">Step 1 — Basic interest</h2>
        <p class="muted" style="margin-top:0">About one minute. Only the fields below.</p>
        <label for="vol-name">Name *</label>
        <input id="vol-name" name="name" required maxlength="100" autocomplete="name" />
        <label for="vol-email">Email *</label>
        <input id="vol-email" name="email" type="email" required maxlength="160" autocomplete="email" />
        <label for="vol-town">City or township *</label>
        <input id="vol-town" name="town" required maxlength="80" list="vol-towns" autocomplete="address-level2" />
        <datalist id="vol-towns">
          <option>Bayport</option><option>Dellwood</option><option>Forest Lake</option><option>Grant</option>
          <option>Hugo</option><option>Mahtomedi</option><option>Marine on St. Croix</option><option>May Township</option>
          <option>Oak Park Heights</option><option>Scandia</option><option>Stillwater</option>
          <option>Stillwater Township</option><option>Willernie</option>
        </datalist>
        <label for="vol-act">Preferred activity *</label>
        <select id="vol-act" name="activities" required>
          <option value="doors" \${preActivity === "doors" ? "selected" : ""}>Knock doors</option>
          <option value="events" \${preActivity === "events" ? "selected" : ""}>Community events</option>
          <option value="phones" \${preActivity === "phones" ? "selected" : ""}>Make calls</option>
          <option value="lit" \${preActivity === "lit" ? "selected" : ""}>Help with literature</option>
          <option value="team_lead" \${preActivity === "team_lead" ? "selected" : ""}>Host or lead a small team</option>
          <option value="signs" \${preActivity === "signs" ? "selected" : ""}>Help with signs</option>
        </select>
        <label for="vol-focus">Candidate or district preference</label>
        <select id="vol-focus" name="campaigns">
          <option value="">No preference yet</option>
          <option value="local_three" \${preFocus === "local" ? "selected" : ""}>All three local seats</option>
          <option value="housley" \${preFocus === "housley" ? "selected" : ""}>Karin Housley — SD 33</option>
          <option value="stout" \${preFocus === "stout" ? "selected" : ""}>Stacey Stout — HD 33A</option>
          <option value="johnson" \${preFocus === "johnson" ? "selected" : ""}>Jessica L. Johnson — HD 33B</option>
        </select>
        <fieldset class="consent-fieldset">
          <legend>Consent *</legend>
          <label class="check-row"><input type="checkbox" name="consentContact" value="yes" required /><span>I understand this development site does not accept live volunteer registrations until public mode is enabled.</span></label>
          <label class="check-row"><input type="checkbox" name="consentPrivacy" value="yes" required /><span>I have read the <a href="/privacy">privacy notice</a>.</span></label>
        </fieldset>
        <input type="hidden" name="whyVolunteer" value="Volunteer interest via two-step form" />
        <div class="cta-row">
          <button type="button" class="btn btn-secondary" id="vol-to-step-2">Continue to optional details</button>
          <button type="submit" class="btn btn-primary">Choose My Volunteer Role</button>
        </div>
      </div>

      <div id="vol-step-2" class="vol-step" hidden>
        <h2 class="section-title" style="margin-top:0" tabindex="-1">Step 2 — Optional preferences</h2>
        <p class="muted" style="margin-top:0">Skip any field. You can submit from step&nbsp;1 without this section.</p>
        <label for="vol-avail">Availability</label>
        <textarea id="vol-avail" name="availability" rows="2" maxlength="400" placeholder="e.g. Saturday mornings, Tuesday evenings"></textarea>
        <label for="vol-event">Specific event</label>
        <select id="vol-event" name="eventId">
          <option value="">No specific event yet</option>
          \${events}
        </select>
        <label class="check-row" style="margin-top:0.75rem"><input type="checkbox" name="teamLead" value="yes" /><span>I am interested in leadership / leading a small team</span></label>
        <label for="vol-shirt">Shirt size <span class="muted">(optional)</span></label>
        <select id="vol-shirt" name="shirtSize">
          <option value="">Prefer not to say</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="2XL">2XL</option>
          <option value="3XL">3XL</option>
        </select>
        <label for="vol-notes">Additional notes</label>
        <textarea id="vol-notes" name="notes" rows="3" maxlength="800" placeholder="Anything else we should know"></textarea>
        <div class="cta-row">
          <button type="button" class="btn btn-secondary" id="vol-back-1">Back to step 1</button>
          <button type="submit" class="btn btn-primary">Choose My Volunteer Role</button>
        </div>
      </div>
    </form>

    <section class="card section" id="ideas" style="margin-top:1.25rem">
      <h2 class="section-title" style="margin-top:0">Suggest an event idea</h2>
      <p class="muted">Optional. Also not stored while development mode is active.</p>
      <form class="stack" method="post" action="/volunteer/idea">
        <label>Your name</label>
        <input name="name" maxlength="100" />
        <label>Contact (email or phone)</label>
        <input name="contact" maxlength="160" />
        <label>Event name *</label>
        <input name="eventName" required maxlength="160" />
        <label>Location / city *</label>
        <input name="location" required maxlength="120" />
        <label>Why it matters</label>
        <textarea name="why" rows="2" maxlength="1000" required></textarea>
        <button class="btn btn-secondary" type="submit">Submit idea</button>
      </form>
    </section>
  \`;

  const volJs = \`
  <script>
  (function(){
    var step1 = document.getElementById('vol-step-1');
    var step2 = document.getElementById('vol-step-2');
    var to2 = document.getElementById('vol-to-step-2');
    var back = document.getElementById('vol-back-1');
    var form = document.getElementById('vol-two-step');
    function show2(){
      if (!form.checkValidity()) { form.reportValidity(); return; }
      step1.hidden = true;
      step2.hidden = false;
      var h = step2.querySelector('h2');
      if (h && h.focus) h.focus();
      window.scrollTo({ top: Math.max(0, form.offsetTop - 80), behavior: 'smooth' });
    }
    function show1(){
      step2.hidden = true;
      step1.hidden = false;
      window.scrollTo({ top: Math.max(0, form.offsetTop - 80), behavior: 'smooth' });
    }
    if (to2) to2.addEventListener('click', show2);
    if (back) back.addEventListener('click', show1);
  })();
  </script>\`;

  sendPage(req, res, "Volunteer", body, { extraFoot: volJs });
});

`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(file, s);
console.log("Volunteer route replaced OK");
