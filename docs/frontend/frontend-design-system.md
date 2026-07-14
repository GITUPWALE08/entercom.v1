# Frontend Design System

## Purpose

Document the Entercom UI design system derived from the **existing company website**. This is the single source of truth for tokens, layout, and component patterns.

**No redesign.** Phase 6 portals adopt these tokens and extract patterns from the live site into `shared-packages/design-system/`.

## Source assets

| Asset | Canonical location | Notes |
|-------|------------------|-------|
| Global CSS tokens | `shared-packages/design-system/tokens/index.css` | Extracted from `web/src/index.css` |
| Tailwind config | `shared-packages/design-system/tailwind.config.js` | Theme extension from company site |
| Layout component | `shared-packages/design-system/components/Layout/` | Site shell: header, nav, footer, content |
| Hero section | `shared-packages/design-system/components/Hero/` | Marketing hero only |
| Web entry styles | `web/src/index.css` | Imports design-system tokens |

---

## Design principles

1. **Authoritative source** — Company website design wins over defaults (Vite starter, Expo template).
2. **Token-first** — All colors, spacing, and typography use named tokens; no magic values in features.
3. **CSS variables + Tailwind** — Tokens defined as CSS custom properties; Tailwind `theme.extend` maps to same values.
4. **Light/dark** — System preference via `prefers-color-scheme`; no separate theme redesign.
5. **Portal vs marketing** — Layout + Hero on public pages; portal layouts reuse tokens without Hero.

---

## Typography

### Font families

| Token | Value | Usage |
|-------|-------|-------|
| `--sans` | `system-ui, 'Segoe UI', Roboto, sans-serif` | Body text, UI |
| `--heading` | `system-ui, 'Segoe UI', Roboto, sans-serif` | Headings |
| `--mono` | `ui-monospace, Consolas, monospace` | Code, counters, numeric badges |

Tailwind mapping:

```text
font-sans    → var(--sans)
font-heading → var(--heading)
font-mono    → var(--mono)
```

### Type scale

| Element | Desktop | Mobile (≤1024px) | Weight | Letter-spacing | Color |
|---------|---------|------------------|--------|----------------|-------|
| Body | 18px / 145% | 16px / 145% | 400 (normal) | 0.18px | `var(--text)` |
| `h1` | 56px | 36px | 500 | -1.68px / -0.03em | `var(--text-h)` |
| `h2` | 24px / 118% | 20px / 118% | 500 | -0.24px | `var(--text-h)` |
| `code` | 15px / 135% | 15px | 400 | — | `var(--text-h)` |
| Button / link | 16px | 16px | 400–500 | — | context-dependent |

### Heading margins

- `h1`: `32px 0` desktop; `20px 0` mobile
- `h2`: `0 0 8px`

---

## Color tokens

### Light mode (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--text` | `#6b6375` | Body text |
| `--text-h` | `#08060d` | Headings, emphasis |
| `--bg` | `#fff` | Page background |
| `--border` | `#e5e4e7` | Dividers, card borders |
| `--code-bg` | `#f4f3ec` | Code blocks, inline code |
| `--accent` | `#aa3bff` | Primary brand, CTAs, focus |
| `--accent-bg` | `rgba(170, 59, 255, 0.1)` | Accent surfaces |
| `--accent-border` | `rgba(170, 59, 255, 0.5)` | Accent outlines |
| `--social-bg` | `rgba(244, 243, 236, 0.5)` | Secondary button background |
| `--shadow` | `rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.05) 0 4px 6px -2px` | Elevated surfaces |

### Dark mode (`prefers-color-scheme: dark`)

| Token | Value |
|-------|-------|
| `--text` | `#9ca3af` |
| `--text-h` | `#f3f4f6` |
| `--bg` | `#16171d` |
| `--border` | `#2e303a` |
| `--code-bg` | `#1f2028` |
| `--accent` | `#c084fc` |
| `--accent-bg` | `rgba(192, 132, 252, 0.15)` |
| `--accent-border` | `rgba(192, 132, 252, 0.5)` |
| `--social-bg` | `rgba(47, 48, 58, 0.5)` |
| `--shadow` | `rgba(0,0,0,0.4) 0 10px 15px -3px, rgba(0,0,0,0.25) 0 4px 6px -2px` |

