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
| Backend | Express 4, TypeScript strict, Passport.js (local + Google OAuth) |
| Auth | express-session, connect-mongo, express-rate-limit, passport-google-oauth20 |
| Database | MongoDB via Mongoose 8 |
| Logging | Pino + pino-http |
| Testing | Vitest (unit + integration, server), Vitest + fake-indexeddb (client) |
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

## Running with Docker

The fastest way for teammates to get a working environment — no local MongoDB needed.

**Requirements:** Docker Desktop (or Docker Engine + Compose)

```bash
cp example.env .env        # fill in COOKIE_SECRET at minimum
docker compose build
docker compose up
```

App is at `http://localhost:5001`. MongoDB runs inside Docker and persists data across restarts via a named volume.

**SMTP (optional):** email is not required in dev. If you leave SMTP vars blank, the password reset link is returned directly in the API response. To enable email, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in your `.env`.

```bash
docker compose down          # stop
docker compose down -v       # stop + wipe the database volume
docker compose logs -f app   # tail app logs
```

---

## Scripts

```bash
pnpm dev                       # server + client concurrently
pnpm build                     # compile client → client/dist/ + server → server/dist/
pnpm start                     # start the compiled server (production)
pnpm prod:local                # build + run production server locally

pnpm test                      # server: unit + integration tests (integration requires local MongoDB)
pnpm --filter planme-server test:unit         # unit tests only — no MongoDB needed
pnpm --filter planme-server test:integration  # integration tests — requires MongoDB
pnpm --filter planme-server test:coverage     # unit tests + v8 coverage report
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

# Auth strategy switches (set to "false" to disable)
AUTH_LOCAL_ENABLED=true
AUTH_GOOGLE_ENABLED=true

# Google OAuth (leave blank if AUTH_GOOGLE_ENABLED=false)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
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
│   ├── routes/            auth.routes.ts, ideas.routes.ts, sessions.routes.ts, health.routes.ts
│   ├── middleware/        auth.ts, validate.ts, rate-limit.ts
│   ├── utils/             logger, email, geo, user-agent, password-policy, ip
│   ├── config/            env.ts, database.ts, passport.ts, logger-http.ts
│   ├── app.ts             createApp() factory (used by tests too)
│   └── index.ts           startup + graceful shutdown (SIGTERM/SIGINT)
├── server/test/
│   ├── unit/              schemas/, utils/, middleware/, services/
│   └── integration/       api.test.ts (migrated from node:test → Vitest)
├── example.env
└── pnpm-workspace.yaml
```

---

## API reference

### Auth `/api/auth` — rate limited per IP

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register` | — | 10 req/hr · password: 8+ chars, uppercase, number, symbol · local auth only |
| POST | `/login` | — | 20 req/15 min · returns session cookie · accepts `rememberMe: boolean` · local auth only |
| GET | `/google` | — | Redirect to Google OAuth consent |
| GET | `/google/callback` | — | OAuth callback → redirect to `/ideas` or `/login?error=google` |
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

`GET /api/health` — excluded from HTTP logs. Returns `200 ok` or `503 degraded`.

```json
{
  "status": "ok",
  "uptime": 847,
  "timestamp": "2026-05-01T12:00:00.000Z",
  "services": { "mongodb": { "status": "ok", "state": "connected" } },
  "process": { "nodeVersion": "v22.x", "env": "production", "memoryMB": { "rss": 52, "heapUsed": 28, "heapTotal": 41 } }
}
```

Also used as a Render warm-up signal: the client fires `fetch('/api/health')` on app mount so the server starts waking before the user takes any action.

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

## Mobile / PWA

planMe is a full PWA with a native-feeling mobile experience:

- **Install prompt** — `display: standalone` in the manifest. Add to home screen on iOS and Android.
- **Safe area** — `viewport-fit=cover` + `env(safe-area-inset-bottom)` so the floating nav clears the iPhone home indicator and Dynamic Island.
- **Auto-hiding nav** — the bottom nav slides off screen when scrolling down and reappears on scroll-up, recovering ~64px of vertical space. Always visible at the top and bottom of a page, and resets on every route change.
- **Snackbar toasts** — on mobile (≤ 767px) toasts appear bottom-center above the nav instead of top-right. Tap anywhere on the toast to dismiss. Desktop keeps top-right.
- **Swipe to archive** — swipe an idea row left (≥ 72px, horizontally dominant) to archive it. **Haptic feedback fires on Android** via `navigator.vibrate(10)` — a short 10 ms pulse. iOS Safari does not implement `vibrate`; the call is a silent no-op there.
- **Apple PWA meta tags** — `apple-mobile-web-app-capable` + `apple-mobile-web-app-status-bar-style: black-translucent` for correct iOS standalone behaviour.

---

## Design system

Single dark-first design token set in `design-system.css`. One chromatic accent: amber (`--ds-color-glow: #f59e0b`) — active nav, focus rings, tag chips, CTAs only. Light theme supported via `[data-theme="light"]`. Never use raw hex in component files — always reference a token.

---

## Testing

### Server unit tests (`pnpm --filter planme-server test:unit`)
- Vitest — no MongoDB required, runs in seconds.
- Covers: Zod schemas (auth + idea), utils (password policy, user-agent, geo, IP), middleware (auth, validate).
- `vi.mock()` intercepts repository/email modules — no real DB needed.

### Server integration tests (`pnpm --filter planme-server test:integration`)
- Vitest + supertest against a real MongoDB (`planme_test` db — never touches dev data).
- Sequential (`pool: 'forks', singleFork: true`) to avoid DB race conditions.
- `createApp()` factory — tests pass `mongoUri` + `MemoryStore`, never read `.env`.
- `NODE_ENV=test` bypasses all rate limiters automatically.

### Coverage (`pnpm --filter planme-server test:coverage`)
- v8 coverage via `@vitest/coverage-v8`. Report written to `server/coverage/`.

### Client (`pnpm --filter client test`)
- Vitest + `fake-indexeddb` — no browser or MongoDB required.
- Tests in `sync.test.js` and alongside modules as `*.test.js`.

---

## Troubleshooting

**MongoDB connection error** — confirm MongoDB is running and `MONGO_URI` in `.env` is correct.

**Port conflict** — change `PORT` in `.env` and the Vite proxy target in `client/vite.config.js`.

**503 on first dev load** — server takes ~1 s to boot. Refresh once.

**Tiptap blank in dev** — pre-bundling failed. Run `rm -rf client/node_modules/.vite` and restart.

**Rate limited in dev** — auth endpoints are rate limited in all non-test environments. Limits are generous for normal use. If you hit one while testing manually, wait out the window or temporarily raise the constant in `server/src/constants.ts`.
