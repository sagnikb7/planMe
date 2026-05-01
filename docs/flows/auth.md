# Auth Flows

## Register
1. POST `/api/auth/register` (rate: 10/hr)
2. Zod validates: `name≥2`, `email`, strong `password`
3. Normalize email → lowercase
4. Check duplicate → 409 if exists
5. `bcrypt.hash(password, 12)` → store
6. Return 201 `{ message }`

---

## Login
1. POST `/api/auth/login` (rate: 20/15min)
2. Passport local strategy → verify email+password
3. **Session limit check**: count active (non-pending) sessions for user
   - `≥ MAX_SESSIONS_PER_USER (3)` → **[Session Limit Flow](session-limit.md)**
4. `session.regenerate()` (fixation prevention)
5. `req.logIn(user)` → Passport serializes user to session
6. If `rememberMe=true` → cookie.maxAge = 30 days (else 7 days)
7. Create `UserSession` record (ip, device, sessionId)
8. Return `{ user }` (sanitized)

---

## Logout
1. POST `/api/auth/logout` (requires auth)
2. `req.logout()` → Passport clears user from session
3. `req.session.destroy()` → removes session from MongoStore
4. `sessionService.deleteBySessionId()` → removes UserSession record
5. Clear cookie `connect.sid`

---

## Forgot Password
1. POST `/api/auth/forgot-password` (rate: 5/hr)
2. Lookup user by email (silent no-op if not found — always return generic message)
3. Generate 32-byte random token; SHA-256 hash stored in DB
4. Set `resetPasswordExpiresAt = now + 2hr`
5. **Dev**: return `resetUrl` in response; **Prod**: send email via SMTP

---

## Reset Password
1. POST `/api/auth/reset-password` (rate: 10/15min)
2. SHA-256 hash incoming token → lookup by hash + check expiry
3. `bcrypt.hash(newPassword)` → update; clear token fields

---

## Change Password
1. POST `/api/auth/change-password` (auth + rate: 10/15min)
2. Load user → `bcrypt.compare(currentPassword)` → 400 if wrong
3. Hash new password → update (sessions stay active)

---

## Delete Account
1. DELETE `/api/auth/me` (requires auth)
2. Parallel: delete all ideas + all UserSession records for user
3. Delete user document
4. Logout + destroy session + clear cookie

---

## GET /me
- Returns sanitized user from `req.user` (Passport session)
- 401 if not authenticated (no redirect)
