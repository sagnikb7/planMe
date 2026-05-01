# Changelog

Format: `[date] scope — description`

---

## 2026-05-01 (session 4)

### Phase 1 — Pinned ideas
- **New**: `server/src/constants.ts` — `PIN_LIMIT = 3`
- **New**: `client/src/lib/constants.js` — `PIN_LIMIT = 3`
- **Updated**: `server/src/models/idea.model.ts` — `pinned: boolean` field (default `false`)
- **Updated**: `server/src/schemas/idea.schema.ts` — `patchIdeaPinSchema` + `PatchIdeaPinInput`
- **Updated**: `server/src/repositories/idea.repository.ts` — `countPinnedByUser`, `patchPin`; `patchStatus` now clears `pinned` when archiving
- **Updated**: `server/src/services/idea.service.ts` — `patchPin` with PIN_LIMIT enforcement (throws 400 if limit exceeded)
- **Updated**: `server/src/routes/ideas.routes.ts` — `PATCH /api/ideas/:id/pin`
- **Updated**: `client/src/pages/MyIdeas.jsx` — `handlePin` callback; sort floats pinned to top (within pinned group: most-recently-updated first); amber Pin icon badge in title row; pin button in actions (amber when active); pin button hidden for archived/local ideas

### Card footer — gradient bleed layout
- **Updated**: `client/src/pages/MyIdeas.jsx` — date moved from footer to title row (right-aligned, `margin-left: auto`)
- **Updated**: `client/src/pages/MyIdeas.css` — card actions are now `position: absolute` with a `linear-gradient` fade over tags; footer reduced to tags-only (clean single row); `.idea-card .idea-title-row` aligned `center`

---

## 2026-05-01 (session 3)

### Landing page — product/investment-grade polish
- **Updated**: `client/src/pages/Landing.jsx` — full section overhaul
  - Hero: amber pill badge (`Free forever · Open source`), benefit-led subhead, stats strip with `Check` icons replacing old feature pills
  - **New section**: Product preview mockup — browser-chrome container with titlebar (3 dots + label) showing 4 static realistic idea rows with tag chips and timestamps
  - Features: 3-col broken grid → clean 2×2; all icons + copy refreshed (`Zap`, `Hash`, `ShieldCheck`, `WifiOff`); section label added
  - **New section**: How it works — 3-column grid with amber step numbers (`01`/`02`/`03`), `1px` border dividers; collapses vertically on mobile
  - **New section**: Manifesto quote — `"Not a doc. Not a database. Just a place to think."` centered, last clause in amber, font-weight 300
  - Footer CTA: updated headline + sub-text copy; spark button unchanged
- **Updated**: `client/src/pages/Landing.css` — new classes for all new sections; all within amber-only accent and Geist font constraints

### CSS refactor — co-located styles
- **Updated**: `client/src/styles/design-system.css` — trimmed from ~1616 → ~290 lines; now contains only design tokens, keyframes, shell/surface/feedback primitives, `.tag-chip`, `.tag-chip-remove`, `.status-badge`
- **New**: 9 co-located CSS files (plain imports, no CSS Modules, no class renaming):
  - `client/src/pages/auth-layout.css` — auth form layout (Login, Register, ForgotPassword, SessionLimit)
  - `client/src/pages/Landing.css` — all landing page styles
  - `client/src/pages/MyIdeas.css` — ideas list/grid/row/card, drag handle, preview
  - `client/src/pages/ViewIdea.css` — idea view title + content
  - `client/src/components/ui/rich-editor.css` — ProseMirror + task list editor
  - `client/src/components/ui/tag-input.css` — tag input wrap/field/count
  - `client/src/components/ui/tag-picker.css` — tag picker dropdown
  - `client/src/components/ui/status-select.css` — status select button
  - `client/src/context/toast-context.css` — toast viewport + animation
- `.tag-chip` / `.tag-chip-remove` kept in `design-system.css` — used in 5+ unrelated files; treated as shared primitive
- `Profile.jsx` and `Settings.jsx` gained `import '../components/ui/tag-picker.css'` — both use `tag-picker-create-input` directly without importing TagPicker

### Service worker — reliability fixes
- **Updated**: `client/vite.config.js` — workbox: `StaleWhileRevalidate` → `NetworkFirst`, `networkTimeoutSeconds: 4`, `clientsClaim: true`, `skipWaiting: true`, cache renamed `planme-api-v1`, TTL 86400 → 3600

### Offline detection — API-level signal
- **Updated**: `client/src/lib/api.js` — `serverKnownOnline` flag + custom events (`planme:server-offline`, `planme:server-back-online`) dispatched from axios interceptors; replaces `navigator.onLine`-only detection
- **Updated**: `client/src/components/AppShell.jsx` — listens to 4 events: `online`, `offline`, `planme:server-offline`, `planme:server-back-online`; removed `useOnlineStatus` import; fixed `react-hooks/set-state-in-effect` lint error with `setTimeout`

