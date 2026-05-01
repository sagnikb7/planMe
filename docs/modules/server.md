# Server Modules

## Entry / Boot
| File | Role |
|---|---|
| `index.ts` | Connects DB, starts HTTP server; handles SIGTERM/SIGINT graceful shutdown (10 s drain timeout) |
| `app.ts` | `createApp(opts)` factory — testable, no side effects |
| `config/env.ts` | Typed env with defaults; loaded once at startup |
| `config/database.ts` | `connectDatabase(mongoUri)`, `disconnectFromDatabase()` via Mongoose |
| `config/passport.ts` | Local strategy: find by email → `bcrypt.compare` |
| `config/logger-http.ts` | `pinoHttpConfig` — shared pino-http options (auto-ignore `/api/health`, structured log fields) |

## Middleware
| File | Exports |
|---|---|
| `middleware/auth.ts` | `ensureAuthenticated`, `ensurePending`, `ensureAuthOrPending`, `getRequestUserId` |
| `middleware/validate.ts` | `validate(schema)` — parses `req.body` with Zod, returns 400 on failure |
| `middleware/rate-limit.ts` | `loginLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `resetPasswordLimiter`, `changePasswordLimiter` |

## Models (Mongoose)
| File | Model | Key notes |
|---|---|---|
| `models/user.model.ts` | `UserModel` | email unique+lowercase |
| `models/idea.model.ts` | `IdeaModel` | status enum from constants |
| `models/user-session.model.ts` | `UserSessionModel` | TTL index on expiresAt, isPending index |

## Repositories (all DB access)
| File | Key operations |
|---|---|
| `repositories/user.repository.ts` | findByEmail, findById, findByResetToken, create, updatePassword, updateName, setResetToken, deleteById |
| `repositories/idea.repository.ts` | findAllByUser, findByIdAndUser, create, update, patchStatus, delete, deleteAllByUser, reorder, countByUser, getMaxSortOrder, getDistinctTagsByUser, getTagUsageCounts, renameTag |
| `repositories/user-session.repository.ts` | create, findAllByUser, findByIdAndUser, countActive, deleteById, deleteBySessionId, deleteAllByUser, promoteToActive |

## Services (business logic)
| File | Class | Key methods |
|---|---|---|
| `services/auth.service.ts` | `AuthService` | register, forgotPassword, resetPassword, updateName, changePassword, deleteAccount, sanitize |
| `services/idea.service.ts` | `IdeaService` | getAll, getById, create, update, patchStatus, delete, reorder, getWorkspaceTags, renameTag, enforceWorkspaceTagLimit (private) |
| `services/session.service.ts` | `SessionService` | createSession, countActiveSessions, listSessions, terminateSession, deleteBySessionId, promoteToActive |

## Utils
| File | Purpose |
|---|---|
| `utils/logger.ts` | Pino logger instance |
| `utils/email.ts` | `sendPasswordResetEmail(email, resetUrl, expiryHours)` via nodemailer/SMTP |
| `utils/geo.ts` | `lookupLocation(ip)` via geoip-lite; private IPs → `"Local"` |
| `utils/password-policy.ts` | `isStrongPassword(pwd)` — min 8, uppercase, number, symbol |
| `utils/user-agent.ts` | `parseUserAgent(uaString)` → human-readable device string |
| `utils/errors.ts` | `AppError(statusCode, message)` — thrown by services for controlled HTTP errors |
| `utils/ip.ts` | `getClientIp(req)` — extracts real client IP from `x-forwarded-for` or socket |

## Error Classes
| Class | Used for |
|---|---|
| `ConflictError` | Email already registered (409) |
| `ValidationError` | Invalid token, wrong password (400) |
| `AppError` | Tag limits, idea limits (400/404) |
