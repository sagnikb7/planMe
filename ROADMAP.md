# planMe — Product & Technical Roadmap
_Audited: 2026-04-25 · Updated: 2026-04-26_

---

## 1. Current State Summary

planMe is a personal idea-management app in a pnpm monorepo. The core loop is functional: authenticated users can create, edit, view, tag, sort, search, archive, restore, and delete ideas. The backend is well-structured (middleware → route → service → repository), fully typed in strict TypeScript, and covered by integration tests using mongodb-memory-server. The design system is coherent and consistently applied.

### Confirmed features (code evidence)
- Session auth: register, login, logout, `/me`, forgot-password (dev returns reset URL), reset-password
- Session management: per-user session limit (MAX=2), pending session flow, terminate-to-unblock, session list on Profile
- Idea CRUD: create, view (`/ideas/:id`), edit, full-text local search, tag filter, sort (newest/oldest/A–Z/manual), archive/restore/delete
- Drag-and-drop manual reorder (`@dnd-kit`), persisted via `PATCH /api/ideas/reorder`
- List view + grid view toggle, persisted to localStorage
- Tag management: workspace tag rename in Settings, tag usage counts, 10-tag workspace limit
- Rich text editor: Tiptap with task lists, headings, bullet/ordered lists, blockquote, inline code
- Toast notifications for all idea mutations, with error feedback on failure
- Skip-link for keyboard accessibility
- Mobile bottom nav
- Theme toggle (dark/light) in Settings

### Fixed (2026-04-26)
- **XSS:** DOMPurify installed and applied to both `dangerouslySetInnerHTML` call sites (`MyIdeas.jsx` preview, `ViewIdea.jsx` full content)
- **Status desync:** `active` status removed from server `IDEA_STATUSES`; server and client now both use `draft | archived`
- **Pending session TTL:** `user-session.repository.ts` now uses `PENDING_SESSION_TTL_MS` (15 min) for pending sessions instead of the 7-day `SESSION_MAX_AGE_MS`
- **Layering violation:** `sessions.routes.ts` now calls `userRepository.findById` instead of `UserModel.findById` directly
- **Error propagation:** `passport.authenticate` callback is fully wrapped in try/catch; async errors now reach `next()`
- **bcrypt rounds:** extracted to `BCRYPT_ROUNDS = 12` in `constants.ts`; bumped from 10 at both call sites in `auth.service.ts`
- **Input validation:** `reorderIdeasSchema.ids` now validates ObjectId format and caps at 500 entries
- **Mutation error handling:** `handleArchive`, `handleRestore`, `handleDelete` in `MyIdeas.jsx` and `handleTerminate` in `SessionLimit.jsx` / `Profile.jsx` now have try/catch with user-visible error feedback
- **CSS bug:** `story-chip` (nonexistent class) replaced with `surface-card` in `ResetPassword.jsx`

### Features the old ROADMAP listed as "near-term" that are already done
| Old ROADMAP item | Reality |
|---|---|
| Idea detail view | Done — `ViewIdea.jsx` at `/ideas/:id` |
| Inline status change from list | Archive/restore via dialog. `active` status was removed — only draft/archived remain. |
| Keyboard shortcuts | Not done |
| Pinned ideas | Not done |

---

## 2. Key Problems

### UX gaps
- **`active` status is unreachable from the list.** The server model and constants have `draft | active | archived` but `client/src/lib/constants.js` only defines `['draft', 'archived']` for `IDEA_STATUSES`, and `IDEA_STATUS_LABELS` has no `active` entry. The status select in EditIdea does include active but there is no quick-toggle from the list. Idea rows show no badge for `active` — only `archived` gets a badge.
- **No logout in the sidebar.** `AppShell.jsx` sidebar footer only shows the version number. CLAUDE.md mandates "sidebar footer = single Log out action." The only logout is buried inside the Profile page. Navigating to Profile to log out is friction.
- **Inline checkbox persistence is fragile.** `ViewIdea.jsx` parses Tiptap HTML with DOMParser and hand-edits the DOM to update task checkboxes. This will break if Tiptap changes its HTML output format. The correct fix is to store structured content (Tiptap JSON) rather than HTML, or route the save through the editor instance.

