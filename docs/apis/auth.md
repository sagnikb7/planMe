# API — Auth (`/api/auth`)

All endpoints validated with Zod. Rate limits skip in `NODE_ENV=test`.

---

## POST /register
- **Rate**: 10/hr
- **Input**: `{ name: string≥2, email: valid, password: strong }`
- **Output**: 201 `{ message }`
- **Errors**: 409 email conflict, 500
- **Side effects**: creates User (bcrypt hash, email lowercase)

## POST /login
- **Rate**: 20/15min
- **Input**: `{ email, password, rememberMe?: boolean }`
- **Output (normal)**: 200 `{ user: SanitizedUser }`
- **Output (limit)**: 202 `{ sessionLimited: true, sessions: SessionInfo[] }`
- **Errors**: 401 bad credentials
- **Side effects**: session.regenerate(), creates UserSession, sets cookie maxAge if rememberMe

## POST /logout
- **Auth**: ensureAuthenticated
- **Output**: 200 `{ message }`
- **Side effects**: destroys session + MongoStore entry + UserSession record, clears cookie

## GET /me
- **Output**: 200 `{ user: SanitizedUser }` or 401

## POST /forgot-password
- **Rate**: 5/hr
- **Input**: `{ email }`
- **Output**: 200 `{ message, resetUrl? }` (resetUrl only in dev/non-prod)
- **Side effects**: sets resetPasswordTokenHash + resetPasswordExpiresAt; sends email in prod

## POST /reset-password
- **Rate**: 10/15min
- **Input**: `{ token: string≥32, password: strong }`
- **Output**: 200 `{ message }`
- **Errors**: 400 invalid/expired token
- **Side effects**: updates password hash, clears reset token fields

## PATCH /me
- **Auth**: ensureAuthenticated
- **Input**: `{ name: string≥2 }`
- **Output**: 200 `{ user: SanitizedUser }`
- **Side effects**: updates name in DB + live session (req.user.name)

## POST /change-password
- **Auth**: ensureAuthenticated · **Rate**: 10/15min
- **Input**: `{ currentPassword, newPassword: strong }`
- **Output**: 200 `{ message }`
- **Errors**: 400 wrong current password
- **Side effects**: updates password hash; sessions remain active

## DELETE /me
- **Auth**: ensureAuthenticated
- **Output**: 200 `{ message }`
- **Side effects**: cascade deletes all ideas + all UserSession records → deletes user → logout

---

## GET /google
- Redirects to Google OAuth consent screen
- Requires `AUTH_GOOGLE_ENABLED=true` (default); returns 503 if disabled

## GET /google/callback
- OAuth redirect target; handled by Passport
- On success: redirects to `/ideas`
- On failure: redirects to `/login?error=google`
- Applies session-limit flow same as local login

---

## SanitizedUser shape
```ts
{
  _id, name, email, authProvider: 'local' | 'google',
  hasPassword: boolean,   // false for Google-only accounts
  createdAt, updatedAt
}
// stripped: password, googleId, resetPasswordTokenHash, resetPasswordExpiresAt
```
