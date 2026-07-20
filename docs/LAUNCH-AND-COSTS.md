# Launch Settings, Permissions & Cost Through November

**Internal / captain use only — not linked on the public website.**

Checklist to run the St. Croix Valley Field Hub publicly through Election Day (November 3, 2026). Figures are planning estimates in USD—not bids. Confirm with counsel, your host, and any paid ads platform.

Live public site: https://sd33-field-hub.onrender.com  
Repo env template: `.env.example`

---

## 1. Technical settings (Render / hosting)

| Setting | Recommended | Why |
|--------|-------------|-----|
| Host plan | Render **Starter** or higher (not free sleep) | Free tier sleeps 15–30+ minutes; media and volunteers bounce |
| Custom domain | e.g. field.yourcommittee.org | Looks professional; easier to share and SEO |
| HTTPS | On (automatic on Render) | Required for trust and some browser features |
| `SESSION_SECRET` | Long random string | Secure sessions / flash messages |
| `PUBLIC_URL` | Your live HTTPS URL | Correct links in emails and calendar files |
| `NOTIFY_WEBHOOK` | Zapier / Make / n8n URL | Email + SMS you on every volunteer signup |
| `ADMIN_NOTIFY_EMAIL` / `PHONE` | Captain contacts | Who gets “connect this volunteer” |
| Twilio (optional) | `TWILIO_*` env vars | Auto text to volunteers after signup |
| Auto-deploy | GitHub `main` → Render | Already wired if repo connected |
| Backups | Export `data/*.json` weekly | Signups live on disk; free disk is not forever |

After changing env vars, restart the Render service.

---

## 2. Programs & tools to pair with the site

- **Pulsar** (or campaign walk app) — door lists after captain meet  
- **Google Calendar** or shared committee calendar — publish Field Hub events  
- **Zapier / Make** — webhook → Gmail + SMS to captains  
- **Twilio** — optional automated volunteer texts (TCPA opt-in already on form)  
- **Google Search Console** + **Bing Webmaster** — claim domain for search visibility  
- **Meta Business Suite** — Facebook/Instagram posts using event “Copy social post”  
- **Canva** — share graphics (use original Field Hub images)  
- **WinRed / committee donate page** — only when legal entity is ready (link on /donate)

---

## 3. Permissions & legal (before “official” public branding)

1. **Committee / counsel sign-off** — “Paid for by…” if a registered committee funds the site or ads  
2. **Minnesota CFB / FEC** — as applicable for state vs federal activity; see live site `/legal`  
3. **SMS consent** — form requires opt-in; honor STOP; keep records  
4. **Email** — CAN-SPAM if commercial; unsubscribe path  
5. **Voter / walk data** — no public dump of voter file; Pulsar access campaign-controlled  
6. **Event presence** — private property and festival booth permits; 100-foot election-day rules  
7. **Photos** — site uses original illustrations; do not post private-property photos without rights  
8. **Privacy page** — keep `/privacy` accurate to how you store signups  

**Not legal advice.** Have counsel review before paid advertising or formal committee branding.

---

## 4. Cost to maintain through November 2026 (planning range)

Roughly mid-July through early November ≈ **3.5–4 months**. Low = careful volunteer-run; mid = solid public ops; high = paid ads + pro tools.

| Category | Low / mo | Mid / mo | High / mo | Notes |
|----------|----------|----------|-----------|--------|
| Hosting (Render / similar) | $0–7 | $7–25 | $25–50 | Paid plan if you need no-sleep + custom domain |
| Domain name | ~$1–2 | $1–2 | $2–3 | ~$12–20/year total |
| Notify (Zapier free → paid) | $0 | $20–30 | $50+ | Email/SMS automation |
| Twilio SMS | $0–5 | $10–25 | $40–80 | Usage-based; only if auto-text |
| Search / SEO tools | $0 | $0–20 | $50–100 | Search Console free; optional paid SEO |
| Paid search (Google Ads) | $0 | $100–300 | $500–2,000+ | Optional “push on searches” |
| Social boosts (Meta) | $0 | $50–150 | $200–500 | Boost event + volunteer posts |
| Backup / storage | $0 | $0–5 | $10 | Google Drive / Dropbox export |

### Estimated total through early November

- **Lean** (site + domain + free notify): about **$50–120** total  
- **Solid** (no-sleep host + Zapier + light SMS + light social): about **$400–900** total  
- **Growth** (host + automation + meaningful Google/Meta ads): about **$1,500–8,000+** total depending on ad spend  

Committee staff time is the largest “cost” and is not included above. Literature, shirts, and yard signs are separate field budgets.

---

## 5. Search visibility (“pushing on searches”)

1. Add a custom domain and set `PUBLIC_URL`  
2. Submit key URLs in Google Search Console: home, /map, /volunteer, /events, /candidates, /legal  
3. Post weekly to Facebook/Nextdoor with event “Copy social post” + link  
4. Ask local pages/groups (with permission) to share the volunteer link  
5. Optional Google Ads: use committee ad accounts and disclaimers  
6. Do not buy misleading “government” ads; this site is independent  

---

## 6. Go-live checklist

- [ ] Render paid plan or always-on host  
- [ ] Custom domain + HTTPS live  
- [ ] Env: `SESSION_SECRET`, `PUBLIC_URL`, `NOTIFY_WEBHOOK`, `ADMIN_NOTIFY_*`  
- [ ] Test volunteer signup → captain notify + calendar download  
- [ ] Test /events past-event hiding, community filters, interactive calendar  
- [ ] Counsel review of /legal, /donate, paid-for-by if applicable  
- [ ] Weekly JSON backup of `volunteer_signups` and `candidate_prefs`  
- [ ] Search Console property verified  
- [ ] Social bio links point to /volunteer  

---

## Related public pages (keep public)

- `/legal` — election rules for volunteers  
- `/privacy` — data handling  
- `/donate` — contribution info when committee is ready  
- `/events` — public calendar (no host-cost content)  
