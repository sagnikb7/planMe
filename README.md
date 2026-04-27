# planMe

A private idea workspace. Capture thoughts, tag them, and come back to the ones worth pursuing. Works offline.

**v0.9.0** — React + Vite frontend, Express + TypeScript API, MongoDB, deployed on Render.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite 8, Tailwind CSS v4 |
| Rich text | Tiptap v3 (StarterKit + task lists) |
| Offline | Dexie.js (IndexedDB), Workbox (service worker, runtime cache) |
| Forms | React Hook Form, Zod v4 |
| Backend | Express 4, TypeScript strict, Passport.js local strategy |
| Auth | express-session, connect-mongo, express-rate-limit |
| Database | MongoDB via Mongoose 8 |
| Logging | Pino + pino-http |
| Testing | `node:test` + supertest (server), Vitest + fake-indexeddb (client) |
| Tooling | pnpm workspaces, concurrently, ESLint |

---

## Getting started

**Requirements:** Node 22+, pnpm, MongoDB

```bash
pnpm install
cp example.env .env
pnpm dev
```

Client → `http://localhost:5173` &nbsp;·&nbsp; API → `http://localhost:5001`

Vite proxies `/api/*` to the Express server in dev. The server runs via `tsx watch` — no compile step needed.

---

## Scripts

```bash
pnpm dev                       # server + client concurrently
pnpm build                     # compile client → client/dist/ + server → server/dist/
pnpm start                     # start the compiled server (production)
pnpm prod:local                # build + run production server locally

pnpm test                      # server integration tests (requires local MongoDB)
pnpm --filter client test      # client unit tests (Vitest, no MongoDB needed)
pnpm lint                      # ESLint on client
```

### Test locally in production mode

```bash
pnpm prod:local
```

Express serves the compiled React app from `client/dist/` and falls back to `index.html` for client-side routing. Visit `http://localhost:5001`.

---

## Environment variables

Copy `example.env` → `.env`. Key vars:

```env
MONGO_URI=mongodb://127.0.0.1:27017/planme
PORT=5001
COOKIE_SECRET=change-me-in-production
NODE_ENV=development
LOG_LEVEL=info

# Leave blank in dev — reset URL is returned in the API response instead
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@planme.app

CLIENT_ORIGIN=http://localhost:5173
```

---

## Project structure

```
planMe/
├── client/src/
│   ├── components/        AppShell, OfflineBanner, ui/* (button, card, rich-editor, …)
│   ├── context/           AuthContext
│   ├── hooks/             useAuth, useTheme, useOnlineStatus
│   ├── lib/
│   │   ├── api.js         axios instance (8s timeout, offline interceptor)
│   │   ├── db.js          Dexie IndexedDB schema (planme-offline)
│   │   ├── sync.js        flushPendingQueue, seedCache, isOfflineError
│   │   ├── sync.test.js   Vitest unit tests
│   │   └── constants.js   shared FE constants
│   ├── pages/             Landing, Login, Register, MyIdeas, AddIdea, EditIdea, …
│   └── styles/design-system.css   CSS tokens + utility classes
├── server/src/
│   ├── config/            env.ts, database.ts, passport.ts
│   ├── constants.ts       shared BE constants (rate limits, session TTLs, …)
│   ├── models/            Mongoose schemas
│   ├── repositories/      all DB queries
│   ├── schemas/           Zod validation (never inline in routes)
│   ├── services/          business logic
│   ├── routes/            auth.routes.ts, ideas.routes.ts, sessions.routes.ts
│   ├── middleware/        auth.ts (ensureAuthenticated), validate.ts
│   ├── utils/             logger, email, geo, user-agent, password-policy
│   ├── app.ts             createApp() factory (used by tests too)
│   └── index.ts           startup
├── server/test/api.test.ts
├── example.env
└── pnpm-workspace.yaml
```

---

## API reference

