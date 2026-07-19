# SD 33 Literature Drop HQ

Separate volunteer site for **Minnesota Senate District 33** field work.

## Goal
Win all three local seats with coordinated lit:
1. **State Senate 33** — Karin Housley (**GOP**)
2. **House 33A** — **GOP** nominee (open seat)
3. **House 33B** — **GOP** nominee vs Josiah Hill (DFL)

Also lists **Governor**, **U.S. Senate**, and **U.S. House** candidates with **GOP** labels, and lets volunteers **check which literature** they will carry.

## Run
```powershell
cd C:\Users\alana\Documents\sd33-litdrop
npm.cmd install
npm.cmd start
```
Open: **http://localhost:3050**

## Pages
| Path | Purpose |
|------|---------|
| `/` | Winning lit-drop plan & phases |
| `/field` | Field HQ — doors, phones, signs |
| `/field/doors` | Door knock lists (poll-first, by corridor/party) |
| `/field/phones` | Phone bank lists with name/phone/party |
| `/field/signs` | Sign sites near polls + MnDOT/county arterials |
| `/field/streets` | Busy thoroughfares (Hwy 36, 95, Manning, CR 96…) |
| `/field/polls` | Polling places & radius plan |
| `/field/import` | Import homeowner/voter CSV |
| `/candidates` | All candidates; GOP labeled |
| `/carry` | Checkbox form: which lit to carry |
| `/turf` | 33A vs 33B routing |
| `/how-to` | Legal/effective drop rules |
| `/leaderboard` | Demand + drop logs |

## Contacts (name · phone · party)
Real data must be imported from an **authorized** voter file / CRM. Demo placeholders ship for training UI only.  
CSV template: `data/contacts_import_template.csv` · Import UI: `/field/import`

## Data
- `data/candidates.json` — races, GOP/other candidates, literature menu  
- `data/lit_signups.json` — volunteer lit requests  
- `data/drop_logs.json` — completed drops  

Update `candidates.json` after the Aug 11 primary with nominee names.
