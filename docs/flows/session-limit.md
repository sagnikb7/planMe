# Session Limit Flow

Triggered when a login attempt would exceed `MAX_SESSIONS_PER_USER` (5).

## Server-side
1. `session.regenerate()` — creates fresh session
2. Store `req.session.pendingUserId = userId` (marks as pending, not authenticated)
3. Create `UserSession` record with `isPending: true`
4. Return **202** `{ sessionLimited: true, sessions: SessionInfo[] }`

## Client-side (AuthContext)
1. Login returns `{ sessionLimited: true }` → `Login.jsx` redirects to `/session-limit`
2. `SessionLimit` page shows active sessions via `GET /api/sessions`
3. User terminates one → `DELETE /api/sessions/:id`
4. User clicks "Continue" → `POST /api/sessions/resolve`

## Resolve (POST /api/sessions/resolve)
- Requires `ensurePending` (session has `pendingUserId`, no Passport user)
- Re-counts active sessions; 409 if still at limit
- `sessionService.promoteToActive()` → sets `isPending: false` on UserSession
- Removes `pendingUserId` from session
- `req.logIn(user)` → full authentication

## Middleware Guards
| Guard | Allows |
|---|---|
| `ensureAuthenticated` | Passport-authenticated only |
| `ensurePending` | `pendingUserId` only |
| `ensureAuthOrPending` | Either (used by sessions routes) |

## Session Info Shape (returned to client)
```ts
{ id, ip, device, location, createdAt, isCurrent }
```
`location` resolved at list time via `geoip-lite`; private IPs → `"Local"`.
