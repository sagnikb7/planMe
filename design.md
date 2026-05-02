# Ember Design System

> Warm light in a dark room. One accent. No noise.

---

## Philosophy

Ember is the visual language of planMe — a design system built on the belief that dark interfaces don't have to feel cold, and minimal interfaces don't have to feel sterile.

The name comes from what it looks like: a single warm glow (amber) against deep charcoal surfaces. Like an ember in the dark — alive, focused, not trying to illuminate everything at once.

### Principles

1. **One chromatic accent.** Amber (`#f59e0b`) is the entire color budget. It appears only where attention belongs — active states, the spark CTA, focus rings, idea indices. No second hue. No gradients on surfaces. If you can't justify it with amber alone, the design is too complex.

2. **Depth through value, not shadow.** Three background levels — `#111` → `#1a1a1a` → `#222` — create hierarchy without drop shadows. Borders do separation. Glass does elevation. Shadows are reserved for floating layers (modals, toasts).

3. **One font, three weights.** Geist at 400/500/600 carries the entire type hierarchy. No italic for emphasis (use weight or color). No display sizing. Let the type scale do the work.

4. **Translucency as atmosphere.** Glass surfaces (`backdrop-filter: blur(20px)`) sit over a dual ambient gradient — amber top-left, indigo bottom-right — creating a living quality that pure flat surfaces lack. The glow is felt, not seen.

5. **Nothing decorative.** Every pixel earns its place. No grain textures, no ornamental dividers, no ghost text. The dot-grid on the landing page is the single exception — it establishes the brand boundary between marketing and product.

### Inspiration

Ember draws from the intersection of tool design and atmosphere:
- **Linear** — the benchmark for dark product UI: precise, fast, zero decoration
- **Vercel** — Geist font family, the idea that a tool can have warmth without being playful
- **Terminal aesthetics** — the glow of a cursor in a dark room, information-dense but calm
- **Analog warmth** — amber is the color of candlelight, vacuum tubes, warm film stock. It's the antidote to cold blue-gray tech defaults

---

## Typography

**Geist** — the only typeface. Loaded via Google Fonts. Code blocks use **Geist Mono**.

```css
--font-sans:    "Geist", system-ui, sans-serif
--font-display: "Geist", system-ui, sans-serif
--font-mono:    "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
```

### Type scale

| Token | Size | Use |
|---|---|---|
| `--ds-text-xs` | 0.75rem (12px) | Metadata, badges, field hints, timestamps |
| `--ds-text-sm` | 0.875rem (14px) | Body text, form labels, nav items |
| `--ds-text-md` | 1rem (16px) | Default body, input text |
| `--ds-text-lg` | 1.125rem (18px) | Page headings inside the app shell |
| `--ds-text-xl` | 1.375rem (22px) | Section headings, card titles |
| `--ds-text-2xl` | clamp(2rem, 5vw, 3rem) | Landing hero only — responsive |

### Weight usage

| Weight | Token | Use |
|---|---|---|
| 400 | `font-normal` | Body text, descriptions, secondary content |
| 500 | `font-medium` | Labels, nav items, interactive text, sub-headings |
| 600 | `font-semibold` | Page headings, card titles, primary labels |

**Rules:**
- No italic — ever. Use weight or `--ds-color-text-muted` for de-emphasis.
- No decorative sizing. The scale above covers everything.
- Minimum functional text size: `0.75rem` (12px). Nothing smaller for text that conveys information.

---

## Color

Dark-only palette. Grayscale base with one chromatic accent.

### Core tokens

| Token | Value | Role |
|---|---|---|
| `--ds-color-bg` | `#111111` | Page background — never pure black |
| `--ds-color-bg-elevated` | `#161616` | Slightly elevated layer |
| `--ds-color-surface` | `#1a1a1a` | Cards, panels |
| `--ds-color-surface-strong` | `#222222` | Inputs, elevated interactive elements |
| `--ds-color-text` | `#e8e8e8` | Primary text |
| `--ds-color-text-muted` | `#888888` | Secondary text |
| `--ds-color-text-soft` | `#666666` | Tertiary, very dim — hints, placeholders |
| `--ds-color-border` | `rgba(255,255,255, 0.07)` | Hairline separators |
| `--ds-color-border-strong` | `rgba(255,255,255, 0.12)` | Interactive element borders |

### Accent tokens

| Token | Value | Role |
|---|---|---|
| `--ds-color-accent` | `#ffffff` | Primary button background |
| `--ds-color-accent-hover` | `rgba(255,255,255, 0.88)` | Primary button hover |
| `--ds-color-accent-fg` | `#111111` | Text on accent background |
| `--ds-color-accent-soft` | `rgba(255,255,255, 0.05)` | Hover tint — ghost buttons, row hover |

