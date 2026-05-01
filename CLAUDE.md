# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Knowledge Base

All project documentation lives in [`/docs`](./docs/INDEX.md). Use it as the primary reference — before answering questions, planning features, or making changes.

**Lookup protocol:**
1. Check `/docs/INDEX.md` to locate the relevant file
2. Read that file before proceeding
3. If docs are missing or clearly stale, update them first, then proceed

**When to consult `/docs`:**
- Before implementing any feature → read the relevant flow + API docs
- Before adding a constant or limit → check [`/docs/guidelines/constants.md`](./docs/guidelines/constants.md)
- Before adding UI → check [`/docs/guidelines/design-system.md`](./docs/guidelines/design-system.md) **and** [`DESIGN.md`](./DESIGN.md)
- Before touching auth or sessions → read [`/docs/flows/auth.md`](./docs/flows/auth.md) and [`/docs/flows/session-limit.md`](./docs/flows/session-limit.md)
- Before touching offline behavior → read [`/docs/flows/offline-sync.md`](./docs/flows/offline-sync.md)
- To understand any module → [`/docs/modules/server.md`](./docs/modules/server.md) or [`/docs/modules/client.md`](./docs/modules/client.md)

**For any frontend UI work — visual design, layout, components, spacing, color:**
Read [`DESIGN.md`](./DESIGN.md) first. It is the canonical source for:
- The one-font rule (Geist only), weight conventions, type scale
- The amber accent rule — only for active states, focus rings, CTAs; never introduce a second hue
- Surface hierarchy (bg → surface → surface-strong), border and shadow tokens
- Spacing and sizing scale, touch target minimums (≥ 44px)
- What constitutes a valid UI pattern for planMe vs. what violates the design direction

**After any significant change:**
- Patch only the affected doc sections (do not rewrite everything)
- Append a dated entry to [`/docs/CHANGELOG.md`](./docs/CHANGELOG.md)

---

## Commands

pnpm monorepo — always run from the repo root unless filtering explicitly.

```bash
pnpm install                                          # install all workspace deps
pnpm dev                                              # server (5001) + client (5173) concurrently
pnpm build                                            # production build of client → client/dist/
pnpm test                                             # server unit + integration tests
pnpm lint                                             # ESLint on client

pnpm --filter planme-server dev                       # server only
pnpm --filter planme-server test:unit                 # unit tests only (no MongoDB needed, ~1 s)
pnpm --filter planme-server test:integration          # integration tests (requires local MongoDB)
pnpm --filter planme-server test:coverage             # unit tests + v8 coverage report
pnpm --filter client dev                              # client only
pnpm --filter client test                             # client unit tests (Vitest, no MongoDB needed)
```

---

## Environment

Copy `example.env` → `.env` at the repo root. Key vars:

