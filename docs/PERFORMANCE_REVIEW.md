# Performance Review

## Stack constraints

- Server-rendered HTML strings (no SPA bundle)  
- Static CSS/JS from Express with short cache in production (5m)  
- Leaflet/map assets only on map route  

## Improvements in redesign

- Homepage no longer loads multi-image gallery above the fold  
- Progressive disclosure for organizer content (off home)  
- Lazy-loading pattern retained on remaining images  
- Single design-system CSS + legacy lit.css (tradeoff: two stylesheets for compatibility)  

## Follow-ups

- Merge/minify CSS when leaving development  
- Subset Google Fonts or self-host  
- Preconnect already present for fonts  
- Avoid loading calendar JS on non-event pages (already route-scoped where implemented)  
- Image compression pass on `public/images/*`  

## Metrics to capture later

- LCP on home hero background image  
- TTFB on Render free tier  
- CLS from sticky header / filter bar  
