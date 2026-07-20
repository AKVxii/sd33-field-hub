# Mobile QA Checklist

## Viewports to test

320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440  

Also: 200% browser zoom.

## Header & navigation

- [ ] Brand truncates cleanly; no overflow  
- [ ] Hamburger visible &lt; 1024px  
- [ ] Drawer opens/closes; Esc works  
- [ ] Focus trap while open; body does not scroll  
- [ ] Link navigation closes drawer  
- [ ] Volunteer primary action reachable  

## Development banner

- [ ] Single slim banner; expandable details  
- [ ] Does not cover primary content permanently  

## Home

- [ ] Hero CTAs stack; no horizontal scroll  
- [ ] Address lookup usable with large touch targets  
- [ ] Three candidate cards stack  
- [ ] Event cards readable  
- [ ] Sticky bar: Ballot / Volunteer / Events (≤3)  
- [ ] Sticky bar respects safe-area; does not cover focused inputs excessively  

## Candidates

- [ ] Filter bar wraps; sticky does not hide first results permanently  
- [ ] Long names wrap  

## Events

- [ ] Confirmed default view  
- [ ] Status chips wrap  
- [ ] Accordion gear details usable  

## Volunteer

- [ ] Quick-start form single column  
- [ ] Consent checkboxes tappable  
- [ ] Full form optional section reachable  

## Map / tables

- [ ] Map page: search usable; legend readable  
- [ ] Tables scroll horizontally inside container if needed  

## Footer

- [ ] Columns stack; links tappable  

## Automation

`npm test` against a running server covers HTTP 200s and key HTML markers; it does not replace visual mobile QA.  