| Var | Default | Notes |
|-----|---------|-------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/planme` | |
| `PORT` | `5001` | 5000 is often taken on macOS |
| `COOKIE_SECRET` | `dev-cookie-secret` | Required in production |
| `NODE_ENV` | `development` | |
| `LOG_LEVEL` | `info` | Pino log level |
| `SMTP_HOST` | _(empty)_ | Leave blank in dev — reset link returned in API response instead |
| `SMTP_PORT` | `587` | 465 for SSL |
| `SMTP_USER` | _(empty)_ | Brevo: your login email |
| `SMTP_PASS` | _(empty)_ | Brevo: SMTP key from dashboard → SMTP & API tab |
| `SMTP_FROM` | `noreply@planme.app` | Sender address shown in email client |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin in dev only; not used in production |
| `MAX_SESSIONS_PER_USER` | `3` (from constants) | Max concurrent sessions per account |

---

## Architecture

### Monorepo layout

```
planMe/
├── client/          React + Vite + Tailwind (TypeScript via JSX)
├── server/          Express API — full TypeScript
│   └── src/
│       ├── config/      env.ts, database.ts, passport.ts
│       ├── constants.ts ← single source of truth for shared values
│       ├── models/      Mongoose schemas + typed interfaces
│       ├── repositories/ all DB queries — no raw Mongoose outside here
│       ├── schemas/     Zod validation schemas — never inline in routes
│       ├── services/    business logic — routes call services, not repos
│       ├── routes/      thin handlers: validate → call service → respond
│       ├── middleware/  auth.ts (ensureAuthenticated), validate.ts (Zod wrapper)
│       ├── utils/       logger.ts, password-policy.ts, email.ts, geo.ts, user-agent.ts
│       └── types/       express.d.ts (Express.User augmentation)
├── .env             local config (gitignored)
└── pnpm-workspace.yaml
```

### Request lifecycle (server)

```
Request → middleware (auth, validate) → route handler → service → repository → DB
```

Routes never touch Mongoose directly. Services never import Express types. Repositories never contain business logic.

### Client

- **Entry:** `client/src/main.jsx` → `App.jsx` (router + auth context)
- **Auth state:** `AuthContext` + `useAuth()` hook. `ProtectedRoute` / `PublicOnlyRoute` guard routes.
- **API calls:** `client/src/lib/api.js` (axios instance, `baseURL: '/api'`, `withCredentials: true`, 8 s timeout — treats timeouts and network errors as offline)
- **Offline layer:** `client/src/lib/db.js` (Dexie IndexedDB, `planme-offline` database) + `client/src/lib/sync.js` (`seedCache`, `flushPendingQueue`, `isOfflineError`). All writes go local-first when offline; sync engine flushes the pending queue on reconnect.
- **Vite proxy:** `/api/*` → `http://localhost:5001` in dev. Responds 503 (not 502) when server is starting.
- **Styling:** Tailwind + `client/src/styles/design-system.css` (custom properties + utility classes)

### Server runtime

- Dev: `tsx watch src/index.ts` — restarts on save, no nodemon needed
- Prod/test: `node -r tsx/cjs` — CJS TypeScript loader, no compile step
- TypeScript is strict (`"strict": true`). No `any`. Use `unknown` at boundaries.

---

## API routes

### Auth (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Zod-validated; bcrypt hash; email normalized lowercase |
| POST | `/login` | Passport local; session regenerated on login (fixation prevention); accepts `rememberMe: boolean` → 30-day cookie |
| POST | `/logout` | Destroys session, clears cookie |
| GET | `/me` | Returns session user (password + reset fields stripped) |
| POST | `/forgot-password` | SHA-256 token hash stored; 2hr TTL; dev returns `resetUrl` in response; prod sends email via SMTP |
| POST | `/reset-password` | Validates token hash + expiry, updates password with `BCRYPT_ROUNDS`, clears token |
| PATCH | `/me` | Update display name (min 2 chars); reflects immediately in session |
| POST | `/change-password` | Validates current password via bcrypt, hashes new password; sessions stay active |
| DELETE | `/me` | Cascade-deletes all ideas + sessions, then destroys user; logs out current session |

### Ideas (`/api/ideas`) — all require auth, scoped to `req.user._id`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all ideas for user |
| GET | `/:id` | Get one idea |
| POST | `/` | Create idea — 400 if `IDEA_LIMIT` (100) reached |
| PUT | `/:id` | Full update |
| PATCH | `/:id/status` | Status-only update (archive / restore) |
| PATCH | `/reorder` | Persist manual drag-and-drop order; body `{ ids: ObjectId[] }`, capped at 500 |
| DELETE | `/:id` | Permanent delete |

### Sessions (`/api/sessions`) — scoped to session user; pending sessions can list + terminate but not access other APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all active sessions (auth or pending user) |
| GET | `/me` | List active sessions for authenticated user only (profile page) |
| DELETE | `/:id` | Terminate a session by opaque `UserSession._id`; destroys the underlying express session |
| POST | `/resolve` | Promote a pending session to active (used after session-limit flow: user must terminate one first) |

Session location is resolved at list time via `geoip-lite` (offline DB). Private/loopback IPs return `"Local"`.

### Health

`GET /api/health` — excluded from HTTP logs.

---

## Client routing

| Type | Paths |
|------|-------|
| Public | `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Protected | `/ideas`, `/ideas/add`, `/ideas/edit/:id`, `/profile`, `/settings` |

---

## Constants rule

**Any value used in more than one file must live in a constants file.** Never hardcode the same string or number twice.

| File | Owns |
|------|------|
| `server/src/constants.ts` | `IDEA_STATUSES`, `PASSWORD_POLICY`, `RESET_TOKEN_TTL_MS`, `SESSION_MAX_AGE_MS`, `REMEMBER_ME_MAX_AGE_MS`, `TAG_MAX_LENGTH`, `IDEA_LIMIT` |
| `client/src/lib/constants.js` | `APP_NAME`, `IDEA_STATUSES`, `IDEA_STATUS_LABELS`, `SORT_OPTIONS`, `PROMPT_TEMPLATES`, `TAG_MAX_LENGTH`, `SEARCH_MIN_LENGTH`, `IDEA_LIMIT` |

Before adding a new configurable value, check these files first. Before using a string like `'archived'` or a number like `32` more than once, extract it.

---

## Design system rules

All styling goes through CSS custom properties. Never use raw hex values or hard-coded px in component files.

| Token family | Examples |
|---|---|
| Colors | `--ds-color-text`, `--ds-color-text-muted`, `--ds-color-glow`, `--ds-color-danger` |
| Surfaces | `--ds-color-surface`, `--ds-color-surface-strong`, `--ds-color-bg` |
| Borders | `--ds-color-border`, `--ds-color-border-strong` |
| Shadows | `--ds-shadow-sm/md/lg`, `--ds-shadow-focus` (amber ring) |
| Radius | `--ds-radius-sm/md/lg/pill` |
| Spacing | `--ds-space-1` through `--ds-space-12` |
| Sizes | `--ds-size-control-sm/md/lg` |

Check `client/src/styles/design-system.css` before writing new CSS — many semantic classes already exist: `.surface-card`, `.surface-glass`, `.feedback-error`, `.feedback-success`, `.tag-chip`, `.status-badge`, `.rich-editor`, `.idea-row`, etc.

The amber glow (`--ds-color-glow: #f59e0b`) is the **single chromatic accent**. Use it only for: active nav indicator, spark button, focus rings, idea index numbers, tag chips, blockquote borders. Do not introduce other accent colors.

---

## Deployment (Render — full stack)

The server serves the compiled React client as static files in production (`isProd` branch in `app.ts`). One Render web service runs everything — no split deployment needed.

The root `package.json` already has the right scripts:
- `pnpm build` — compiles client → `client/dist/` and server → `server/dist/`
- `pnpm start` — `node server/dist/index.js`

### Render web service settings

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Root directory** | *(leave blank — repo root)* |
| **Build command** | `pnpm install && pnpm build` |
| **Start command** | `pnpm start` |
| **Node version** | `22` (already set in `engines` field) |

### Environment variables (set in Render → Service → Environment)

| Var | Notes |
|-----|-------|
| `NODE_ENV` | `production` — enables static serving, secure cookies, trust proxy |
| `MONGO_URI` | MongoDB Atlas connection string |
| `COOKIE_SECRET` | Random string, 32+ chars — use a password manager to generate |
| `LOG_LEVEL` | `info` |
| `SMTP_HOST` | e.g. `smtp-relay.brevo.com` (leave blank to skip email — reset link returned in API response) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Brevo login email |
| `SMTP_PASS` | Brevo SMTP key (from Brevo dashboard → SMTP & API) |
| `SMTP_FROM` | `noreply@planme.app` |
| `PORT` | **Do not set** — Render injects this automatically |
| `CLIENT_ORIGIN` | **Not needed in prod** — CORS is disabled when `NODE_ENV=production` (same origin) |

### MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Network Access → Add IP → `0.0.0.0/0` (Render IPs are dynamic)
3. Create a database user → copy the connection string into `MONGO_URI`

### Local production test before deploying

```bash
pnpm build && NODE_ENV=production pnpm start
```

Visit `http://localhost:5001` — the server now serves the React client from `server/dist`.

---

## Testing

### Server (`pnpm test` or `pnpm --filter planme-server test`)
- Tests: `server/test/api.test.ts` — Node `node:test` runner + `supertest`
- Requires local MongoDB. Uses the `planme_test` database (separate from the dev `planme` db — no data pollution).
- Each test clears all collections via `beforeEach`. The full database is dropped in `test.after`.
- Override the database with `MONGO_TEST_URI` env var (defaults to `mongodb://127.0.0.1:27017/planme_test`).
- `pnpm test` uses `node -r tsx/cjs --test --test-concurrency=1`
- The `createApp()` factory pattern is what makes tests work — tests pass their own `mongoUri` and `MemoryStore`, never reading `.env`.

### Client (`pnpm --filter client test`)
- Tests: `client/src/lib/sync.test.js` — Vitest + `fake-indexeddb`
- No MongoDB or browser required — runs in Node with a fake IndexedDB.
- Covers: `isOfflineError`, `seedCache` (pending-* isolation, bulk upsert), `flushPendingQueue` (all op types, 404 skip, network-error halt, chronological order).
- Config: `client/vitest.config.js`. Add new test files alongside the modules they test (`*.test.js`).

---

## Mobile is a first-class surface

Every UI feature must work on both desktop and mobile. planMe has a mobile bottom nav, touch interactions, and a swipe-to-archive gesture on idea rows. When adding buttons, layouts, or interactions always ask: how does this look and behave on small screens? Touch targets ≥ 44px. Never build a feature that works only on desktop.

---

## Working style

**Ask before implementing non-trivial changes.** If a task involves design decisions, multiple files, or more than one approach — present options and get sign-off. Do not write speculative code.

**Audit before adding.** Before adding any UI element, check if the same data or action already exists on the page or in a nearby component. Render each piece of information exactly once.

**No new constants without the constants file.** If you're about to write a string literal or magic number that could appear again, put it in the appropriate constants file first.

**Thin routes.** If business logic is creeping into a route handler, it belongs in a service. If a service is querying Mongoose directly, that belongs in a repository.

**No `any` in TypeScript.** If the type is genuinely unknown, use `unknown` and narrow it. Type assertions (`as`) are acceptable at documented boundaries (e.g. Passport user casting) but should not be used to paper over missing types.

---

## UI surface responsibilities

Each surface has exactly one job. Do not add features that belong to a different surface.

| Surface | Responsibility | Must NOT |
|---|---|---|
| Landing header | Entry point nav: Log in + Get started | Duplicate the hero CTA |
| Landing hero | Value prop + single primary CTA (guests only) | Show a CTA when user is logged in |
| Sidebar nav | Navigate between app sections | Display user identity |
| Sidebar footer | Navigation overflow (if needed) | Show name, avatar, email, or Log out |
| Profile page | User identity: name, email, joined date, idea stats; Log out action | Duplicate nav links |
| AppShell header | Current section title | Avatar, duplicate nav, user info |
| `/ideas` list | Ideas + filter/sort + tag filter + archive toggle | Inline editing |
| `/ideas/add` | Capture new idea (title, details, tags, status) | Show existing ideas |
| `/ideas/edit/:id` | Edit an existing idea | Show other ideas |
