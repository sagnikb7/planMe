# Data Models

## User
```
Collection: users
```
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | required |
| `email` | String | required, unique, lowercase |
| `password` | String | bcrypt hash, BCRYPT_ROUNDS=12 |
| `resetPasswordTokenHash` | String\|null | SHA-256 of raw token |
| `resetPasswordExpiresAt` | Date\|null | 2hr TTL |
| `createdAt` / `updatedAt` | Date | auto (timestamps) |

Sanitized response strips: `password`, `resetPasswordTokenHash`, `resetPasswordExpiresAt`.

---

## Idea
```
Collection: ideas
```
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `title` | String | default `''`, max 200 |
| `details` | String | required, HTML (rich editor), max 50 000 |
| `tags` | String[] | default `[]`, max 3 per idea, max 10 unique workspace-wide |
| `status` | `'draft'`\|`'archived'` | default `'draft'` |
| `sortOrder` | Number | default 0, used for manual sort |
| `user` | ObjectId → User | required |
| `createdAt` / `updatedAt` | Date | auto |

Tag format: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/` (lowercase, no leading/trailing hyphen, 2–32 chars).

---

## UserSession
```
Collection: usersessions
TTL index: expiresAt (MongoDB auto-delete)
```
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | opaque ID returned to clients |
| `userId` | ObjectId → User | index |
| `sessionId` | String | express-session ID, unique |
| `ip` | String | raw IP at login time |
| `userAgent` | String | raw UA string |
| `device` | String | parsed UA (e.g. "Chrome on macOS") |
| `isPending` | Boolean | index; true = session limit hit, not yet resolved |
| `expiresAt` | Date | SESSION_MAX_AGE_MS = 7 days |
| `createdAt` / `updatedAt` | Date | auto |

---

## Offline (IndexedDB — Dexie)
Database: `planme-offline` (client only)

| Store | Indexes | Notes |
|---|---|---|
| `ideas` | `_id, syncStatus, status, updatedAt` | Mirror of server ideas; `syncStatus: 'synced'|'pending-*'` |
| `pendingQueue` | `++id, type, ideaId, createdAt` | Op types: `pending-create`, `pending-update`, `pending-archive`, `pending-delete` |