### Semantic aliases (Tailwind / components)

Map to existing tokens only — no new brand colors.

| Semantic | Maps to |
|----------|---------|
| `primary` | `--accent` |
| `primary-foreground` | `#fff` on accent buttons |
| `muted` | `--text` |
| `muted-foreground` | `--text` at reduced opacity |
| `destructive` | Use sparingly; derive from `--text-h` + red hue only if present on company site |
| `surface` | `--bg` |
| `surface-elevated` | `--bg` + `--shadow` |

---

## Spacing

### Base unit

Implicit **4px grid** derived from existing site values.

### Documented scale (from existing CSS)

| Token / context | Value | Mobile |
|-----------------|-------|--------|
| Section gap | 25px | 18px |
| Section padding | 32px | 24px 20px |
| Link / social padding | 6px 12px | same |
| Icon margin | 16px, 20px, 32px | scaled down in dense UI |
| Spacer (footer) | 88px | 48px |
| Code padding | 4px 8px | same |
| Button padding | 5px 10px (counter), 6px 12px (links) | same |

### Tailwind spacing extension

Extend Tailwind with values that match the site: `18`, `25`, `88` where used in original CSS. Prefer standard Tailwind scale (4, 8, 12, 16, 20, 24, 32) for new portal UI, aligned to 4px grid.

---

## Layout system

### App shell (`#root` / Layout)

| Property | Value |
|----------|-------|
| Max content width | 1126px |
| Width | 100% up to max |
| Margin | `0 auto` |
| Min height | `100svh` |
| Display | flex column |
| Border | `1px solid var(--border)` inline (marketing shell) |
| Text align | center (marketing); left (portal overrides) |

### Layout component structure

```text
Layout
├── Header / Navbar (from company site)
├── main (children)
└── Footer (from company site)
```

Portal layouts **reuse Header/Footer tokens** but switch to left-aligned content and sidebar where appropriate. Do not change brand nav styling.

### Section patterns (from existing site)

| Section | Layout |
|---------|--------|
| Hero | Centered column; decorative image stack |
| `#center` | flex column, gap 25px (18px mobile), padding 32px 20px 24px |
| `#next-steps` | Two-column flex desktop; single column mobile |
| `#docs` | Border-right divider desktop; bottom border mobile |

### Portal layout (new composition, same tokens)

```text
PortalLayout
├── PortalHeader (compact nav; same tokens as Navbar)
├── body: sidebar + main (staff/manager/admin)
└── PortalFooter (optional minimal)
```

---

## Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| `mobile` | ≤ 1024px | Typography scale, stack columns, reduce padding |
| `desktop` | > 1024px | Default marketing layout |

Tailwind config:

```text
screens: {
  'md': '1024px',   // matches existing site breakpoint
}
```

No additional breakpoints unless present on company site.

---

## Cards

Derive from existing bordered sections (`--border`, `--bg`).

| Property | Value |
|----------|-------|
| Background | `var(--bg)` |
| Border | `1px solid var(--border)` |
| Border radius | 6px (align with link buttons) |
| Shadow (elevated) | `var(--shadow)` |
| Padding | 24px desktop; 20px mobile |

**Variants:** default (border only), elevated (shadow), accent (`--accent-bg` + `--accent-border`).

---

## Buttons

Extracted from existing `.counter` and social/link patterns.

### Primary (accent)

| Property | Value |
|----------|-------|
| Background | `var(--accent)` |
| Text | `#fff` |
| Font | 16px, `var(--sans)` |
| Padding | 8px 16px (portal); 5px 10px (compact) |
| Border radius | 5–6px |
| Focus | `outline: 2px solid var(--accent)` |

### Secondary (social)

| Property | Value |
|----------|-------|
| Background | `var(--social-bg)` |
| Border | `1px solid var(--border)` |
| Hover | `box-shadow: var(--shadow)` |
| Border radius | 6px |
| Padding | 6px 12px |

### States

- **Disabled:** reduced opacity 0.5; no pointer events
- **Loading:** spinner using `--accent`; preserve button dimensions
- **Danger:** only for destructive confirmations; do not introduce new red if not on company site

---

## Forms

Portal forms use same typography and borders as marketing site.

