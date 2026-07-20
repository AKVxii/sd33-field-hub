# Accessibility Review

Target: **WCAG 2.2 AA** (progressive; not a full third-party certification).

## Implemented

- Skip link to main content  
- Landmark roles: banner, main, contentinfo, navigation, status  
- Mobile menu: `aria-expanded`, `aria-controls`, dialog label, Esc, focus trap, body scroll lock  
- Visible `:focus-visible` styles (gold)  
- Form labels associated with controls on redesigned flows  
- Fieldset/legend for volunteer consent  
- `aria-live` on candidate filter count  
- Development banner as `role="status"`  
- Prefer reduced motion CSS  
- Event status conveyed by text badges + left border (not color alone)  
- Empty states with actionable links  

## Known residual risks

- Legacy field/portal pages still use dense tables and long forms  
- Map (Leaflet) requires keyboard/screen-reader follow-up  
- Calendar widgets may need additional ARIA on day cells  
- Color contrast on gold accents against cream should be rechecked at 200% zoom  
- Candidate filter sticky bar can overlap content on short viewports  
- Some older pages still use inline styles and non-token colors  

## Manual checks remaining (owner)

- NVDA / VoiceOver full pass on Home, Ballot, Candidates, Volunteer, Events  
- 200% browser zoom on 320–430px widths  
- Keyboard-only path through mobile menu on iOS Safari  
- Focus order with sticky CTA present  
- Map alternative text path for district lookup without pointer  