### Security gaps
- ~~**XSS: no HTML sanitization.**~~ Fixed 2026-04-26 — DOMPurify applied to both render sites.
- **No rate limiting.** Auth endpoints (`/register`, `/login`, `/forgot-password`, `/reset-password`) have no `express-rate-limit`. Credential stuffing and token enumeration are unmitigated.
- **Password reset has no email delivery in production.** `forgotPassword()` only returns a `resetUrl` in non-prod. In prod it returns a generic message with no link sent. The feature is non-functional for real users.

### Technical gaps
- ~~**Client constants desync.**~~ Fixed 2026-04-26 — `active` removed from server; both sides now use `['draft', 'archived']`.
- **Search is client-side only.** All ideas are fetched then filtered in the browser. For any user with more than ~200 ideas this will degrade. No pagination either.
- **No client-side tests.** Zero Vitest or React Testing Library tests. The component tree has non-trivial logic (`TagPicker`, `RichEditor`, drag-and-drop reorder, `AuthContext`) with no coverage.
- **Zod version split.** Server uses Zod v3 (`^3.23.8`). Client uses Zod v4 (`^4.3.6`). Schemas cannot be shared between packages without a conversion layer.
- **`nodemon` in server `devDependencies` is unused** — the dev script uses `tsx watch`. Dead dependency.
- **`__APP_VERSION__` in AppShell** — this Vite define must be verified in `vite.config.js`; if missing it will throw a ReferenceError in production.
- **`location` hardcoded as `'Unknown location'`** in `session.service.ts` — the field exists on `SessionInfo` but is never populated. IP-to-location lookup is not implemented. The field creates a false expectation.

### Product direction
- The app currently has no differentiated value beyond any note-taking tool. The idea lifecycle (`draft → active → archived`) is the strongest product concept and it is underexploited — `active` is barely surfaced.
- The 10-tag workspace limit and 3-tags-per-idea limit are meaningful constraints but are invisible to users until they hit them. Proactive signposting would reduce confusion.

---

## 3. Feature Decisions

| Feature | Status | Decision | Priority |
|---|---|---|---|
| Idea detail view (`/ideas/:id`) | Confirmed | KEEP | — |
| Session management (limit, pending, terminate) | Confirmed | KEEP | — |
| Drag-and-drop reorder | Confirmed | KEEP | — |
| Tag rename in Settings | Confirmed | KEEP | — |
| Grid / list view toggle | Confirmed | KEEP | — |
| XSS sanitization (DOMPurify) | ~~Missing~~ Done | ✅ | — |
| Rate limiting on auth routes | Missing | ADD | P0 |
| Fix `active` status desync | ~~Bug~~ Done (removed from server) | ✅ | — |
| Logout button in sidebar | Missing (design violation) | ADD | P1 |
| `active` badge + status indicator in list | Missing | ADD | P1 |
| Email delivery for password reset | Missing | ADD | P1 |
| Keyboard shortcuts (`N`, `/`, `Esc`) | Not done | ADD | P2 |
| Inline status toggle from list row | Partial | IMPROVE | P2 |
| Client-side tests (Vitest + RTL) | Missing | ADD | P2 |
| Server-side search + pagination | Missing | ADD | P2 |
| Pinned ideas | Not done | DEFER | P3 |
| "Remember me" / extended session | Documented only | DEFER | P3 |
| Export (Markdown / JSON) | Documented only | ADD | P3 |
| OAuth Google login | Documented only | DEFER | P4 |
| Collections / notebooks | Documented only | DEFER | P4 |
| Revision history | Documented only | DEFER | P4 |
| AI tagging / summarization | Documented only | DEFER | P4 |
| Due dates / focus mode | Documented only | DEFER | P4 |
| Activity feed | Documented only | REMOVE | — |
| Docker compose | Documented only | ADD | P3 |
| PWA / offline support | Documented only | DEFER | P4 |

---

## 4. Roadmap

