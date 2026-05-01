# API — Sessions (`/api/sessions`)

Session routes are accessible to both fully-authenticated and pending users (session limit flow).

---

## GET /
- **Auth**: `ensureAuthOrPending`
- **Output**: `{ sessions: SessionInfo[] }` — all sessions for user
- `isCurrent` is false for pending sessions (no express session.id match)

## GET /me
- **Auth**: `ensureAuthenticated` (alias, profile page use)
- **Output**: `{ sessions: SessionInfo[] }` — marks current session

## DELETE /:id
- **Auth**: `ensureAuthOrPending`
- **`:id`**: opaque `UserSession._id` (not the express sessionId)
- **Output**: `{ ok: true }` or 404
- **Errors**: 400 if trying to terminate own current session (use logout)
- **Side effects**: deletes UserSession record + destroys express session from store (immediate sign-out)

## POST /resolve
- **Auth**: `ensurePending` only (has `pendingUserId`, no Passport user)
- **Output**: 200 `{ user: SanitizedUser }`
- **Errors**: 409 if still at session limit (with current sessions)
- **Side effects**: `promoteToActive` (isPending→false), removes `pendingUserId` from session, `req.logIn(user)`

---

## SessionInfo shape
```ts
{
  id: string,          // UserSession._id
  ip: string,
  device: string,      // parsed UA e.g. "Chrome on macOS"
  location: string,    // geoip-lite lookup; "Local" for private IPs
  createdAt: string,   // ISO
  isCurrent: boolean,
}
```

## Health
`GET /api/health` → `{ ok: true }` — excluded from HTTP logs.
