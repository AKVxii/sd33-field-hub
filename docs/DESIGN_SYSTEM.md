# Design System — St. Croix Valley Field Hub

## Brand principles

- **Civic, not corporate** — public-service clarity over SaaS chrome  
- **Minnesota place** — river blue, evergreen, cream, restrained navy  
- **Warm but serious** — welcoming to neighbors, credible to media  
- **Patriotic without theatre** — no flag wallpaper, no red-everything CTAs  
- **Uncluttered** — progressive disclosure; one primary action per view  

## Tokens

Defined in `public/css/design-system.css` as CSS custom properties:

| Token group | Examples |
|-------------|----------|
| Color | `--navy`, `--river`, `--evergreen`, `--cream`, `--accent`, `--gold` |
| Type | `--font` (DM Sans), `--font-display` (Fraunces), `--fs-*`, `--lh-*` |
| Space | `--space-1` … `--space-8` |
| Radius / shadow | `--radius`, `--shadow-sm`, `--shadow` |
| Layout | `--container` (1120px), `--prose` (~40rem) |
| Motion / z-index | `--ease`, `--motion`, `--z-header`, `--z-modal` |

## Typography

- **Display:** Fraunces for page titles and major section heads  
- **UI/body:** DM Sans, 17px base, line-height ~1.65  
- Limit paragraph width for reading comfort  
- Avoid all-caps except small badges/kickers  

## Buttons

| Class | Use |
|-------|-----|
| `.btn-primary` | Main conversion (navy) |
| `.btn-secondary` | Alternate action |
| `.btn-accent` | Rare emphasis (muted red) |
| `.btn-ghost` / `.btn-text` | Low emphasis |
| `.btn-sm` / `.btn-block` | Size modifiers |

Legacy aliases (`.btn-navy`, `.btn-gold`, `.btn-outline`) remain for older pages.

## Components

Header, mobile nav, development banner, footer, trust pills, lookup panel, candidate cards, event cards, filter bar, help tiles, fact tiles, portal notice, empty/error/flash states.

## Accessibility rules

- Visible `:focus-visible` rings (gold)  
- Touch targets ≥ ~44px for primary controls  
- Mobile menu: Esc, focus trap, body scroll lock, labeled close  
- Skip link to `#main`  
- Prefer semantic headings and landmarks  

## Motion

- Short transitions (~180ms)  
- `prefers-reduced-motion` disables non-essential animation  

## Breakpoints (practical)

- Mobile nav < 1024px  
- Sticky mobile CTA ≤ 640px  
- Grids collapse via `auto-fit` minmax patterns  
