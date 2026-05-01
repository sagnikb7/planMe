# Changelog

Format: `[date] scope — description`

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

## Prior (from git log)
| Commit | Summary |
|---|---|
| 6fe209d | Fix: concurrent flush race, entity decode, search clear touch target |
| 22bf21f | Fix: offline sync, search correctness, tag digit support |
| a09024d | Increased MAX_SESSIONS_PER_USER to 5 |
| f01a0fe | Feature: prompt templates, export guard, empty state, lint fixes |
| e8d3438 | Security: rate limiting on all auth endpoints |
