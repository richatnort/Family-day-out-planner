# Design System — Days Out in Summer

**Theme:** Sky Blue — Soft UI Evolution  
**Last-verified:** 2026-05-03

---

## Colour Tokens

These are the canonical token values. All components use these names — never hardcode hex values.

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| Primary | `--color-primary` | `#2563EB` | Buttons, links, active states, progress bar fill |
| Secondary | `--color-secondary` | `#059669` | Free/success badges, positive states |
| Accent | `--color-accent` | `#D97706` | Wishlist heart (filled), moderate badge, warnings |
| Background | `--color-background` | `#F8FAFC` | Page background |
| Foreground | `--color-foreground` | `#0F172A` | Body text, headings |
| Muted | `--color-muted` | `#F1F5FD` | Card backgrounds, skeleton placeholders, map placeholder |
| Border | `--color-border` | `#E4ECFC` | Card borders, dividers, input borders |
| Error | `--color-error` | `#DC2626` | Premium badge, validation errors, expired membership dot |

### Additional Semantic Colours (not in base token set)

| Usage | Value | Notes |
|-------|-------|-------|
| Warning (amber dot) | `#D97706` | Reuses `--color-accent` |
| Success (green dot) | `#059669` | Reuses `--color-secondary` |
| Overlay backdrop | `rgba(15, 23, 42, 0.5)` | Modal/sheet backdrop |

---

## Tailwind v4 + CSS Variable Setup

In `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --color-primary:    #2563EB;
  --color-secondary:  #059669;
  --color-accent:     #D97706;
  --color-background: #F8FAFC;
  --color-foreground: #0F172A;
  --color-muted:      #F1F5FD;
  --color-border:     #E4ECFC;
  --color-error:      #DC2626;

  --font-heading: var(--font-fredoka), 'Fredoka', sans-serif;
  --font-body:    var(--font-nunito), 'Nunito', sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-sm: 0 1px 3px rgba(37, 99, 235, 0.08);
  --shadow-md: 0 4px 12px rgba(37, 99, 235, 0.12);
  --shadow-lg: 0 8px 24px rgba(37, 99, 235, 0.16);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body);
}
```

In `tailwind.config.ts` (Tailwind v4 uses `@theme` in CSS instead of config, but keep this for tooling):

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary:    'var(--color-primary)',
        secondary:  'var(--color-secondary)',
        accent:     'var(--color-accent)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted:      'var(--color-muted)',
        border:     'var(--color-border)',
        error:      'var(--color-error)',
      },
    },
  },
};
```

---

## Typography

### Fonts

| Role | Font | Variable | Weight |
|------|------|----------|--------|
| Headings | Fredoka | `--font-fredoka` | 600 (SemiBold) |
| Body text | Nunito | `--font-nunito` | 400 (Regular), 600 (SemiBold) |

### Loading via `next/font`

```tsx
// app/layout.tsx
import { Fredoka, Nunito } from 'next/font/google';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

// Apply both variable class names to <html> or <body>:
// className={`${fredoka.variable} ${nunito.variable}`}
```

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page heading (h1) | Fredoka | 28px / 1.75rem | 600 | 1.2 |
| Section heading (h2) | Fredoka | 22px / 1.375rem | 600 | 1.3 |
| Card title | Fredoka | 18px / 1.125rem | 600 | 1.3 |
| Body text | Nunito | 16px / 1rem | 400 | 1.5 |
| Small label / badge | Nunito | 13px / 0.8125rem | 600 | 1.4 |
| Caption | Nunito | 12px / 0.75rem | 400 | 1.4 |

---

## Spacing

Base unit: 4px. All spacing in multiples of 4.

| Name | Value | Tailwind |
|------|-------|---------|
| xs | 4px | `p-1`, `gap-1` |
| sm | 8px | `p-2`, `gap-2` |
| md | 12px | `p-3`, `gap-3` |
| lg | 16px | `p-4`, `gap-4` |
| xl | 24px | `p-6`, `gap-6` |
| 2xl | 32px | `p-8`, `gap-8` |

Page padding: `px-4` (16px) on mobile, `px-6` (24px) on md+.

---

## Border Radius

| Name | Value | Usage |
|------|-------|-------|
| `--radius-sm` | 8px | Badges, chips, small elements |
| `--radius-md` | 12px | Buttons, inputs |
| `--radius-lg` | 16px | Cards, modals, bottom sheets |
| `--radius-xl` | 24px | Large hero sections |

---

## Shadows

Shadows use the primary blue as a tint to feel cohesive rather than flat grey.

| Name | Value | Usage |
|------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(37,99,235,0.08)` | Cards at rest |
| `--shadow-md` | `0 4px 12px rgba(37,99,235,0.12)` | Cards on hover/active, modals |
| `--shadow-lg` | `0 8px 24px rgba(37,99,235,0.16)` | Bottom sheets, elevated panels |

---

## Animation

