# Visual System

## Direction

planMe is a focused dark tool. The design removes friction — no decorative elements, no competing text, one font, one neutral palette. Every element on screen should earn its place.

The rules that don't change:
1. Nothing ornamental — no gradients on surfaces, no noise textures, no ghost words
2. One font — Geist — at different weights and sizes
3. The background is never pure black (#111, not #000) and never light
4. One chromatic accent — amber (`--ds-color-glow`) — used only for active states, the spark CTA, focus rings, and index numbers. Never introduce a second hue.

---

## Font

**Geist** is the only typeface. Loaded via Google Fonts in `client/index.html`. Code blocks use **Geist Mono**.

```css
--font-sans:    "Geist", system-ui, sans-serif
--font-display: "Geist", system-ui, sans-serif
--font-mono:    "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
```

### Weight usage

| Weight | Use |
|---|---|
| 400 | Body text, descriptions, secondary content |
| 500 | Labels, nav items, interactive text, sub-headings |
| 600 | Page headings, card titles, primary labels |

No italic. No decorative sizing. Let weight and color carry hierarchy.

---

## Color palette

Dark-only. Grayscale base with one chromatic accent (amber).

### Base tokens

| Token | Value | Role |
|---|---|---|
| `--ds-color-bg` | `#111111` | Page background |
| `--ds-color-bg-elevated` | `#161616` | Slightly elevated bg layer |
| `--ds-color-surface` | `#1a1a1a` | Cards, panels |
| `--ds-color-surface-strong` | `#222222` | Inputs, elevated elements |
| `--ds-color-text` | `#e8e8e8` | Primary text |
| `--ds-color-text-muted` | `#888888` | Secondary text |
| `--ds-color-text-soft` | `#666666` | Tertiary / very dim |
| `--ds-color-border` | `rgba(255,255,255, 0.07)` | Hairline separators |
| `--ds-color-border-strong` | `rgba(255,255,255, 0.12)` | Borders on interactive elements |
| `--ds-color-accent` | `#ffffff` | Standard primary button bg |
| `--ds-color-accent-hover` | `rgba(255,255,255,0.88)` | Button hover |
| `--ds-color-accent-fg` | `#111111` | Text placed ON a white/accent bg |
| `--ds-color-accent-soft` | `rgba(255,255,255,0.05)` | Hover bg |
| `--ds-color-danger` | `#e05555` | Errors, destructive actions |
| `--ds-color-danger-soft` | `rgba(224,85,85, 0.12)` | Error bg tint |
| `--ds-color-success` | `#5aab80` | Success states |
| `--ds-color-success-soft` | `rgba(90,171,128, 0.12)` | Success bg tint |

### Glow / chromatic tokens

The single chromatic note. Amber is warm, rare in dark UIs, and reads as creative energy — right for an ideas tool.

| Token | Value | Role |
|---|---|---|
| `--ds-color-glow` | `#f59e0b` | Active nav, idea index numbers, spark button bg, logo icon |
| `--ds-color-glow-soft` | `rgba(245,158,11, 0.07)` | Active nav bg, hover tints for glow elements |
| `--ds-color-glow-medium` | `rgba(245,158,11, 0.13)` | Stronger amber tint |
| `--ds-color-glow-ring` | `rgba(245,158,11, 0.28)` | Focus rings, avatar ring, button glow shadow |
| `--ds-color-glow-fg` | `#0a0a0a` | Text ON the spark button (dark text on amber) |

### Contrast rules

- `--ds-color-text` (#e8e8e8) on `--ds-color-surface` (#1a1a1a): ~11:1 ✓
- `--ds-color-text-muted` (#888) on `--ds-color-surface` (#1a1a1a): ~4.6:1 ✓
- `--ds-color-text-soft` (#666) on `--ds-color-bg` (#111): ~4.6:1 ✓
- `--ds-color-accent-fg` (#111) on `--ds-color-accent` (#fff): 18:1 ✓
- `--ds-color-glow-fg` (#0a0a0a) on `--ds-color-glow` (#f59e0b): ~9:1 ✓

All functional text (dates, index numbers, status badges, tag chips) is set at `0.75rem` minimum (12px). Never go below 12px for text that conveys information.

### Adding new colors

Don't add additional chromatic colors. The amber glow is the single hue budget — it's been carefully chosen to feel intentional rather than random. If a new semantic state is needed, add it as a grayscale-adjacent token first.

---

## Surfaces

| Class | What it is |
|---|---|
| `.surface-card` | `#1a1a1a` bg with hairline border, `8px` radius — default container |
| `.surface-panel` | Same as card but `12px` radius — auth pages, larger shells |
| `.surface-glass` | Frosted-glass panel (`rgba(20,20,20,0.6)`, `backdrop-filter: blur(20px)`) — sidebar only |
| `.nav-shell` | Dark blurred bg for mobile bottom nav, amber hairline shadow |
| `.feedback-error` | Red-tinted error notice |
| `.feedback-success` | Green-tinted success notice |

### Rules
- Surfaces are flat — no `::before` highlights, no gradient fills, no shadows on cards
- Borders do the separation work (`var(--ds-color-border)`)
- Depth is expressed by background value: `#111` → `#1a1a1a` → `#222` — not by shadows
- `.surface-glass` is for panels over the ambient-glow background only (sidebar). Don't use on forms or cards inside content.

---

## Ambient background

The `.app-shell` wrapper and `.auth-root` page carry a very subtle dual radial gradient:
- Top-left: amber glow at ~4.5% opacity
- Bottom-right: indigo glow at ~3% opacity

This creates atmosphere and makes the glassmorphism sidebar legible. The gradient is imperceptible on its own but provides the "something alive" quality the dark theme would otherwise lack.

The landing page additionally uses a dot-grid texture (`::after` pseudo) and a stronger amber radial behind the hero section.

---

## Buttons

### Variants

| Variant | When |
|---|---|
| `default` | Primary form submit — white bg, dark text. Save, Sign in, Create account. |
| `spark` | Single primary creative CTA per view — amber bg + glow. New idea, Get started. |
| `outline` | Standalone secondary — transparent bg with border. Sign out, destructive confirm. |
| `ghost` | Tertiary inline — no bg until hover. Cancel in card footers, nav-adjacent actions. |
| `ghost-danger` | Inline destructive row action — no bg until hover, danger color. Delete in lists. Never use `className` overrides on `ghost` for danger — use this variant. |
| `destructive` | Full destructive confirmation — red bg, white text. Reserved for modal confirm dialogs. |

### Sizes

| Size | Height | When |
|---|---|---|
| `sm` | 2rem (h-8) | Inline row actions (Edit, Delete inside idea rows), controls alongside inputs |
| `default` | 2.5rem (h-10) | Form CTAs, card footer actions, standalone buttons |
| `lg` | 2.75rem (h-11) | Hero CTAs on landing page only |

**Rule**: Don't mix `sm` and `default` in the same button group. Card footer Save + Cancel are both `default`. Row Edit + Delete are both `sm`.

Buttons use `--ds-radius-sm` (6px). Not pill-shaped — clean geometric rectangle.

---

## Tokens reference

### Spacing scale

`--ds-space-1` through `--ds-space-12` in 0.25rem increments. Available values: 1 (0.25), 2 (0.5), 3 (0.75), 4 (1), 5 (1.25), 6 (1.5), **7 (1.75)**, 8 (2), **9 (2.25)**, 10 (2.5), 12 (3). Always use these tokens — never raw `px` or `rem` for spacing.

### Z-index scale

| Token | Value | Layer |
|---|---|---|
| `--ds-z-sticky` | 10 | Landing header, other sticky elements |
| `--ds-z-overlay` | 40 | Dialog backdrop / scrim |
| `--ds-z-modal` | 50 | Dialog content |
| `--ds-z-toast` | 60 | Toast notifications (future) |

Use these tokens via Tailwind arbitrary values: `z-[var(--ds-z-modal)]`.

### Viewport height

All full-height containers use `min-height: 100dvh` (not `100vh`) to account for mobile browser chrome. This applies to `.app-shell`, `.auth-root`, `.landing-root`, and `#root`.

---

## Layout

### App shell (authenticated)

```
#111 + ambient glow background
  ├── skip-link (sr-only, visible on focus — keyboard a11y)
  ├── sidebar (w-56, surface-glass) — logo w/ sparkles icon, nav, logout
  └── content area
        ├── header (page title)
        └── <main id="main-content"> <Outlet /> </main>
```

Mobile: content full-width, fixed bottom nav dock (`nav-shell`) with amber active icon.

The skip-link targets `#main-content` and is visually hidden until focused via keyboard (`sr-only focus:not-sr-only`). It must remain the first focusable element inside `.app-shell`.

### Auth pages

Centered single-column layout using `.auth-root`. Auth card uses glass treatment (frosted). No split panel, no story content.

```
auth-root (centered flex, full height, amber ambient glow)
  auth-logo  ← Logo with Sparkles icon
  auth-card  ← max-w-[22rem] glass form
```

### Public landing

`.landing-root` → `.landing-header` + `.landing-hero`. Dot-grid texture, amber radial glow, amber-accented headline word.

---

## Components

### Existing shared components

- `Button` — `client/src/components/ui/button.jsx` — 5 variants: default, spark, outline, ghost, destructive
- `Input`, `Textarea` — `--ds-color-surface-strong` bg, amber focus ring via `--ds-shadow-focus`
- `PasswordField` — same as Input with show/hide toggle
- `Label` — small text above inputs
- `Logo` — `client/src/components/Logo.jsx` — includes amber Sparkles icon
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` — wrappers around `.surface-card`

### Adding a new component

1. Use `--ds-color-*` tokens for all colors
2. Use `--ds-radius-sm` (6px) for small controls, `--ds-radius-md` (8px) for cards
3. No italic, no display-font sizing, no decorative treatments
4. Hover state: `--ds-color-accent-soft` bg tint (`rgba(255,255,255,0.05)`)
5. Focus: `--ds-shadow-focus` = `0 0 0 2px var(--ds-color-glow-ring)` (amber ring)
6. New utility classes go in `design-system.css` — never inline `style={}` for theme values

### Ideas list

`.ideas-list` / `.idea-row`. Each row is a 2-column grid: narrow left column with amber index number + muted date, right column with title + preview + actions. Actions hide on desktop and reveal on hover **or keyboard focus** (`:focus-within`). Always visible on touch. Row hover adds amber left-border accent via `box-shadow: inset 2px 0 0 var(--ds-color-glow)`.

### Nav active state

Active nav items use `--ds-color-glow-soft` bg tint and white text (desktop) or amber text + icon (mobile). The icon on active desktop items is tinted amber. Never use `--ds-color-accent-soft` for the active state — that 5% white tint is too invisible.

---

## Motion

Purposeful and minimal. Every animation either communicates state or reduces perceived wait time — never decorative.

### Reduced motion

All decorative animations respect `prefers-reduced-motion: reduce`. Page entrances (`.ds-page-enter`, `.auth-card`, `.idea-row`) are disabled outright. The loader slows to 3s instead of being removed — it's functional feedback, not decoration.

### Keyframes

| Name | Use |
|---|---|
| `ds-bounce` | 3-dot loader — staggered scale + opacity pulse |
| `ds-fade-up` | Entrance — opacity 0→1 + translateY 7px→0, 0.22s |
| `ds-fade-in` | Overlay/scrim — pure opacity fade, no translate |
| `ds-modal-enter` | Dialog — scale 0.96→1 + opacity, centered via transform |

### Loader — `<Loader />`

`client/src/components/ui/loader.jsx` — three dots using `.ds-loader` / `.ds-loader-dot` CSS classes.

- Inherits `currentColor` — works on any button variant or background
- Used in every form submit button during `isSubmitting`, and in full-page data loading states
- Rendered as `<><Loader /> Label text</>` inside buttons so the label stays visible

**Never** use raw "Loading…" or "Saving…" text strings — always `<Loader />` + short label.

### Page entrance — `.ds-page-enter`

Applied to `<main key={location.pathname}>` in `AppShell`. The `key` forces a remount on every route change, replaying the `ds-fade-up` animation (0.22s). Auth cards use the same animation with a 0.06s delay so the logo lands first.

### Nav active indicator

Desktop sidebar active items use `shadow-[inset_2px_0_0_var(--ds-color-glow)]` — an amber left-border effect rendered via `box-shadow` (no layout shift). Transitions via `transition-[color,background-color,box-shadow] duration-150`.

### All transitions

| Element | Property | Duration |
|---|---|---|
| Nav items | color, background-color, box-shadow | 150ms |
| Idea row hover | background, box-shadow | 150ms |
| Actions reveal | opacity | 120ms |
| Button hover | color, background, box-shadow | built-in |
| Spark button glow | box-shadow | built-in |

### Stagger

Idea rows use `style={{ animationDelay: '${index * 40}ms' }}` with the `.idea-row` base animation (`ds-fade-up`). First row enters immediately, subsequent rows stagger at 40ms intervals. Cap visible at ~10 rows before delay becomes noticeable.

No entrance animations on hover states, tooltips, or dropdowns. No typewriter effects. No looping motion outside the Loader.

---

## Feedback system

Two tiers — choose based on whether the feedback is blocking or informational.

### Inline — blocking, context-dependent

Use `feedback-error` / `feedback-success` CSS classes for:
- Auth errors (login failure, registration failure)
- Form-level errors (`errors.root`)
- Field validation errors (below each field, `text-xs text-[var(--ds-color-danger)]`)
- Data load failures (ideas list, view page)

These stay visible until the user acts. They must appear in context — near the form or the failing element.

### Toast — transient confirmations

Use `useToast()` from `@/context/toast-context` for actions that succeed silently:

| Action | Message |
|---|---|
| Create idea | "Idea saved" |
| Update idea | "Idea updated" |
| Delete idea | "Idea deleted" |
| Archive idea | "Idea archived" |
| Restore idea | "Idea restored" |

Toast API: `toast(message, variant?)` where variant is `'success'` (default) or `'error'`.
Auto-dismiss at 3 s. Position: top-right, z-index `--ds-z-toast` (60).

**Never** use toasts for validation or auth errors — those are blocking and need inline treatment.
**Never** use inline banners for success confirmations after navigation — use toasts.

---

## What to avoid

- Any second chromatic color beyond amber (no blues, greens, purples as accent)
- Italic or serif typography
- Gradient backgrounds on surfaces or cards
- Decorative elements: noise, grain, dot grids **inside the app shell** (dot grid is landing-only)
- Split-panel auth layouts with marketing copy
- Tip cards or info blocks inside the shell UI
- Shadows on regular content cards (borders handle separation)
- Pill-shaped buttons (use `--ds-radius-sm` rectangles)
- Using `spark` variant for form submits — that's what `default` (white) is for
- Using `surface-glass` on content cards — glass is sidebar + auth card only
