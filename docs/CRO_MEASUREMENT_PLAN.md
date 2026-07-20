# CRO Measurement Plan

## Status

Analytics are **disabled by default**. The abstraction lives in `public/js/analytics.js` and only fires when the owner sets:

```html
<script>
  window.__FIELD_HUB_ANALYTICS__ = { enabled: true, endpoint: "/api/analytics", debug: false };
</script>
```

Do not enable third-party trackers without explicit configuration and privacy review.

## Primary conversion

**Find My Ballot** — address lookup started and completed (districts shown).

## Secondary conversions (ranked)

1. Volunteer interest (quick-start complete)  
2. Confirmed event detail / signup click  
3. Supported local candidate engagement  
4. Full directory filter use  
5. Official SOS or campaign link click  
6. Share  
7. Update subscribe (future — not active)  

## Recommended event names

| Event | When |
|-------|------|
| `homepage_primary_cta_click` | Hero / sticky CTA |
| `ballot_lookup_started` | Address form focus/submit start |
| `ballot_lookup_completed` | Results rendered |
| `candidate_filter_used` | Directory filters change |
| `candidate_profile_opened` | Race/card deep link |
| `official_campaign_link_clicked` | External campaign / SOS |
| `volunteer_form_started` | First field focus |
| `volunteer_step_completed` | Quick-start submit attempt |
| `volunteer_form_completed` | Server accepts (public mode only) |
| `event_filter_used` | Events view/filter change |
| `event_details_opened` | Event accordion / detail |
| `event_signup_clicked` | Volunteer deep-link from event |
| `calendar_add_clicked` | .ics / Google calendar |
| `share_clicked` | Share page / copy |
| `correction_submitted` | Feedback/corrections |
| `private_portal_login_started` | Future auth |

Markup support: `data-track="event_name"` on elements; click handler is already wired.

## Funnel stages

### Journey A — Ballot

Land → hero/lookup → submit address → districts shown → candidate race → optional volunteer  

Drop-offs: form confusion, geocode miss, dense results.

### Journey B — Volunteer

Land → help tile or Volunteer → quick-start → (blocked in dev) confirmation  

Drop-offs: long form fear (mitigated by quick-start), consent friction, development block message.

### Journey C — Event

Land → confirmed events → detail → signup/calendar  

Drop-offs: TBA treated as real (mitigated by status views).

## Metrics to review by device

- Mobile vs desktop completion of lookup and volunteer  
- Sticky CTA click-through vs hero  
- Filter usage on candidates/events  

## Never capture

- Full street addresses  
- Phone numbers or emails in analytics payloads  
- Political preferences / checked candidate lists  
- Precise geolocation beyond coarse district labels  
- Voter-file or walk-list identifiers  

The analytics helper strips `street`, `address`, `phone`, `email`, and `partyPreference` if mistakenly passed.

## Page-level success signals

| Page | Success |
|------|---------|
| Home | Ballot CTA or lookup submit |
| Ballot | Districts returned |
| Candidates | Filter + external source click |
| Events | Confirmed view engagement |
| Volunteer | Quick-start submit (or blocked message understood) |