### Phase 1 — Fix Before Ship (1–2 weeks)

These are blockers for any real-user deployment. Do not ship to production until these are done.

**~~P0-1: XSS — add DOMPurify to all `dangerouslySetInnerHTML` call sites~~** ✅ Done 2026-04-26
- `dompurify` installed; both `MyIdeas.jsx` and `ViewIdea.jsx` now sanitize before rendering.

**P0-2: Rate limiting on auth endpoints** _(still open)_
- Install `express-rate-limit`.
- Apply to `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- Limits: 5 req/min on login, 3 req/15min on forgot-password/register.
- Define limits in `server/src/constants.ts`. Do not hardcode.
- Effort: S (2–3h).

**~~P0-3: Fix `active` status desync~~** ✅ Done 2026-04-26
- Resolved by removing `'active'` from `server/src/constants.ts`. The app lifecycle is now `draft → archived`. If `active` is wanted in future, add it to both sides simultaneously with a label and UI state.

**P0-4: Verify `__APP_VERSION__` Vite define**
- Confirm `vite.config.js` defines `__APP_VERSION__`. If missing, `AppShell.jsx` will throw a ReferenceError in production builds.
- Effort: XS (30min).

---

### Phase 2 — UX Polish (2–4 weeks)

**P1-1: Logout button in sidebar**
- Add a logout action to the sidebar footer in `AppShell.jsx` per CLAUDE.md surface responsibility rules.
- The Profile page logout can remain as a secondary path (it is within a dedicated "Sign out" section, not a footer).
- Effort: S (2h).

**P1-2: ~~`active` status visible and actionable in the list~~** — removed from scope
- `active` was removed from the data model. If a three-state lifecycle is validated by real use, re-introduce it with proper UI across both client and server simultaneously.

**P1-3: Email delivery for password reset (production)**
- Integrate Resend (or Postmark) transactional email.
- Add `EMAIL_API_KEY` and `FROM_EMAIL` to `env.ts` and `example.env`.
- Only call the email provider in `authService.forgotPassword()` when `env.isProd`. Dev path unchanged.
- Effort: M (1 day).

**P1-4: Keyboard shortcuts**
- Global: `N` → navigate to `/ideas/add`, `/` → focus search input, `Escape` → close open dialog.
- Implement via a single `useKeyboardShortcuts` hook mounted in `AppShell`.
- Do not activate shortcuts when focus is inside an input, textarea, or editor.
- Effort: M (1 day).

---

### Phase 3 — Scale & Quality (1–2 months)

**P2-1: Client-side tests**
- Vitest + React Testing Library.
- Priority targets: `AuthContext` (login/logout/pending state), `TagPicker` (add/remove/limit), `RichEditor` (basic render), `MyIdeas` filter/sort logic.
- Do not test implementation details; test user-observable behavior.
- Effort: L (1 week).

**P2-2: Server-side search + pagination**
- Add a `GET /api/ideas?q=&page=&limit=` endpoint that performs MongoDB `$text` index search server-side.
- Add a text index on `{ title: 'text', details: 'text', tags: 'text' }` in `idea.model.ts`.
- Return paginated results with a `total` count.
- Client switches from local filtering to debounced API calls when `query.length >= SEARCH_MIN_LENGTH`.
- Effort: L (3–5 days).

**P2-3: Fix checkbox persistence in ViewIdea**
- Replace DOM-parsing approach with storing Tiptap JSON alongside HTML, or re-mount the editor in read-only mode with `editable: false` and re-enable only for checkbox clicks.
- The safest path: store `{ html: string, json: object }` on the idea and use the JSON for checkbox updates through the Tiptap editor instance rather than DOMParser.
- Effort: M (1 day). This is a correctness issue, not just polish.

**P2-4: Export (Markdown + JSON)**
- Single-idea export button on the ViewIdea page.
- Markdown: strip Tiptap HTML to GFM using `turndown`.
- JSON: raw idea object from the API.
- Bulk export (all ideas as ZIP) is a stretch goal — defer until single-idea export is validated.
- Effort: M (1–2 days).

**P2-5: Remove `location: 'Unknown location'` from SessionInfo**
- Either remove the field from the API response and `SessionList` UI, or implement real GeoIP lookup (e.g., `geoip-lite`).
- Showing a field that always says "Unknown location" is worse than not showing it.
- Effort: XS (1h to remove) or M (1 day to implement).

---

### Phase 4 — Long Term (3+ months)

These require validation that users actually want them before spending the effort.

**Docker compose**
- A `docker-compose.yml` spinning up MongoDB + Express server.
- Unblocks CI and simplifies contributor onboarding.
- Effort: S (half a day).

**"Remember me" checkbox**
- Extends `cookie.maxAge` to 30 days on login when checked.
- Separate from session store TTL.
- Effort: S (half a day).

**Pinned ideas**
- Add `pinned: boolean` to the idea model.
- Pin up to 3; show at the top of the list regardless of sort.
- Effort: M (1–2 days).

**PWA / offline support**
- Service worker with cache-first for static assets, stale-while-revalidate for `/api/ideas`.
- Requires a new manifest. The old one was deleted with the legacy stack.
- Effort: L (1 week).

**OAuth — Google login**
- Only after email delivery is working (Phase 2). Adds `googleId` to `UserModel`, new route pair.
- Effort: L (3–5 days).

**Collections / notebooks**
- New `Collection` model, many-to-many with ideas.
- New `/api/collections` resource, sidebar nav entry.
- Do not build until the core idea loop has been used by real users long enough to validate the need.
- Effort: XL (2+ weeks).

**Revision history**
- `history` array on each idea — snapshot on save.
- High storage cost for personal use; validate need before building.
- Effort: XL (1–2 weeks).

**AI tagging / summarization**
- Server-side, async post-save call to Anthropic/OpenAI.
- Suggested tags surfaced as accept/reject chips. Never auto-applied.
- Effort: L (3–5 days for integration, M for good UX).

---

## 5. Technical Improvements

### Type safety
- The `lean()` casts in the repository (`as Promise<IIdea[]>`) silence TypeScript but skip Mongoose's hydration. This is intentional for performance but the cast at `IdeaModel.aggregate(...)` in `getTagUsageCounts` is less safe. Add an explicit return type assertion with a typed interface rather than relying on inference.
- Eliminate the `as unknown as { sortOrder: number }` cast in `getMaxSortOrder` — query the field directly with a typed projection.

### Dead code / deps
- Remove `nodemon` from `server/package.json` devDependencies — unused (`tsx watch` is the dev runner).
- `server/src/utils/user-agent.ts` should be audited to confirm it handles all major UA strings. The `device` field in sessions currently shows raw strings that may not be user-friendly.

### Constants
- `VIEW_KEY = 'planme-view'` and `SORT_KEY = 'planme-sort'` are hardcoded string literals in `MyIdeas.jsx`. Move to `client/src/lib/constants.js`.
- `TAG_PATTERN` is defined separately in both `server/src/schemas/idea.schema.ts` and `client/src/pages/Settings.jsx`. They are identical. A shared constants package or at least a comment linking them would prevent drift.

### Error handling
- ~~Idea mutation failures in `MyIdeas.jsx` (`handleArchive`, `handleRestore`, `handleDelete`) are silent.~~ Fixed 2026-04-26 — all three wrapped in try/catch with error toasts. Same fix applied to `handleTerminate` in `SessionLimit.jsx` and `Profile.jsx`.
- `ViewIdea.jsx` checkbox persistence fires a silent `.catch(() => {})`. At minimum log to the console; ideally show an error toast.

### Session model
- `UserSessionModel` has a `location` field in the service interface but not in the Mongoose schema. The `SessionInfo.location` is always `'Unknown location'`. Either add the field to the schema or remove it from the interface and UI.

---

## 6. UX Improvements

### Surface responsibility violations (from CLAUDE.md)
- **Sidebar footer** should have a single Log out action. Currently it shows only the version string. The logout is on the Profile page inside a "Sign out" section. Add a logout action to the sidebar footer. The Profile page "Sign out" section can remain — it is within a dedicated account context.

### Empty and loading states
- The Settings tags section has good loading/empty states.
- `MyIdeas` has loading, error, and empty states — all correct.
- `EditIdea` load failure only calls `setError('root', ...)` but the form card still renders. A full-page error state (like `ViewIdea` has) would be clearer.

### Mobile
- The mobile bottom nav has 4 items (Ideas, New idea, Profile, Settings). "New idea" is a direct link, not a section — it jumps straight to `/ideas/add`. This is fine but the active state logic (`end={to === '/ideas'}`) may mark "Ideas" as active when on `/ideas/add`. Verify in practice.
- Touch targets in idea rows: the Restore/Delete buttons in `IdeaBody` are `ghost` / `ghost-danger` at `sm` size (2rem = 32px height). This is below the 44px iOS guideline. Either increase touch area with padding or use `default` size.

### Stagger animation cap
- `design.md` says cap stagger at ~10 rows before delay becomes noticeable. `MyIdeas.jsx` applies `animationDelay: ${index * 40}ms` without a cap. At 30 ideas the last row has a 1.16s delay. Cap at index 10: `Math.min(index, 10) * 40`.

---

## 7. What NOT to Build

- **Activity feed** — an `events` collection tracking every edit is disproportionate infrastructure for a personal single-user app. The value is low, the write amplification is real. Remove from consideration.
- **Full-text search with Atlas Search** — Atlas Search requires MongoDB Atlas. The app uses a self-hosted URI by default. A `$text` index (Phase 3 item) covers 95% of the need without locking into Atlas.
- **Templates as a feature** — pre-built scaffolds stored as static JSON on the client are fine, but this is a distraction until the core editing experience is solid. The rich editor already covers everything templates would offer.
- **Split-panel auth layouts** — design.md explicitly bans this. Do not introduce it.
- **Second chromatic accent** — the amber glow is the only hue budget. No feature justifies adding a second accent color.
- **Inline style overrides for theme values** — design.md rule: new utility classes go in `design-system.css`, never `style={}` for theme values. Several places in `MyIdeas.jsx` use `style={{ outline: ... }}` instead of a CSS class. Clean up; don't add more.

---

## 8. Quick Wins

Items that deliver real value with under a day of effort each.

| Item | Effort | Impact |
|---|---|---|
| ~~Fix `IDEA_STATUSES` desync~~ | ✅ Done | Removed `active` from server |
| ~~Add DOMPurify to both `dangerouslySetInnerHTML` sites~~ | ✅ Done | P0 security |
| Add `express-rate-limit` to auth routes | 2–3h | P0 security |
| Add logout to sidebar footer | 2h | Design system compliance |
| Cap stagger animation at index 10 | 15 min | Polish |
| Move `VIEW_KEY`/`SORT_KEY` to constants file | 30 min | Constants rule compliance |
| Remove `nodemon` from server devDependencies | 5 min | Hygiene |
| ~~Wrap archive/restore/delete in try/catch with error toast~~ | ✅ Done | UX reliability |
| Remove or implement `location` field in SessionInfo | 1h | Honesty in the UI |
| ~~Add `active` badge to `StatusBadge`~~ | Removed from scope | `active` status removed |

---

## 9. Assumptions

- No real users in production yet — the missing email delivery for password reset confirms this. Phase 1 + Phase 2 should be completed before onboarding any real users.
- MongoDB is self-hosted (not Atlas). Server-side search recommendation uses `$text` index, not Atlas Search.
- The 2-session limit (`MAX_SESSIONS_PER_USER = 2`) is intentional and appropriate for a personal tool. It is configurable via `MAX_SESSIONS_PER_USER` env var.
- The client will remain plain JSX (no TS migration) unless explicitly requested. All new client code should follow existing patterns.
- Light theme support (`[data-theme="light"]`) exists in the design system CSS but is not audited here — it is togglable in Settings but not a delivery requirement.
- There is no CI pipeline. Adding one (GitHub Actions running `pnpm test`) is a worthwhile but low-priority addition not included in the roadmap phases above.
