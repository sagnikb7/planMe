# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Commands

pnpm monorepo — always run from the repo root unless filtering explicitly.

```bash
pnpm install                         # install all workspace deps
pnpm dev                             # server (5001) + client (5173) concurrently
pnpm build                           # production build of client → client/dist/
pnpm test                            # server integration tests (no DB setup needed)
pnpm lint                            # ESLint on client

pnpm --filter planme-server dev      # server only
pnpm --filter planme-server test     # server tests only
pnpm --filter client dev             # client only
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
- **API calls:** `client/src/lib/api.js` (axios instance, `baseURL: '/api'`, `withCredentials: true`)
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
| POST | `/login` | Passport local; session regenerated on login (fixation prevention) |
| POST | `/logout` | Destroys session, clears cookie |
| GET | `/me` | Returns session user (password + reset fields stripped) |
| POST | `/forgot-password` | SHA-256 token hash stored; 2hr TTL; dev returns `resetUrl` in response; prod sends email via SMTP |
| POST | `/reset-password` | Validates token hash + expiry, updates password with `BCRYPT_ROUNDS`, clears token |

### Ideas (`/api/ideas`) — all require auth, scoped to `req.user._id`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all ideas for user |
| GET | `/:id` | Get one idea |
| POST | `/` | Create idea — 400 if `IDEA_LIMIT` (100) reached |
| PUT | `/:id` | Full update |
| PATCH | `/:id/status` | Status-only update (used by archive action) |
| DELETE | `/:id` | Permanent delete |

### Sessions (`/api/sessions`) — scoped to session user; pending sessions can list + terminate but not access other APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all active sessions for user — includes `id`, `ip`, `device`, `location`, `createdAt`, `isCurrent` |
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
| `server/src/constants.ts` | `IDEA_STATUSES`, `PASSWORD_POLICY`, `RESET_TOKEN_TTL_MS`, `SESSION_MAX_AGE_MS`, `TAG_MAX_LENGTH`, `IDEA_LIMIT` |
| `client/src/lib/constants.js` | `APP_NAME`, `IDEA_STATUSES`, `IDEA_STATUS_LABELS`, `SORT_OPTIONS`, `TAG_MAX_LENGTH`, `SEARCH_MIN_LENGTH`, `IDEA_LIMIT` |

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

## Testing

- Tests: `server/test/api.test.ts` — Node `node:test` runner + `supertest` + `mongodb-memory-server`
- No real MongoDB needed. Each test gets a fresh in-memory DB via `beforeEach`.
- `pnpm test` uses `node -r tsx/cjs --test --test-concurrency=1`
- No client-side tests exist.
- The `createApp()` factory pattern is what makes tests work — tests pass their own `mongoUri` and `MemoryStore`, never reading `.env`.

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
| Sidebar footer | Single Log out action | Show name, avatar, or email |
| Profile page | User identity: name, email, joined date | Contain a Log out button |
| AppShell header | Current section title | Avatar, duplicate nav, user info |
| `/ideas` list | Ideas + filter/sort + tag filter + archive toggle | Inline editing |
| `/ideas/add` | Capture new idea (title, details, tags, status) | Show existing ideas |
| `/ideas/edit/:id` | Edit an existing idea | Show other ideas |