### Session list — device icons
- **Updated**: `client/src/components/SessionList.jsx` — `getDeviceIcon()` selects `Smartphone` (Android/iOS), `Laptop` (macOS/ChromeOS), or `Monitor` (fallback) based on `session.device` string

### Security — dependency patch
- **Updated**: `package.json` (root) — `pnpm.overrides` forces `serialize-javascript@^7.0.5` (fixes RCE CVE and DoS vulnerability in transitive dep)

### File rename
- `client/src/components/ui/ConfirmDialog.jsx` → `confirm-dialog.jsx` (kebab-case consistency); 4 import paths updated

---

## 2026-05-01 (continued)

### Backend: production-grade health endpoint + Render warm-up
- **New**: `server/src/routes/health.routes.ts` — `/api/health` returns MongoDB state, uptime, memory usage, Node version, env; returns `503` when MongoDB is not connected
- **Updated**: `client/src/App.jsx` — fire-and-forget `fetch('/api/health')` on mount; wakes Render before user interacts

### Backend: server-layer refactor
- **New**: `server/src/middleware/rate-limit.ts` — extracted `makeRateLimiter` factory + all 5 pre-built limiters from `auth.routes.ts`
- **New**: `server/src/utils/ip.ts` — extracted `getClientIp(req)` from `auth.routes.ts`
- **New**: `server/src/config/logger-http.ts` — extracted `pinoHttpConfig` from `app.ts`
- **Updated**: `server/src/index.ts` — graceful shutdown on SIGTERM/SIGINT: drains HTTP connections, disconnects MongoDB, force-exits after 10 s
- **Updated**: `server/src/schemas/auth.schema.ts` — email lowercased in schema (`.toLowerCase()`) rather than only in service layer; `forgotPasswordSchema` updated too

### Testing: Vitest unit test suite
- **New**: `server/vitest.unit.config.ts`, `server/vitest.integration.config.ts`
- **New**: 83 unit tests across schemas, utils, middleware (`server/test/unit/`)
- **Updated**: `server/package.json` — `test:unit`, `test:integration`, `test:coverage`, `test:watch` scripts

---

## 2026-05-01

### ConfirmDialog — shared confirmation component
- **New**: `client/src/components/ui/ConfirmDialog.jsx`
  - Props: `open, onOpenChange, title, description (ReactNode), confirmLabel, loading, onConfirm, confirmDisabled, children`
  - Standardizes cancel (`w-full sm:w-auto`, ghost variant) + confirm (ghost-danger, loading spinner) buttons
- **Updated**: `MyIdeas.jsx`
  - Removed combined action-picker dialog (was showing Archive + Delete together)
  - Added dedicated Archive button (direct, no confirm) per non-archived idea row
  - Restore button on archived rows now direct (no confirm, reversible)
  - Trash button now opens focused delete-only ConfirmDialog
  - Added `deleting` loading state to delete button (was missing)
- **Updated**: `ViewIdea.jsx` — inline Dialog replaced with ConfirmDialog
- **Updated**: `SessionList.jsx` — inline Dialog replaced with ConfirmDialog; cancel button gains `w-full sm:w-auto` responsive classes
- **Updated**: `Settings.jsx` — inline Dialog replaced with ConfirmDialog (type-to-confirm input passed as children)

### Docs initialized
- Created `/docs` knowledge base (architecture, flows, apis, modules, guidelines)

---

## 2026-05-01 (security + Google OAuth)

### Security hardening
- **[HIGH fixed]** `app.set('trust proxy', 1)` moved before all middleware — rate limiters now see real client IPs in production (`app.ts`)
- **[MEDIUM fixed]** `deserializeUser` uses `.select()` projection — `password`, `googleId`, `resetPasswordTokenHash`, `resetPasswordExpiresAt` are never loaded into `req.user` (`passport.ts`)
- **[MEDIUM fixed]** Session self-delete TOCTOU in `DELETE /api/sessions/:id` — guard checks current session ID before `terminateSession` mutates DB (`sessions.routes.ts`, `session.service.ts`)
- **[MEDIUM fixed]** Body size limits: `express.json({ limit: '64kb' })`, `urlencoded({ limit: '16kb' })` (`app.ts`)

### Google OAuth
- Added `passport-google-oauth20` strategy with account linking by email for existing local users
- `AUTH_LOCAL_ENABLED` / `AUTH_GOOGLE_ENABLED` env switches — set `false` to disable a strategy; disabled routes return `503`
- User model: `googleId` (sparse unique, absent for local users), `authProvider: 'local'|'google'`, `password` now nullable
- `sanitizeUser` strips `googleId`; adds `hasPassword: boolean` to all `/me` responses
- Server startup now logs `http://localhost:PORT` to stdout

---

## Prior (from git log)
| Commit | Summary |
|---|---|
| 6fe209d | Fix: concurrent flush race, entity decode, search clear touch target |
| 22bf21f | Fix: offline sync, search correctness, tag digit support |
| a09024d | Increased MAX_SESSIONS_PER_USER to 5 |
| f01a0fe | Feature: prompt templates, export guard, empty state, lint fixes |
| e8d3438 | Security: rate limiting on all auth endpoints |
