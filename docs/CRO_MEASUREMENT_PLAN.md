# CRO Measurement Plan

## Primary conversions (rank order)

1. **Find My Ballot** — address form submit → `/my-gop-ballot` results  
2. **Volunteer** — short or full form POST (blocked in dev)  
3. **Event engagement** — calendar ICS / events page views  
4. **Local candidate detail** — deep links to `#race-*`  
5. **Full directory filters** — search/filter usage  
6. **Official SOS outbound** — pollfinder / myballot / candidates  
7. **Share** — `/share` visits  

## Suggested events (when analytics allowed)

| Event name | Trigger |
|------------|---------|
| `ballot_lookup_submit` | Home or ballot form GET with address |
| `volunteer_short_submit` | Short form POST |
| `volunteer_full_submit` | Full form POST |
| `event_ics_download` | `*.ics` hits |
| `candidate_filter` | Filter change (client) |
| `sos_outbound_click` | Clicks to sos.mn.gov domains |
| `portal_entry` | `/portal` view |

## Guardrails

- No analytics that defeat privacy notices  
- In `PRIVATE_DEVELOPMENT`, do not claim live conversion totals  
- Prefer first-party, privacy-respecting tools when activated  

## Funnel (public)

Landing → understand in 5s → ballot lookup **or** volunteer tile → SOS confirm → return for events  

## A/B ideas (future)

- Hero primary button label: “Find My Ballot” vs “What’s on My Ballot”  
- Address: single field only vs street + city  
- Volunteer: short-only vs short + full  