### Amber glow tokens

The single chromatic note. Amber is warm, rare in dark UIs, and reads as creative energy.

| Token | Value | Role |
|---|---|---|
| `--ds-color-glow` | `#f59e0b` | Active nav, spark button, focus rings, idea indices |
| `--ds-color-glow-soft` | `rgba(245,158,11, 0.07)` | Active nav background, subtle tints |
| `--ds-color-glow-medium` | `rgba(245,158,11, 0.13)` | Tag chip borders, stronger amber tint |
| `--ds-color-glow-ring` | `rgba(245,158,11, 0.28)` | Focus ring — `0 0 0 2px` on inputs and buttons |
| `--ds-color-glow-shadow` | `rgba(245,158,11, 0.28)` | Spark button ambient glow |
| `--ds-color-glow-fg` | `#0a0a0a` | Text on amber background |

### Semantic tokens

| Token | Value | Role |
|---|---|---|
| `--ds-color-danger` | `#e05555` | Errors, destructive actions |
| `--ds-color-danger-soft` | `rgba(224,85,85, 0.12)` | Error background tint |
| `--ds-color-success` | `#5aab80` | Success states |
| `--ds-color-success-soft` | `rgba(90,171,128, 0.12)` | Success background tint |

### Contrast ratios

| Pair | Ratio |
|---|---|
| `--ds-color-text` on `--ds-color-surface` | ~11:1 |
| `--ds-color-text-muted` on `--ds-color-surface` | ~4.6:1 |
| `--ds-color-accent-fg` on `--ds-color-accent` | 18:1 |
| `--ds-color-glow-fg` on `--ds-color-glow` | ~10:1 |

### Adding new colors

Don't. The amber glow is the single hue budget. If a new semantic state is needed, add it as a grayscale-adjacent token first.

---

## Surfaces

| Class | Treatment | Use |
|---|---|---|
| `.surface-card` | `#1a1a1a`, hairline border, `8px` radius | Default container — cards, sections |
| `.surface-panel` | Same as card, `12px` radius | Auth pages, larger shells |
| `.surface-glass` | `rgba(20,20,20, 0.72)`, `blur(20px)`, hairline border | Sidebar, auth card — over ambient gradient only |

### Rules

- Surfaces are flat. No `::before` highlights, no gradient fills, no shadows on cards.
- Borders do separation (`var(--ds-color-border)`).
- Depth = background value: `#111` → `#1a1a1a` → `#222`. Not shadows.
- `.surface-glass` lives over the ambient-glow background only. Never on forms or content cards.

---

## Ambient background

The `.app-shell` wrapper carries a dual radial gradient:
- Top-left: amber glow at ~4.5% opacity
- Bottom-right: indigo glow at ~3% opacity

Imperceptible on its own but provides the "something alive" quality. This is what makes the glass surfaces work — they blur this gradient, creating depth without shadows.

The landing page adds a dot-grid texture and a stronger amber radial behind the hero.

---

## Buttons

Six variants, three sizes. Every button in the app maps to exactly one combination.

### Variants

| Variant | Appearance | When to use |
|---|---|---|
| `default` | White bg, dark text | Primary form submits — Save, Sign in, Create |
| `spark` | Amber bg + ambient glow | Single creative CTA per view — New idea, Get started |
| `outline` | Transparent + border | Secondary standalone — Sign out, cancel confirmation |
| `ghost` | No bg until hover | Tertiary inline — Cancel in footers, nav-adjacent |
| `ghost-danger` | No bg, danger text | Inline destructive — Delete in rows. Never className-override `ghost` for this. |
| `destructive` | Red bg, white text | Modal confirmation dialogs only |
| `link` | Underline on hover | Inline text links styled as buttons |

### Sizes

| Size | Height | When |
|---|---|---|
| `sm` | 2rem (32px) | Inline row actions — Edit, Delete inside idea rows |
| `default` | 2.5rem (40px) | Form CTAs, card footer actions, standalone |
| `lg` | 2.75rem (44px) | Hero CTAs on landing page only |
| `icon` | 2.5rem × 2.5rem | Square icon-only buttons |

**Rules:**
- Don't mix `sm` and `default` in the same button group.
- Buttons use `--ds-radius-sm` (6px). Not pill-shaped.
- Never use `spark` for form submits — that's what `default` is for.
- Focus ring: `--ds-shadow-focus` (amber 2px ring).

