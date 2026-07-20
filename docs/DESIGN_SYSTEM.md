# Design System — St. Croix Valley Field Hub

## Brand principles

- **Civic, not corporate** — public-service clarity over SaaS chrome  
- **Minnesota place** — St. Croix river blue, evergreen, warm cream, deep navy  
- **Warm but serious** — welcoming to neighbors, credible to media  
- **Patriotic without theatre** — no flag wallpaper, no red-everything CTAs  
- **Uncluttered** — progressive disclosure; one primary action per view  
- **Reusable product later** — tokens and components over one-off page CSS  

## Color tokens

Defined in `public/css/design-system.css` as CSS custom properties:

| Token | Role |
|-------|------|
| `--navy` / `--navy-deep` | Primary text chrome, primary buttons |
| `--river` / `--river-soft` | Links, soft highlights |
| `--evergreen` / `--evergreen-soft` | Secondary civic accent |
| `--cream` / `--cream-deep` | Page background |
| `--stone` / `--stone-soft` | Muted UI, utility surfaces |
| `--accent` | Restrained muted red — emphasis only |
| `--gold` | Focus ring / development banner accent |
| `--ok` / `--warn` / `--err` | Status semantics |

## Typography

| Role | Family | Notes |
|------|--------|-------|
| Display | **Fraunces** | Page titles, major section heads |
| UI / body | **DM Sans** | ~17px base (`--fs-base`), line-height ~1.65 |
| Max families | 2 | Loaded via Google Fonts with `display=swap` |

Rules:

- Comfortable paragraph measure via `--prose` (~40rem)  
- Avoid long centered paragraphs  
- Avoid unnecessary all-caps (except small kickers/badges)  
- Sources and disclaimers not tiny — use `--fs-sm` minimum for legal-adjacent copy  

## Spacing & layout

- Space scale: `--space-1` … `--space-8`  
- Container: `--container` (1120px) with responsive gutters  
- Radius: `--radius-sm` / `--radius` / `--radius-lg`  
- Shadows: soft only (`--shadow-sm`, `--shadow`)  
- Breakpoints (practical): mobile shell &lt; 1024px; sticky CTA ≤ 640px  

## Buttons

| Class | Use |
|-------|------|
| `.btn-primary` | Main conversion (navy) |
| `.btn-secondary` | Alternate |
| `.btn-accent` | Rare emphasis (muted red) |
| `.btn-ghost` / `.btn-text` | Low emphasis |
| `.btn-sm` / `.btn-block` | Size modifiers |

Legacy aliases (`.btn-navy`, `.btn-gold`, `.btn-outline`) remain for older portal pages.

CTA language prefers specific verbs: “Find My Ballot”, “Choose My Volunteer Role”, not bare “Submit”.

## Forms

- Labels always associated (`for` / `id`)  
- Required consent never pre-checked for marketing/sharing  
- Fieldset + legend for consent groups  
- Inline validation + flash messages  
- Development mode blocks POST collection  

## Cards & badges

- Candidate cards: name, office, party badge, optional supported badge  
- Event cards: status border (`confirmed` green, `proposed` amber, `past` stone)  
- Badges: `.badge.confirmed`, `.badge.planned`, `.badge.supported`, party tags  

## Navigation

- Desktop primary nav + More details menu  
- Mobile drawer: Esc, focus trap, body scroll lock, close on navigate  
- Skip link to `#main`  
- Sticky mobile CTA (≤3 actions) on home  

## Development banner

- Slim, neutral slate + gold edge  
- One line summary + expandable “Development details”  
- Present once per page via layout  

## Accessibility rules

- Visible `:focus-visible` (gold)  
- Touch targets ~44px for primary controls  
- Prefer native semantics; ARIA only when needed  
- `prefers-reduced-motion` disables non-essential animation  
- Status colors never sole indicator (also text badges)  

## Motion

- ~180ms transitions (`--motion`, `--ease`)  
- No parallax, auto carousels, or delay of content  

## Component inventory (implemented)

Header, mobile nav, development banner, footer, trust pills, lookup panel, candidate cards, event cards, filter bar, help tiles, fact tiles, portal notice, empty/error/flash states, consent fieldset, analytics stub (disabled).  