All transitions respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: no-preference) {
  .animate-spring { transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1); }
  .animate-ease   { transition: all 200ms ease-out; }
}
```

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Card reveal on load | 150ms | ease-out | Stagger 30ms per card |
| Card scale on tap | 200ms | spring cubic-bezier | `scale(0.97)` on press |
| Bottom sheet slide-up | 200ms | ease-out | `translateY(100%)` → `translateY(0)` |
| Map expand | 200ms | ease-out | Height animation |
| Heart fill | 150ms | ease-out | Fill + scale(1.2) → scale(1) |
| Surprise Me! | 200ms | ease-out | Selected card scale before navigate (skipped if `prefers-reduced-motion`) |
| Toast | 200ms | ease-out | Slide in from bottom |

---

## Touch Targets

| Context | Minimum size |
|---------|-------------|
| Global (all interactive elements) | 44×44px |
| Children's interface (PIN numpad, vote buttons, heart, filters) | 56×56px |
| Leaflet zoom controls (via `leaflet-overrides.css`) | 44×44px |
| Close buttons on overlays | 44×44px |

---

## Icons

**Library:** Lucide React — SVG only. No emoji as structural icons.

| Usage | Lucide Icon | Notes |
|-------|-------------|-------|
| Weather: sunny | `Sun` | |
| Weather: rainy | `CloudRain` | |
| Setting: indoor | `Home` | |
| Setting: outdoor | `Trees` | |
| Wishlist heart (outline) | `Heart` | Outline, no fill |
| Wishlist heart (filled) | `Heart` | Solid fill, `var(--color-accent)` |
| Map pin | `MapPin` | Used in image placeholder + map toggle button |
| Surprise Me | `Shuffle` | |
| Calendar | `Calendar` | |
| Stamp / Passport | `Stamp` | |
| Close / dismiss | `X` | |
| External link | `ExternalLink` | Used on "Visit Website" |
| Lock (mystery activity) | `Lock` | |
| Vote: love | `ThumbsUp` | Only if emoji exception reversed |
| Vote: maybe | `Meh` | Only if emoji exception reversed |
| Vote: no | `ThumbsDown` | Only if emoji exception reversed |
| Admin: edit | `Pencil` | |
| Admin: delete | `Trash2` | |
| Admin: add | `Plus` | |

Icon size defaults:
- Inline with text: 16px
- Button icon: 20px
- Placeholder / hero: 32px

---

## Cost Badge Component

```tsx
// components/cost-badge.tsx
const badgeConfig = {
  free:     { label: 'FREE',     bg: 'bg-secondary', text: 'text-white' },
  cheap:    { label: 'Cheap',    bg: 'bg-primary',   text: 'text-white' },
  moderate: { label: 'Moderate', bg: 'bg-accent',    text: 'text-white' },
  premium:  { label: 'Premium',  bg: 'bg-error',     text: 'text-white' },
};
// When membership covers activity, label becomes "FREE w/ [name]" with bg-secondary
```

---

## Gradient Placeholder (no OG image)

```css
background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
```

Used for activity card image and detail hero. Always overlay a centred `MapPin` icon (white) at 24px (cards) or 32px (detail hero).

---

## Filter Chips

**Active state:**
- Background: `var(--color-primary)` (or category-specific colour)
- Text: white
- Border: 2px solid `var(--color-primary)`

**Inactive state:**
- Background: `var(--color-muted)`
- Text: `var(--color-foreground)`
- Border: 1px solid `var(--color-border)`

Chip height: ≥44px. Chip padding: `px-4 py-2`. Border radius: `--radius-sm` (8px).

---

## Bottom Sheet

- Slides up from bottom: `translateY(100%)` → `translateY(0)`, 200ms ease-out
- Has a drag handle (4px × 32px rounded pill, `var(--color-border)`)
- Backdrop: `rgba(15, 23, 42, 0.5)` with 200ms fade-in
- Border radius top: `--radius-xl` (24px)
- Shadow: `--shadow-lg`
- Max-width on desktop: 480px, centred

---

## Skeleton Loaders

- Background: `var(--color-muted)`
- Animated shimmer: use CSS `@keyframes shimmer` with `background-position` slide
- Card skeleton: same dimensions as the activity card (image area + two text lines)
- Must not cause layout shift when real content loads (match exact heights)

---

## Accessibility Checklist

- [ ] All text contrast ≥4.5:1 (body) and ≥3:1 (large text / badges)
- [ ] Focus rings visible: `outline: 2px solid var(--color-primary)` with 2px offset
- [ ] All interactive elements have `aria-label` if no visible text
- [ ] Emoji vote buttons have `aria-label` ("Love it", "Maybe", "Not for me")
- [ ] All images have `alt` text; gradient placeholders have `role="img" aria-label="[activity name]"`
- [ ] Touch targets ≥44px (children's interface ≥56px)
- [ ] No colour alone conveys meaning (icons + text accompany colour)
- [ ] `prefers-reduced-motion` skips all transitions and animations
- [ ] Keyboard navigation works for all interactive elements
