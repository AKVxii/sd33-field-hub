# Accessibility Review

## Implemented

- Skip link to main content  
- Landmark roles: banner, main, contentinfo, navigation, status  
- Mobile menu: `aria-expanded`, `aria-controls`, dialog label, Esc, focus trap, body scroll lock  
- Visible `:focus-visible` styles  
- Form labels associated with controls on redesigned flows  
- `aria-live` on candidate filter count  
- Development banner as `role="status"`  
- Prefer reduced motion CSS  

## Known residual risks

- Legacy field/portal pages still use dense tables and long forms  
- Map (Leaflet) requires keyboard follow-up  
- Calendar widgets may need additional ARIA on event list  
- Color contrast on gold-on-navy hero buttons should be rechecked at 200% zoom  
- Candidate filter sticky bar can overlap content on small heights  

## Manual checks remaining (owner)

- NVDA/VoiceOver full pass on Home, Ballot, Candidates, Volunteer, Events  
- 200% browser zoom  
- Keyboard-only path through mobile menu on iOS Safari  
- Focus order with sticky CTA present  
