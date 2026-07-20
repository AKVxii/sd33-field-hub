# Performance Review

## Goals

- Fast first paint on public marketing pages  
- Minimal layout shift in header/hero  
- Responsive interaction on forms and filters  
- Avoid loading full ops datasets on the homepage  

## Changes in redesign

- Homepage no longer carries full phase plan / weekly targets tables  
- Events gear tables and month calendar collapsed behind details by default  
- Client filters for candidates (no extra network)  
- Design tokens + shell CSS separated (`design-system.css`)  
- Images: prefer lazy loading on non-critical assets (legacy gallery reduced from home hero path)  
- Analytics stub ships disabled (no third-party network)  
- `noindex` retained in development mode  

## Residual risks

- Monolithic `server.js` HTML string generation is fine for free tier but large responses on heavy pages (candidates, events all-view)  
- Google Fonts still network-loaded (preconnect present)  
- Leaflet map page payload depends on geo JSON size  
- `lit.css` still loaded for legacy portal compatibility — future split would help  

## Build / runtime

- No bundler; static assets served by Express  
- Production: `npm start` on Render free plan  
- Cache: short maxAge in production for static assets  

## Recommended next optimizations (owner)

1. Subset or self-host fonts  
2. Split portal-only CSS from public design system  
3. Compress geo JSON or lazy-load layers  
4. Add response compression middleware if not provided by host  
