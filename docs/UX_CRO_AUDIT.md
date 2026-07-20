# UX / CRO Audit — St. Croix Valley Field Hub

**Date:** 2026-07-20  
**Live:** https://sd33-field-hub.onrender.com/  
**Stack:** Node.js + Express (monolithic `server.js`), JSON data files, session cookies, static assets in `public/`, Render free hosting  
**Mode:** `PRIVATE_DEVELOPMENT=true` (default) — form POSTs blocked for data collection  

## Stack inventory

| Area | Finding |
|------|---------|
| Framework | Express 4, no React/Vue/template engine — HTML strings in `server.js` |
| Routes | 50+ GET/POST routes (public IA + field ops + team tools) |
| Data | `data/*.json` (candidates, events, geo, contacts, prefs, etc.) |
| Auth | Session only; no real captain auth / portal lock beyond env flag |
| External | SOS links, optional webhook/Twilio, Nominatim-style geocode API route |
| Tests | None (`package.json` has start/seed only) |
| CSS | Single large `public/css/lit.css` |
| JS | `nav-active.js`, `site-ux.js`, map/calendar helpers |

---

## Global issues

| Theme | Problems | Recommendation |
|-------|----------|----------------|
| IA | Primary nav mixes voter tools with Pulsar, field tools, roadmap, shift board | Public nav: Home, Ballot, Candidates, Events, Volunteer, District Facts, More. Ops → Portal |
| CRO | Multiple competing CTAs; homepage is operations manual | Single primary path: ballot → candidates → volunteer/events |
| Trust | Large multi-paragraph development notice dominates | Slim banner + expandable details; preserve legal meaning |
| Mobile | Horizontal scroll nav; no hamburger; tiny touch areas | Hamburger with focus trap, body lock, Esc |
| Visual | Red-default buttons; heavy patriotic gradients; card soup | Civic navy/river/evergreen/cream; red for emphasis only |
| A11y | Focus styles mixed; nav density; long pages | Skip link, landmarks, 44px targets, visible focus |
| Performance | Large homepage HTML; many images above fold; CSS monofile OK | Lazy images; fewer hero assets; progressive disclosure |
| Content | Field targets, phase plans, lit rules on home | Move to Field Guide / Portal; keep public pages short |

---

## Page audits

### Home `/`

| Field | Detail |
|-------|--------|
| Purpose | Orient visitors; drive ballot lookup & volunteer |
| Primary visitor | Resident / potential volunteer |
| Primary conversion | Find My Ballot |
| Secondary | Volunteer, Events, Candidates |
| Problems | Wall of field ops content; multi-CTA hero; gallery + long legal image rights; promotes TBA karaoke as featured |
| Nav | Crowded; ops tools in More |
| Hierarchy | Address tool buried under hero CTAs and gallery on live deploy |
| Density | Extreme — weekly targets table, phase plan, lit strategy |
| Mobile | Long scroll; sticky CTA partial |
| A11y | Landmark OK; density hurts comprehension |
| Trust | Dev notice heavy; SOS links present |
| Performance | 5 hero gallery images |
| Recommended | Full CRO homepage structure (hero 3 actions, lookup, 3 local cards, ≤3 events, help chooser, facts, transparency, final CTA) |
| Move elsewhere | Phase plan, weekly targets, lit rules → field guide / portal |
| Visibility | Public |

### Find your ballot `/my-gop-ballot`

| Field | Detail |
|-------|--------|
| Purpose | Address → districts → sample ballot / GOP prefs |
| Primary visitor | Voter / door walker |
| Primary conversion | Submit address; view ballot |
| Secondary | Save prefs (blocked in dev) |
| Problems | Long form; preference + sign-ask + field tools mixed; “LEADING” risk |
| Recommended | Clean SOS-style flow; clarify provisional; keep ops secondary |
| Visibility | Public |

### District map `/map`

| Field | Detail |
|-------|--------|
| Purpose | Visual district overlays |
| Primary conversion | Understand geography; click for candidates |
| Problems | Leaflet heavy; sidebar dense |
| Recommended | Keep; polish chrome; link from District Facts |
| Visibility | Public |

### Candidates `/candidates`

| Field | Detail |
|-------|--------|
| Purpose | Full filed slate |
| Problems | No search/filter; very long; GOP/other columns only |
| Recommended | Filterable directory; local first; all parties; no unsupported “LEADING” |
| Visibility | Public |

### Events `/events`

| Field | Detail |
|-------|--------|
| Purpose | Calendar / list of activities |
| Problems | Planned/TBA mixed with confirmed language |
| Recommended | Status badges; don’t promote TBA as confirmed; ICS keep |
| Visibility | Public |

### Volunteer `/volunteer`

| Field | Detail |
|-------|--------|
| Purpose | Signup |
| Problems | Extremely long form; high abandonment |
| Recommended | Short path (name/email/phone + activity) then optional expand; keep full form for power users |
| Visibility | Public (submissions blocked in dev) |

### Win SD 33 `/win-three`, Roadmap `/roadmap`, Field guide `/win-playbook`

| Field | Detail |
|-------|--------|
| Purpose | Strategy / capacity |
| Visibility | Public secondary or portal-linked — keep routes; remove from primary nav |

### Field tools `/field/*`, Pulsar, Schedule, Team/*

| Field | Detail |
|-------|--------|
| Purpose | Operational |
| Problems | Exposed in More nav |
| Recommended | Group under `/portal` landing; keep routes; not primary nav |
| Visibility | Operational (treat as private intent; no false security claims) |

### Support `/donate`, Share, Legal, Privacy, Accessibility, Español, Review

| Field | Detail |
|-------|--------|
| Purpose | Compliance / language / feedback |
| Recommended | Footer + More; polish legal length via link-outs |
| Visibility | Public |

---

## Conversion ranking (implementation priority)

1. Find district/ballot  
2. Volunteer  
3. Confirmed event  
4. Supported local candidates  
5. All filed candidates  
6. Official candidate website  
7. Share  
8. Updates (future, not active)

---

## Assumptions

- No inventing candidate bios, websites, images, or confirmation counts  
- Events with `venue TBA` / `status: planned` are not “confirmed”  
- Development lock remains until owner sets `PRIVATE_DEVELOPMENT=false`  
- No deployment in this redesign pass  
- “Supported by this volunteer project” label for Housley / Stout / Johnson only (owner project priority seats)  
- No captain authentication system exists; portal is IA separation only  

## Unresolved (owner decisions)

- Official candidate campaign URLs and licensed photos  
- Which events are confirmed vs planned  
- Whether portal routes need password protection  
- Production SEO when leaving private development  
- Contribution / committee activation (legal counsel)  
