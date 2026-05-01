# Architecture Overview

## Type
Full-stack monorepo — single Render web service in prod (server serves compiled React client as static).

## Stack
| Layer | Tech |
|---|---|
| Runtime | Node 22 |
| Server | Express + TypeScript (strict) |
| Client | React + Vite + Tailwind (JSX) |
| DB | MongoDB via Mongoose |
| Auth | Passport.js (local strategy) + express-session |
| Session store | connect-mongo (MongoDB) |
| Offline | Dexie (IndexedDB) + custom sync engine |
| Logging | Pino + pino-http |
| Validation | Zod (server schemas only) |
| Package manager | pnpm workspaces |

## Monorepo Layout
```
planMe/
├── client/          React app (port 5173 dev)
├── server/          Express API (port 5001 dev)
│   └── src/
│       ├── app.ts           createApp() factory
│       ├── index.ts         entrypoint
│       ├── constants.ts     single source of truth
│       ├── config/          env, database, passport
│       ├── models/          Mongoose schemas
│       ├── repositories/    all DB queries
│       ├── schemas/         Zod validation
│       ├── services/        business logic
│       ├── routes/          thin handlers
│       ├── middleware/      auth, validate
│       └── utils/           logger, email, geo, password-policy, user-agent
├── .env             (gitignored)
└── pnpm-workspace.yaml
```

## Request Lifecycle (server)
```
Request
  → rate limiter (auth routes only)
  → session (express-session + MongoStore)
  → passport.session()
  → middleware: ensureAuthenticated | ensureAuthOrPending | ensurePending
  → validate(zodSchema)
  → route handler
  → service
  → repository
  → MongoDB
```

## Prod vs Dev
| | Dev | Prod |
|---|---|---|
| Client serving | Vite dev server (5173) | Express static (`client/dist/`) |
| CORS | Enabled (CLIENT_ORIGIN) | Disabled (same origin) |
| Cookies | secure: false | secure: true, trust proxy: 1 |
| SMTP | Returns resetUrl in response | Sends email via Brevo |
| Server boot | `tsx watch` | `node -r tsx/cjs` |

→ See [stack.md](stack.md) · [data-models.md](data-models.md)