| Element | Style |
|---------|-------|
| Label | `var(--text-h)`, 16px, margin-bottom 4px |
| Input | `1px solid var(--border)`, `var(--bg)`, radius 6px, padding 8px 12px |
| Input focus | `outline: 2px solid var(--accent)` |
| Error text | below field; use existing text color with semantic indicator |
| Help text | `var(--text)`, 14px |

**Validation:** Zod schemas from `shared-packages/validation`; error display consistent across web and mobile (native inputs on mobile, same labels and copy).

---

## Tables

Staff, Manager, and Admin portals.

| Property | Value |
|----------|-------|
| Header | `var(--text-h)`, font-weight 500, border-bottom `var(--border)` |
| Row | border-bottom `var(--border)` |
| Cell padding | 12px 16px |
| Hover row | `var(--accent-bg)` at low opacity |
| Empty state | centered text using `var(--text)` |

Responsive: horizontal scroll on mobile; no card-redesign of row data.

---

## Modals

| Property | Value |
|----------|-------|
| Overlay | `rgba(0, 0, 0, 0.5)` |
| Panel background | `var(--bg)` |
| Border | `1px solid var(--border)` |
| Border radius | 6px |
| Shadow | `var(--shadow)` |
| Padding | 24px |
| Max width | 480px (confirm), 640px (forms) |

Focus trap and ESC close required. Use same button styles for actions.

---

## Mobile responsiveness

### Web

- Breakpoint at **1024px** matches existing site
- Marketing: stack `#next-steps` columns; reduce `h1` and spacer
- Portal: sidebar collapses to drawer below 1024px
- Tables: horizontal scroll
- Touch targets: minimum 44px height for interactive elements

### Mobile app (React Native)

- Map CSS tokens to JS theme object in `mobile/src/theme/tokens.ts` (same hex values)
- Do not port Layout/Hero literally; use native navigation patterns with shared colors and typography scale
- Font: system default (San Francisco / Roboto) equivalent to `--sans` stack

---

## Component inventory (design-system package)

| Component | Source | Used on |
|-----------|--------|---------|
| `Layout` | Company site | Public web pages |
| `Hero` | Company site | Home, marketing |
| `Navbar` | Part of Layout | Public + optional portal header |
| `Footer` | Part of Layout | Public pages |
| `Button` | Extracted from site patterns | All surfaces |
| `Card` | Derived from bordered sections | Portals |
| `Input`, `Select`, `Textarea` | Token-aligned | Forms |
| `Table` | Portal requirement | Staff+ |
| `Modal` | Token-aligned | Confirmations, forms |
| `Badge` | Accent tokens | Status chips |
| `Toast` | Accent + shadow | Notifications |

---

## Tailwind config structure

`shared-packages/design-system/tailwind.config.js`:

- `content`: `web/src/**/*`, `shared-packages/design-system/**/*`
- `theme.extend.colors`: map to CSS variables
- `theme.extend.fontFamily`: sans, heading, mono
- `theme.extend.boxShadow`: `shadow` → `var(--shadow)`
- `theme.extend.screens`: `md: 1024px`
- Plugins: none required for Phase 6

Web imports:

```text
@tailwind base;
@tailwind components;
@tailwind utilities;
@import '@entercom/design-system/tokens/index.css';
```

(Exact package name follows monorepo workspace config.)

---

## What not to change

- Brand purple accent (`#aa3bff` / `#c084fc` dark)
- System font stack (no custom webfont unless already on company site)
- Marketing Layout and Hero composition
- 1126px content width on public pages
- Light/dark token pairs

---

## Completion criteria

- [ ] `shared-packages/design-system` contains tokens, Tailwind config, Layout, Hero
- [ ] `web/src/index.css` imports tokens; no duplicate `:root` block
- [ ] Portal components use only documented tokens
- [ ] Mobile theme object matches color table above
- [ ] No new colors or fonts introduced without company site source


## Canonical Design System

`./web/entercom/` is the canonical company website.

Future portals MUST inherit the following from the canonical website:
- typography
- spacing
- colors
- buttons
- cards
- hero styling
- footer styling
- layout spacing
- animations
- responsiveness

**DO NOT redesign.** The existing website aesthetic is the foundation.
