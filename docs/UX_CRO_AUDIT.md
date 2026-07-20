# UX / CRO Audit — St. Croix Valley Field Hub

**Date:** 2026-07-20 (updated after redesign implementation)  
**Live (pre-redesign deploy):** https://sd33-field-hub.onrender.com/  
**Local project:** `C:\Users\alana\Documents\sd33-litdrop`  
**Branch:** `full-design-ui-cro-redesign`  
**Backup:** tag `redesign-backup-2026-07-20` / commit `57fcd74`  
**Stack:** Node.js + Express (monolithic `server.js`), JSON data files, session cookies, static assets in `public/`, Render free hosting  
**Mode:** `PRIVATE_DEVELOPMENT=true` (default) — form POSTs blocked for data collection  

## Stack inventory

| Area | Finding |
|------|---------|
| Framework | Express 4, no React/Vue/template engine — HTML strings in `server.js` |
| Routes | 50+ GET/POST routes (public IA + field ops + team tools) |
| Data | `data/*.json` (candidates, events, geo, contacts, prefs, etc.) |
| Auth | Session only; portal is IA separation, not password auth |
| External | SOS links, optional webhook/Twilio, Nominatim-style geocode API |
| Tests | `npm test` → `scripts/smoke-test.js` (HTTP smoke checks) |
| CSS | `public/css/design-system.css` (tokens + shell) + `lit.css` (legacy compat) |
| JS | `site-shell.js`, `nav-active.js`, `analytics.js` (disabled), map/calendar helpers |

---

## Global issues (baseline → redesign response)

| Theme | Baseline problems | Redesign response |
|-------|-------------------|-------------------|
| IA | Nav mixed voters with Pulsar, field tools, roadmap | Public: Home, Ballot, Candidates, Events, Volunteer, District Facts, More. Ops → `/portal` |
| CRO | Competing CTAs; homepage = operations manual | Hero 3 actions; ballot → candidates → volunteer/events hierarchy |
| Trust | Multi-paragraph development notice dominated | Slim banner + expandable “Development details”; legal meaning preserved |
| Mobile | Horizontal scroll nav; no hamburger | Hamburger with focus trap, Esc, body lock, sticky 3-action bar |
| Visual | Red-default buttons; dense cards | Civic navy/river/evergreen/cream; red only for accent |
| A11y | Weak focus; dense tables | Skip link, landmarks, focus-visible, larger targets |
| Performance | Many hero images; ops content on home | Home content reduced; calendar/gear collapsed on events |
| Events | TBA mixed with “featured” | Confirmed / proposed / past views; ICS only for confirmed |
| Volunteer | Very long first form; pre-checked packs | Quick start step; optional prefs; no pre-checked marketing |

---

## Page audits

### Home `/`

| Field | Detail |
|-------|--------|
| Purpose | Orient visitors; drive ballot lookup & volunteer |
| Primary visitor | Resident / potential volunteer |
| Primary conversion | Find My Ballot |
| Secondary | Volunteer, Events, Candidates |
| Baseline problems | Wall of field ops; multi-CTA hero; gallery + long image-rights; TBA karaoke featured |
| Redesign | Hero + trust strip + address lookup + 3 supported local cards + ≤3 confirmed events + help tiles + facts + transparency + final CTA |
| Visibility | Public |

### Find My Ballot `/my-gop-ballot`

| Field | Detail |
|-------|--------|
| Purpose | Address → districts → sample ballot |
| Primary conversion | Complete lookup |
| Problems (residual) | Preference tooling and ops notes still dense on result view |
| Recommended next | Further progressive disclosure on preference/sign-ask blocks |
| Visibility | Public |

### District map `/map`

| Field | Detail |
|-------|--------|
| Purpose | Visual district overlays |
| Residual | Leaflet keyboard path still limited |
| Visibility | Public |

### Candidates `/candidates`

| Field | Detail |
|-------|--------|
| Purpose | Full filed slate |
| Redesign | Search + office + level + party filters; local races first; supported label; no unsupported LEADING |
| Visibility | Public |

### Events `/events`

| Field | Detail |
|-------|--------|
| Purpose | Discover confirmed activities |
| Redesign | Default **confirmed only**; proposed/venue-pending and past separated; gear in accordion; ICS gated |
| Visibility | Public |

### Volunteer `/volunteer`

| Field | Detail |
|-------|--------|
| Purpose | Low-friction interest → optional detail |
| Redesign | Step 1 quick start; full form optional; no pre-checked packs/connect; development-mode messaging |
| Visibility | Public (submissions blocked in dev) |

### District Facts `/district-facts`

| Field | Detail |
|-------|--------|
| Purpose | Geography, structure, methodology |
| Voting records | Explicit placeholder: no invented totals; `#voting-records` anchor |
| Visibility | Public |

### Win SD 33 `/win-three`, Roadmap `/roadmap`, Field guide `/win-playbook`

| Field | Detail |
|-------|--------|
| Visibility | Routes preserved; linked from portal / secondary, not primary nav |

### Field tools `/field/*`, Pulsar, Schedule, Team/*

| Field | Detail |
|-------|--------|
| Visibility | Operational intent under `/portal` (not password-secured unless owner configures) |

### Support `/donate`, Share, Legal, Privacy, Accessibility, Español, Review

| Field | Detail |
|-------|--------|
| Visibility | Footer + More |

---

## Conversion ranking (implementation priority)

1. Find district/ballot  
2. Volunteer  
3. Confirmed event  
4. Supported local candidates  
5. All filed candidates  
6. Official candidate / SOS website  
7. Share  
8. Updates (future, not active)

---

## Assumptions

- No inventing candidate bios, websites, images, or confirmation counts  
- Events with venue TBA / status planned are **not** “confirmed”  
- Development lock remains until owner sets `PRIVATE_DEVELOPMENT=false`  
- No deployment in this redesign pass  
- “Supported by this volunteer project” for Housley / Stout / Johnson only  
- Portal is IA separation only — not a claim of secure multi-tenant auth  

## Unresolved (owner decisions)

- Official candidate campaign URLs and licensed photos  
- Which events are truly confirmed vs planned  
- Whether portal routes need password protection  
- Production SEO when leaving private development  
- Contribution / committee activation (legal counsel)  
- Attachment of cited election-result datasets to District Facts  
