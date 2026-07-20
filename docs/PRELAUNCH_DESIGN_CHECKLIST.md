# Prelaunch Design Checklist

Owner gates before public mode (`PRIVATE_DEVELOPMENT=false`).

## Legal & status

- [ ] Confirm committee / non-committee status with counsel  
- [ ] Confirm contribution language and whether `/donate` is appropriate  
- [ ] Confirm paid-for-by or volunteer-only statements  
- [ ] Keep or revise development banner copy with counsel  

## Content

- [ ] Verify every candidate name/party against SOS filings  
- [ ] Attach official campaign URLs and licensed photos only when rights clear  
- [ ] Confirm each public event status (confirmed vs proposed)  
- [ ] Add cited election results to District Facts if desired  
- [ ] Spanish page completeness review  

## Product

- [ ] Password or auth for `/portal` and `/team/*` if required  
- [ ] Enable analytics only with privacy policy update  
- [ ] Wire real volunteer storage + notification path  
- [ ] SMS/email consent language when channels activate  
- [ ] Production SEO: remove noindex, add sitemap only when public  

## QA

- [ ] `npm test` smoke pass  
- [ ] Manual a11y pass (see ACCESSIBILITY_REVIEW.md)  
- [ ] Mobile QA matrix (see MOBILE_QA.md)  
- [ ] Keyboard path for lookup, filters, volunteer, events  
- [ ] Broken-link pass on footer + SOS links  

## Deploy (owner only — do not auto-deploy)

- [ ] Review Render env: `SESSION_SECRET`, `PRIVATE_DEVELOPMENT`, `PUBLIC_URL`  
- [ ] Deploy from approved branch  
- [ ] Post-deploy health check `/api/health`  