### Auth `/api/auth` — rate limited per IP

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register` | — | 10 req/hr · password: 8+ chars, uppercase, number, symbol |
| POST | `/login` | — | 20 req/15 min · returns session cookie · accepts `rememberMe: boolean` |
| POST | `/logout` | ✓ | Destroys session |
| GET | `/me` | ✓ | Current user (sanitized) |
| PATCH | `/me` | ✓ | Update display name |
| POST | `/forgot-password` | — | 5 req/hr · dev: `resetUrl` in response · prod: email via SMTP |
| POST | `/reset-password` | — | 10 req/15 min · token TTL 2 hrs |
| POST | `/change-password` | ✓ | 10 req/15 min |
| DELETE | `/me` | ✓ | Cascade deletes all ideas + sessions |

### Ideas `/api/ideas` — all require auth, scoped to session user

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | List all ideas |
| GET | `/:id` | Single idea |
| POST | `/` | Create · max 100 ideas |
| PUT | `/:id` | Full update |
| PATCH | `/:id/status` | `draft \| archived` · returns full updated idea |
| PATCH | `/reorder` | Persist drag-and-drop order · body `{ ids: ObjectId[] }` |
| DELETE | `/:id` | Permanent delete |
| GET | `/tags` | All tags with usage counts |
| PATCH | `/tags/:tag` | Rename a tag across all ideas |

### Sessions `/api/sessions`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/me` | Active sessions for current user |
| DELETE | `/:id` | Terminate a session |
| POST | `/resolve` | Promote pending session after terminating another |

### Health

`GET /api/health` → `{ ok: true }` — excluded from HTTP logs.

---

## Architecture

### Request lifecycle

```
Request → rate limiter → auth middleware → Zod validate → route handler → service → repository → MongoDB
```

- **Routes** — validate, call one service method, respond. No Mongoose.
- **Services** — business logic only. No Express types.
- **Repositories** — all Mongoose queries. Nothing else.

### Offline support

All writes go local-first when `navigator.onLine` is false or a request times out (8 s):

1. Ideas are written to IndexedDB (`planme-offline`) with a `pending-*` sync status.
2. On reconnect, `flushPendingQueue()` replays ops in order: `pending-create → POST`, `pending-update → PUT`, `pending-archive → PATCH /status`, `pending-delete → DELETE`.
3. 404 responses during sync are cleaned up silently. Network errors halt the queue and retry on next reconnect.
4. `GET /api/ideas` uses a Workbox `StaleWhileRevalidate` runtime cache — the list loads instantly even during a Render cold-start.

### Cache busting

Vite content-hashes all output filenames. The service worker precache manifest regenerates on every build, triggering a SW update cycle automatically. `registerType: 'autoUpdate'` means the new SW activates without requiring a manual reload.

---

## Design system

Single dark-first design token set in `design-system.css`. One chromatic accent: amber (`--ds-color-glow: #f59e0b`) — active nav, focus rings, tag chips, CTAs only. Light theme supported via `[data-theme="light"]`. Never use raw hex in component files — always reference a token.

---

## Testing

### Server (`pnpm test`)
- `node:test` + supertest against a real MongoDB (`planme_test` db — separate from dev).
- 31 tests covering auth, password reset, sessions, idea CRUD, status updates, and geo utilities.
- `createApp()` factory pattern — tests pass their own `mongoUri` + `MemoryStore`, never read `.env`.
- `NODE_ENV=test` is set by the test script — rate limiters are bypassed automatically.

### Client (`pnpm --filter client test`)
- Vitest + `fake-indexeddb` — no browser or MongoDB required.
- 19 tests in `sync.test.js`: `isOfflineError` (5), `seedCache` (6), `flushPendingQueue` (8).
- Add new test files alongside their module: `foo.test.js` next to `foo.js`.

---

## Troubleshooting

**MongoDB connection error** — confirm MongoDB is running and `MONGO_URI` in `.env` is correct.

**Port conflict** — change `PORT` in `.env` and the Vite proxy target in `client/vite.config.js`.

**503 on first dev load** — server takes ~1 s to boot. Refresh once.

**Tiptap blank in dev** — pre-bundling failed. Run `rm -rf client/node_modules/.vite` and restart.

**Rate limited in dev** — auth endpoints are rate limited in all non-test environments. Limits are generous for normal use. If you hit one while testing manually, wait out the window or temporarily raise the constant in `server/src/constants.ts`.