---

## Inputs

All input elements share the same visual treatment:

- Background: `--ds-color-surface-strong`
- Border: `1px solid var(--ds-color-border-strong)`
- Radius: `--ds-radius-sm` (6px)
- Focus: border goes transparent, `--ds-shadow-focus` amber ring appears
- Placeholder: `--ds-color-text-soft`

### Components

| Component | Notes |
|---|---|
| `Input` | Standard single-line. Height: `--ds-size-control-md` |
| `Textarea` | Multi-line. `min-height: 96px`, resize-y |
| `PasswordField` | Input + show/hide toggle (Eye icon) |
| `TagInput` | Chip container + inline input. Shows tag count. |
| `RichEditor` | TipTap editor with toolbar. Active toolbar buttons use `--ds-color-glow-soft` bg. |
| `StatusSelect` | Segmented button group. Active segment: `--ds-color-surface-strong` bg. |

---

## Tags

`.tag-chip` — amber-tinted pill badges for idea categorization.

- Background: `--ds-color-glow-soft`
- Border: `1px solid var(--ds-color-glow-medium)`
- Text: `--ds-color-glow` (amber)
- Size: `0.75rem` text, `font-weight: 500`
- Shape: `--ds-radius-pill` (fully rounded)
- Remove button: `×` with expanded touch target (1.5rem min)

Tags are the only element that uses pill radius. Everything else is rectangular.

---

## Status badges

`.status-badge` — uppercase, small, with a colored dot indicator.

- Font: `0.75rem`, weight 500, uppercase, `0.04em` letter-spacing
- Dot: 5px circle, color-matched to status
- Archived status: `--ds-color-text-muted` at 60% opacity

---

## Cards

Built from `.surface-card` with consistent internal spacing.

| Component | Class/Style |
|---|---|
| `Card` | `.surface-card` wrapper |
| `CardHeader` | `p-6`, flex column, `gap-1.5` |
| `CardTitle` | `text-lg`, `font-semibold`, `--ds-color-text` |
| `CardDescription` | `text-sm`, `--ds-color-text-muted` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `p-6 pt-0`, flex row |

---

## Dialog

Modal dialogs use Radix primitives with Ember treatment:

- **Overlay:** black/50 + `blur-sm`, fade-in animation
- **Content:** `.surface-card` + `--ds-shadow-lg`, scale+fade entrance
- **Title:** `text-sm`, `font-semibold`
- **Description:** `text-xs`, `--ds-color-text-muted`
- Z-index: overlay at `--ds-z-overlay` (40), content at `--ds-z-modal` (50)

---

## Toast

Transient confirmation system — glass-morphism treatment.

- Background: `rgba(28,28,28, 0.82)` + `blur(20px)`
- Position: top-right (desktop), bottom snackbar (mobile, above nav)
- Variants: default (neutral glass), `success` (green tint), `error` (red tint)
- Auto-dismiss: 3 seconds
- Z-index: `--ds-z-toast` (60)
- Animation: `ds-fade-up`

**Rules:**
- Never use toasts for validation or auth errors — those are blocking (use inline feedback).
- Never use inline banners for post-navigation success — use toasts.

---

## Feedback

Two inline classes for blocking, contextual messages:

| Class | Color | Use |
|---|---|---|
| `.feedback-error` | `--ds-color-danger` on `--ds-color-danger-soft` | Auth errors, form-level errors, data load failures |
| `.feedback-success` | `--ds-color-success` on `--ds-color-success-soft` | Success states that need to persist (not navigated away) |

These stay visible until the user acts. Always show in context — near the form or failing element.

---

## Loader

Three-dot bounce animation. `<Loader />` component.

- Inherits `currentColor` — works on any background
- Used in every submit button during loading, and full-page data states
- Pattern: `<><Loader /> Label text</>` inside buttons
- Never use raw "Loading..." text — always the Loader component

---

## Motion

### Keyframes

| Name | Use | Duration |
|---|---|---|
| `ds-bounce` | Loader dots — staggered scale + opacity | 1.4s loop |
| `ds-fade-up` | Page entrance — opacity + translateY(7px) | 0.22s |
| `ds-fade-in` | Overlay/scrim — pure opacity | 0.15s |
| `ds-modal-enter` | Dialog — scale(0.96) + opacity | 0.18s |

### Transitions

| Element | Properties | Duration |
|---|---|---|
| Nav items | color, background, box-shadow | 150ms |
| Idea row hover | background, box-shadow | 150ms |
| Actions reveal | opacity | 120ms |
| Input focus | box-shadow | 150ms |

