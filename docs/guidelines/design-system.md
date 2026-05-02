# Ember Design System

Source: `client/src/styles/design-system.css` | Full spec: [`DESIGN.md`](../../DESIGN.md) | Dev showcase: `/design-system` (dev only)

## Rule
All styling through CSS custom properties. No raw hex or hard-coded px in component files.

## Token Families
| Family | Examples |
|---|---|
| Colors | `--ds-color-text`, `--ds-color-text-muted`, `--ds-color-text-soft` |
| Surfaces | `--ds-color-surface`, `--ds-color-surface-strong`, `--ds-color-bg` |
| Accent | `--ds-color-accent`, `--ds-color-accent-soft`, `--ds-color-accent-hover`, `--ds-color-accent-fg` |
| Danger | `--ds-color-danger`, `--ds-color-danger-soft` |
| Glow | `--ds-color-glow` (#f59e0b amber), `--ds-color-glow-fg`, `--ds-color-glow-shadow`, `--ds-color-glow-medium`, `--ds-color-glow-soft` |
| Borders | `--ds-color-border`, `--ds-color-border-strong` |
| Shadows | `--ds-shadow-sm/md/lg`, `--ds-shadow-focus` (amber ring) |
| Radius | `--ds-radius-sm/md/lg/pill` |
| Spacing | `--ds-space-1` → `--ds-space-12` |
| Sizes | `--ds-size-control-sm/md/lg` |

## Amber Glow Accent
`--ds-color-glow: #f59e0b` — **single chromatic accent**  
Allowed uses: active nav indicator, spark button, focus rings, idea index numbers, tag chips, blockquote borders.  
Do not introduce other accent colors.

## CSS co-location
Component-specific styles are co-located with their component/page as plain CSS imports (no CSS Modules, no class renaming — classes are still global). Only shared primitives used in 3+ unrelated files live in `design-system.css`.

| File | Owns |
|---|---|
| `design-system.css` | Tokens, keyframes, shell, surfaces, feedback, `.tag-chip`, `.tag-chip-remove`, `.status-badge` |
| `pages/Landing.css` | All `.landing-*` classes |
| `pages/auth-layout.css` | `.auth-root`, `.auth-logo`, `.auth-card` |
| `pages/MyIdeas.css` | `.ideas-*`, `.idea-row`, `.idea-card`, `.idea-drag-handle`, `.idea-preview-rich` |
| `pages/ViewIdea.css` | `.idea-view-title`, `.idea-content` |
| `components/ui/rich-editor.css` | `.rich-editor` + ProseMirror |
| `components/ui/tag-input.css` | `.tag-input-wrap`, `.tag-input-field`, `.tag-input-count` |
| `components/ui/tag-picker.css` | `.tag-picker` + nested |
| `components/ui/status-select.css` | `.status-select`, `.status-select-btn` |
| `context/toast-context.css` | `.toast-viewport`, `.toast`, `.toast-dismiss` |
| `pages/DesignSystem.css` | `.ds-showcase`, `.ds-hero`, `.ds-section`, etc. (dev-only showcase page) |

Note: pages that use a component's CSS class *without* importing the component must add an explicit CSS import (e.g. `Profile.jsx` and `Settings.jsx` import `tag-picker.css` directly).

## Semantic Classes (already exist — check before writing new CSS)
`.surface-card`, `.surface-glass`, `.feedback-error`, `.feedback-success`, `.tag-chip`, `.tag-chip-remove`, `.status-badge`, `.status-badge-dot`, `.app-shell`, `.nav-shell`, `.link-accent`

Component-scoped classes (see their co-located CSS files above):
`.rich-editor`, `.idea-row`, `.idea-card`, `.idea-title`, `.idea-meta`, `.idea-row-actions`, `.ideas-list`, `.ideas-grid`, `.ideas-empty`, `.idea-drag-handle`, `.idea-index`, `.idea-date`, `.idea-preview-rich`, `.idea-title-row`, `.idea-card-date`, `.idea-row-body`, `.idea-row-left`

## Button Variants (`components/ui/button.jsx`)
| Variant | Use |
|---|---|
| `default` | Standard CTA |
| `spark` | Amber glow — primary creative action (new idea, capture) |
| `destructive` | Filled red — critical destructions |
| `outline` | Secondary bordered |
| `ghost` | Text-only, hover bg |
| `ghost-danger` | Inline destructive (row-level delete) |
| `link` | Underline text |

Sizes: `default` (md), `sm`, `lg`, `icon`

## Mobile-First Rule
Every UI feature works on both desktop and mobile. Touch targets ≥ 44px. Bottom nav + swipe gestures on mobile.
