# Constants Reference

**Rule**: Any value used in >1 file lives in a constants file. Never hardcode the same string/number twice.

## Server — `server/src/constants.ts`
| Constant | Value | Notes |
|---|---|---|
| `IDEA_STATUSES` | `['draft', 'archived']` | enum for Mongoose + Zod |
| `PASSWORD_POLICY` | min 8, uppercase, number, symbol | |
| `BCRYPT_ROUNDS` | 12 | |
| `RESET_TOKEN_TTL_MS` | 7 200 000 (2hr) | |
| `SESSION_MAX_AGE_MS` | 604 800 000 (7 days) | default cookie maxAge |
| `REMEMBER_ME_MAX_AGE_MS` | 2 592 000 000 (30 days) | |
| `PENDING_SESSION_TTL_MS` | 900 000 (15 min) | |
| `MAX_SESSIONS_PER_USER` | 5 | overridable via env |
| `TAG_MIN_LENGTH` | 2 | |
| `TAG_MAX_LENGTH` | 32 | |
| `TITLE_MAX_LENGTH` | 200 | |
| `DETAILS_MAX_LENGTH` | 50 000 | |
| `IDEA_MAX_TAGS` | 3 | per idea |
| `WORKSPACE_MAX_TAGS` | 10 | unique tags total per user |
| `IDEA_LIMIT` | 100 | per user |
| `RATE_LIMIT_LOGIN` | 20 / 15min | |
| `RATE_LIMIT_REGISTER` | 10 / hr | |
| `RATE_LIMIT_FORGOT_PASSWORD` | 5 / hr | |
| `RATE_LIMIT_RESET_PASSWORD` | 10 / 15min | |
| `RATE_LIMIT_CHANGE_PASSWORD` | 10 / 15min | |

## Client — `client/src/lib/constants.js`
| Constant | Value |
|---|---|
| `APP_NAME` | `'planMe'` |
| `IDEA_STATUSES` | `['draft', 'archived']` |
| `IDEA_STATUS_LABELS` | `{ draft: 'Draft', archived: 'Archived' }` |
| `SORT_OPTIONS` | `[newest, updated, a-z, manual]` |
| `TAG_MIN_LENGTH` | 2 |
| `TAG_MAX_LENGTH` | 32 |
| `TITLE_MAX_LENGTH` | 200 |
| `DETAILS_MAX_LENGTH` | 50 000 |
| `IDEA_MAX_TAGS` | 3 |
| `WORKSPACE_MAX_TAGS` | 10 |
| `IDEA_LIMIT` | 100 |
| `SEARCH_MIN_LENGTH` | 2 |
| `PROMPT_TEMPLATES` | 3 templates: problem, procrastination, recurring |
