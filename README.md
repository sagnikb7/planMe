# planMe

A private idea workspace. Capture thoughts, tag them, track their stage, and come back to the ones worth pursuing.

---

## Features

- **Rich text editing** — Tiptap editor with bold, italic, headings, lists, blockquote, and inline code
- **Tags** — free-form tags per idea, clickable to filter the list
- **Stage tracking** — Draft / Archived per idea
- **Archive or delete** — soft-archive ideas instead of hard-deleting them
- **Full-text search** — searches title, body, and tags
- **Password reset flow** — SHA-256 token, 1-hour TTL, dev mode returns reset URL in response
- **Session-based auth** — Passport local strategy, MongoDB-backed sessions, session fixation prevention

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite 8, Tailwind CSS v4, DOMPurify |
| Forms | React Hook Form, Zod v4, @hookform/resolvers |
| Rich text | Tiptap v2 (StarterKit) |
| UI primitives | Radix UI (Label, Slot, Toast, Dialog) |
| Backend | Express 4, TypeScript (strict), tsx (no compile step) |
| Auth | Passport.js local strategy, express-session, connect-mongo |
| Database | MongoDB via Mongoose 8 |
| Validation | Zod v3 (server), Zod v4 (client) |
| Logging | Pino + pino-http |
| Tooling | pnpm workspaces, concurrently, ESLint |
| Testing | Node built-in `node:test`, supertest, mongodb-memory-server |

---

## Project structure

```
planMe/
├── client/
│   └── src/
│       ├── components/
│       │   ├── ui/          button, card, input, dialog, rich-editor, tag-input, status-select, …
│       │   ├── AppShell.jsx
│       │   └── Logo.jsx
│       ├── context/         AuthContext
│       ├── hooks/           useAuth, useTheme
│       ├── lib/
│       │   ├── api.js       axios instance
│       │   └── constants.js shared FE constants
│       ├── pages/           Landing, Login, Register, MyIdeas, AddIdea, EditIdea, Profile, Settings, …
│       └── styles/
│           └── design-system.css  CSS custom properties + utility classes
├── server/
│   └── src/
│       ├── config/          env.ts, database.ts, passport.ts
│       ├── constants.ts     shared BE constants
│       ├── models/          user.model.ts, idea.model.ts
│       ├── repositories/    user.repository.ts, idea.repository.ts
│       ├── schemas/         auth.schema.ts, idea.schema.ts (Zod)
│       ├── services/        auth.service.ts, idea.service.ts
│       ├── routes/          auth.routes.ts, ideas.routes.ts
│       ├── middleware/      auth.ts, validate.ts
│       ├── utils/           logger.ts, password-policy.ts
│       ├── types/           express.d.ts
│       ├── app.ts           createApp() factory
│       └── index.ts         startup
│   └── test/
│       └── api.test.ts
├── example.env
└── pnpm-workspace.yaml
```

---

## Getting started

**Requirements:** Node.js 20+, pnpm, MongoDB (local or remote)

```bash
# 1. Install dependencies
pnpm install

# 2. Create local env file
cp example.env .env

# 3. Start everything
pnpm dev
```

Client: `http://localhost:5173` — Backend: `http://localhost:5001`

In dev, Vite proxies all `/api/*` requests to the Express server. The server runs with `tsx watch` — no separate compile step.

---

## Environment variables

```env
MONGO_URI=mongodb://127.0.0.1:27017/planme
PORT=5001
COOKIE_SECRET=change-me-in-production
NODE_ENV=development
LOG_LEVEL=info
```

- `PORT` defaults to 5001 — port 5000 is often in use on macOS.
- `COOKIE_SECRET` can be any string in dev. Set a real secret in production.
- In dev, `POST /api/auth/forgot-password` returns the reset URL directly in the response body (no email sending).

---

## Scripts

```bash
pnpm dev          # server + client (concurrently)
pnpm build        # production build → client/dist/ (served by Express)
pnpm start        # production server (serves built client)
pnpm test         # server integration tests (in-memory MongoDB, no setup needed)
pnpm lint         # ESLint on client
```

---

## API reference

### Auth — `/api/auth`

| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/register` | `{ name, email, password }` | Password: 8+ chars, uppercase, number, symbol |
| POST | `/login` | `{ email, password }` | Returns session cookie |
| POST | `/logout` | — | Destroys session |
| GET | `/me` | — | Returns current user (no sensitive fields) |
| POST | `/forgot-password` | `{ email }` | Dev: returns `resetUrl` in response |
| POST | `/reset-password` | `{ token, password }` | Token valid for 1 hour |

### Ideas — `/api/ideas` (all require auth)

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/` | — | All ideas for current user |
| GET | `/:id` | — | Single idea |
| POST | `/` | `{ title?, details, tags?, status? }` | `details` is HTML (Tiptap output) |
| PUT | `/:id` | `{ title?, details, tags?, status? }` | Full replace |
| PATCH | `/:id/status` | `{ status }` | `draft \| archived` |
| DELETE | `/:id` | — | Permanent delete |

### Health

`GET /api/health` → `{ ok: true }` — excluded from logs.

---

## Backend architecture

The server follows a strict layered pattern:

```
Route handler  →  Service  →  Repository  →  Mongoose model
```

- **Routes** — validate input (via `validate()` middleware), call one service method, send response. No Mongoose.
- **Services** — business logic (conflict checks, token generation, password hashing). No Express types.
- **Repositories** — all Mongoose queries. Nothing else.
- **Schemas** — Zod schemas live in `src/schemas/`, never inline in route files.

---

## Design system

The UI uses a single dark-first design system (`design-system.css`) with a CSS custom property token set. The only chromatic accent is amber (`--ds-color-glow: #f59e0b`), used for active states, focus rings, tag chips, and CTAs. Light theme is supported via `[data-theme="light"]`.

---

## Troubleshooting

**MongoDB connection error** — confirm MongoDB is running; check `MONGO_URI` in `.env`.

**EADDRINUSE on port 5001** — change `PORT` in `.env` and update the Vite proxy target in `client/vite.config.js`.

**503 from Vite proxy on first load** — the server takes ~1s to boot with tsx. Refresh once. This only happens on cold start.

**Tiptap editor blank in dev** — if `optimizeDeps` pre-bundling fails, try `rm -rf client/node_modules/.vite` and restart.