### Stagger

Idea rows stagger at 40ms intervals via inline `animationDelay`. Capped at ~10 visible rows.

### Reduced motion

All decorative animations respect `prefers-reduced-motion: reduce`. Page entrances are disabled. Loader slows to 3s (still functional).

---

## Spacing

`--ds-space-{n}` in 0.25rem increments.

| Token | Value |
|---|---|
| `--ds-space-1` | 0.25rem (4px) |
| `--ds-space-2` | 0.5rem (8px) |
| `--ds-space-3` | 0.75rem (12px) |
| `--ds-space-4` | 1rem (16px) |
| `--ds-space-5` | 1.25rem (20px) |
| `--ds-space-6` | 1.5rem (24px) |
| `--ds-space-7` | 1.75rem (28px) |
| `--ds-space-8` | 2rem (32px) |
| `--ds-space-9` | 2.25rem (36px) |
| `--ds-space-10` | 2.5rem (40px) |
| `--ds-space-12` | 3rem (48px) |

Always use tokens. Never raw `px` or `rem` for spacing.

---

## Sizing

| Token | Value | Use |
|---|---|---|
| `--ds-size-control-sm` | 2rem (32px) | Small buttons, inline actions |
| `--ds-size-control-md` | 2.5rem (40px) | Default buttons, inputs |
| `--ds-size-control-lg` | 2.75rem (44px) | Hero CTAs (meets 44px touch target) |
| `--ds-size-container` | 72rem | Max content width |

---

## Radius

| Token | Value | Use |
|---|---|---|
| `--ds-radius-sm` | 6px | Buttons, inputs, small controls |
| `--ds-radius-md` | 8px | Cards (`.surface-card`) |
| `--ds-radius-lg` | 12px | Panels (`.surface-panel`) |
| `--ds-radius-pill` | 999px | Tag chips only |

---

## Z-index

| Token | Value | Layer |
|---|---|---|
| `--ds-z-sticky` | 10 | Sticky headers |
| `--ds-z-overlay` | 40 | Dialog backdrop |
| `--ds-z-modal` | 50 | Dialog content |
| `--ds-z-toast` | 60 | Toast notifications |

---

## Shadow

| Token | Value | Use |
|---|---|---|
| `--ds-shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` | Subtle elevation |
| `--ds-shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | Toast, dropdown |
| `--ds-shadow-lg` | `0 8px 24px rgba(0,0,0,0.6)` | Modal content |
| `--ds-shadow-focus` | `0 0 0 2px var(--ds-color-glow-ring)` | Focus ring — amber |

---

## Layout

### App shell (authenticated)

```
.app-shell (ambient gradient bg)
  ├── skip-link (sr-only, visible on focus)
  ├── sidebar (w-56, surface-glass) — logo, nav, logout
  └── content column
        ├── header (page title)
        └── <main> — scroll container on mobile
```

Mobile: full-width content, fixed bottom nav dock (`.nav-shell`) with amber active icon.

### Auth pages

Centered single-column. Glass card over ambient gradient.

```
.auth-root (centered flex, full height, amber glow)
  ├── auth-logo
  └── auth-card (max-w-[22rem], glass)
```

### Landing

`.landing-root` → header + hero. Dot-grid texture, amber radial, amber-accented headline.

### Viewport height

All full-height containers use `min-height: 100dvh` (not `100vh`) for mobile browser chrome.

---

## Light theme

Solarized-inspired. Amber accent adjusts to `#c06000` for contrast on cream backgrounds.

All tokens are overridden under `[data-theme="light"]` in `design-system.css`. The structure and components are identical — only values change.

---

## What Ember is not

- **Not colorful.** One hue. Period.
- **Not playful.** No rounded-everything, no bouncing animations, no emoji in UI.
- **Not shadowed.** Borders and value shifts create hierarchy.
- **Not decorative.** No grain, no noise, no gradients on surfaces.
- **Not cold.** The amber glow exists specifically to prevent the "government office" dark theme.

---

## Contribution rules

1. Use `--ds-color-*` tokens for all colors. No raw hex in components.
2. Use `--ds-radius-sm` for controls, `--ds-radius-md` for cards. No `rounded-lg` on buttons.
3. Hover: `--ds-color-accent-soft` bg tint. Focus: `--ds-shadow-focus` amber ring.
4. New utility classes go in `design-system.css`. Never inline `style={}` for theme values.
5. Touch targets ≥ 44px on mobile.
6. Every UI feature works on desktop and mobile. No desktop-only features.
