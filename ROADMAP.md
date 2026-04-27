# planMe — Product & Technical Roadmap
_Audited: 2026-04-25 · Updated: 2026-04-27_

---

## 1. Current State Summary

planMe is a personal idea-management app in a pnpm monorepo. The core loop is functional: authenticated users can create, edit, view, tag, sort, search, archive, restore, and delete ideas. The backend is well-structured (middleware → route → service → repository), fully typed in strict TypeScript, and covered by integration tests using a real `planme_test` database.

### Confirmed features (code evidence)

**Auth & accounts**
- Session auth: register, login, logout, `/me`, forgot-password, reset-password
- Edit display name (`PATCH /api/auth/me`) — inline edit on Profile
- Change password (`POST /api/auth/change-password`) — current password verified, sessions stay active
- Delete account (`DELETE /api/auth/me`) — cascade-deletes all ideas + sessions
- Session management: per-user session limit (MAX=3), pending session flow, terminate-to-unblock, session list on Profile

**Ideas**
- Full CRUD: create, view (`/ideas/:id`), edit, delete
- Archive / restore with contextual banner + restore button on ViewIdea
- Contextual archived notice on EditIdea
- Full-text local search, tag filter, sort (newest/oldest/A–Z/manual)
- Drag-and-drop manual reorder (`@dnd-kit`), persisted via `PATCH /api/ideas/reorder`
- List view + grid view toggle, persisted to localStorage
- Rich text editor: Tiptap with task lists, headings, bullet/ordered lists, blockquote, inline code

**Profile & settings**
- Profile: identity card (avatar initials, name, email, joined date), idea stats (active/archived count), inline name edit, active sessions list, sign out
- Settings — PREFERENCES: theme toggle (dark/light)
- Settings — WORKSPACE: tag rename, export ideas as JSON
- Settings — ACCOUNT: change password, delete account (with type-to-confirm dialog)
- Settings section labels and grouped cards (not floating individual cards)

**UI & infra**
- Tag management: workspace tag rename, tag usage counts, 10-tag workspace limit
- Toast notifications for all mutations with error feedback
- Nav order: Ideas → New idea → Settings → Profile (Profile rightmost on mobile)
- Skip-link for keyboard accessibility, mobile bottom nav
- DOMPurify on all `dangerouslySetInnerHTML` call sites
- Render deployment: `pnpm build` compiles client + server; `pnpm start` runs `node server/dist/index.js`

---

### Changelog

**2026-04-27**
- ✅ Archived idea restore: button in ViewIdea top bar, contextual banner inside card
- ✅ EditIdea: contextual notice when editing an archived idea
- ✅ Profile: idea stats (active/archived count fetched from `/ideas`)
- ✅ Profile: inline name edit (pencil → input → check/X)
- ✅ Settings: export ideas as JSON (`planme-ideas-YYYY-MM-DD.json`)
- ✅ Settings: change password (current + new password, server-side bcrypt verify)
- ✅ Settings: delete account with cascade (ideas → sessions → user), type-to-confirm dialog
- ✅ Settings: restructured into labeled sections (PREFERENCES / WORKSPACE / ACCOUNT)
- ✅ AppShell: nav order fixed — Profile last (rightmost on mobile bottom nav)
- ✅ AuthContext: `updateUser()` and `deleteAccount()` added
- ✅ Server: `PATCH /api/auth/me`, `POST /api/auth/change-password`, `DELETE /api/auth/me`
- ✅ Server: `userRepository.updateName`, `userRepository.deleteById`
- ✅ Server: `ideaRepository.deleteAllByUser`, `userSessionRepository.deleteAllByUser`
- ✅ CLAUDE.md: Render deployment guide, new auth routes, sidebar footer rule updated
- ✅ Design decision: Profile is the canonical logout location (sidebar footer stays version-only)

**2026-04-26**
- ✅ XSS: DOMPurify applied to both `dangerouslySetInnerHTML` call sites
- ✅ `active` status removed from server — lifecycle is now `draft | archived`
- ✅ Pending session TTL uses `PENDING_SESSION_TTL_MS` (15 min)
- ✅ Sessions route calls `userRepository.findById` not `UserModel` directly
- ✅ Passport `authenticate` callback wrapped in try/catch
- ✅ `BCRYPT_ROUNDS = 12` extracted to constants
- ✅ `reorderIdeasSchema.ids` validates ObjectId format, capped at 500
- ✅ Archive/restore/delete in MyIdeas.jsx all have try/catch + error toasts
- ✅ Tests: replaced `mongodb-memory-server` with real `planme_test` database

---

## 2. Open Problems

### Security
- **Rate limiting missing.** Auth endpoints (`/register`, `/login`, `/forgot-password`, `/change-password`, `/reset-password`) have no `express-rate-limit`. Credential stuffing is unmitigated. **Blocker for production.**
- **Password reset non-functional in production.** `forgotPassword()` only returns `resetUrl` in non-prod environments. Real users cannot receive reset emails. **Blocker for production.**

### UX gaps
- **Inline checkbox persistence is fragile.** `ViewIdea.jsx` parses Tiptap HTML with DOMParser to update task checkboxes. This breaks if Tiptap changes its HTML format. Correct fix: store Tiptap JSON alongside HTML and update through the editor instance.
- **Stagger animation has no cap.** `MyIdeas.jsx` applies `animationDelay: ${index * 40}ms` without a ceiling. At 30 ideas, the last row has a 1.16s delay. Cap at `Math.min(index, 10)`.
- **`location` field in SessionInfo always shows 'Unknown location'.** The field exists in the service interface and UI but is never populated. Misleading — either implement GeoIP lookup or remove the field.
- **`EditIdea` load failure is partial.** `setError('root', ...)` fires but the form card still renders. Should show a full-page error like ViewIdea does.
- **Touch targets in idea rows are below iOS 44px guideline.** Restore/Delete buttons at `sm` size are 32px. Increase touch area with padding or use `default` size.

### Technical debt
- **Search is client-side only.** All ideas fetched then filtered in the browser. Degrades past ~200 ideas.
- **No client-side tests.** Zero Vitest/RTL tests. `AuthContext`, `TagPicker`, `RichEditor`, drag-and-drop, filter/sort logic all uncovered.
- **Zod version split.** Server: Zod v3. Client: Zod v4. Schemas cannot be shared without a conversion layer.
- **`VIEW_KEY` / `SORT_KEY` hardcoded in `MyIdeas.jsx`.** Should live in `client/src/lib/constants.js`.
- **`TAG_PATTERN` duplicated** in `server/src/schemas/idea.schema.ts` and `client/src/pages/Settings.jsx`. Identical regexes — link them with a comment at minimum.
- **`lean()` casts in repositories** silence TypeScript. The `as unknown as { sortOrder: number }` cast in `getMaxSortOrder` should use a typed projection instead.
- **`ViewIdea.jsx` checkbox save has silent `.catch(() => {})`** — at minimum log to console, ideally show an error toast.

---

## 3. Feature Decisions

| Feature | Status | Decision | Priority |
|---|---|---|---|
| Idea detail view (`/ideas/:id`) | ✅ Done | KEEP | — |
| Session management (limit, pending, terminate) | ✅ Done | KEEP | — |
| Drag-and-drop reorder | ✅ Done | KEEP | — |
| Tag rename in Settings | ✅ Done | KEEP | — |
| Grid / list view toggle | ✅ Done | KEEP | — |
| XSS sanitization (DOMPurify) | ✅ Done 2026-04-26 | KEEP | — |
| Archive / restore with contextual UI | ✅ Done 2026-04-27 | KEEP | — |
| Export ideas as JSON | ✅ Done 2026-04-27 | KEEP | — |
| Edit display name | ✅ Done 2026-04-27 | KEEP | — |
| Change password | ✅ Done 2026-04-27 | KEEP | — |
| Delete account (cascade) | ✅ Done 2026-04-27 | KEEP | — |
| Profile idea stats | ✅ Done 2026-04-27 | KEEP | — |
| Rate limiting on auth routes | ❌ Missing | ADD | **P0** |
| Email delivery for password reset | ❌ Missing | ADD | **P0** |
| Keyboard shortcuts (`N`, `/`, `Esc`) | ❌ Not done | ADD | P1 |
| Word count / reading time on ViewIdea | ❌ Not done | ADD | P1 |
| Last edited timestamp on ViewIdea | ❌ Not done | ADD | P1 |
| Related ideas by tag on ViewIdea | ❌ Not done | ADD | P1 |
| Fix checkbox persistence (Tiptap JSON) | ❌ Not done | ADD | P1 |
| Cap stagger animation at index 10 | ❌ Not done | ADD | P1 |
| Remove or implement `location` in SessionInfo | ❌ Not done | ADD | P1 |
| First-run empty state for new users | ❌ Not done | ADD | P2 |
| Server-side search + pagination | ❌ Not done | ADD | P2 |
| Export per-idea as Markdown | ❌ Not done | ADD | P2 |
| Client-side tests (Vitest + RTL) | ❌ Missing | ADD | P2 |
| Move `VIEW_KEY`/`SORT_KEY` to constants | ❌ Not done | ADD | P2 |
| Pinned ideas | ❌ Not done | DEFER | P3 |
| "Remember me" / extended session | ❌ Not done | DEFER | P3 |
| Docker compose | ❌ Not done | DEFER | P3 |
| PWA / offline support | ❌ Not done | DEFER | P4 |
| OAuth — Google login | ❌ Not done | DEFER | P4 |
| Collections / notebooks | ❌ Not done | DEFER | P4 |
| Revision history | ❌ Not done | DEFER | P4 |
| AI tagging / summarization | ❌ Not done | DEFER | P4 |
| Activity feed | — | REMOVE | — |

---

## 4. Roadmap

### Phase 1 — Fix Before Ship _(blockers for real users)_

**P0-1: Rate limiting on auth routes** ❌ Open
- Install `express-rate-limit`.
- Apply to: `POST /register`, `POST /login`, `POST /forgot-password`, `POST /change-password`, `POST /reset-password`.
- Limits: 10 req/min on login, 5 req/15min on register + forgot-password.
- Define limits in `server/src/constants.ts`. Never hardcode.
- Effort: S (2–3h)

**P0-2: Email delivery for password reset** ❌ Open
- Integrate Brevo (SMTP already wired in `env.ts`) or Resend.
- `authService.forgotPassword()` calls `sendPasswordResetEmail()` only when `env.isProd` — just requires SMTP env vars set on Render.
- Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in Render env vars.
- Effort: XS–S (configure + test)

---

### Phase 2 — UX Polish

**P1-1: Keyboard shortcuts** ❌ Open
- `N` → navigate to `/ideas/add`
- `/` → focus search input in MyIdeas
- `Esc` → close any open dialog
- Single `useKeyboardShortcuts` hook mounted in `AppShell`. Guard: skip when focus is inside input / textarea / editor.
- Effort: M (1 day)

**P1-2: ViewIdea metadata enrichment** ❌ Open
Three small additions to the metadata row in ViewIdea (below the title):
- **Word count / reading time** — strip HTML, count words, show "240 words · ~2 min read". Pure client-side.
- **Last edited timestamp** — `updatedAt` is already in MongoDB, just not fetched/shown. Show "Edited March 15" if different from `createdAt`.
- **Related ideas by tag** — at the bottom of the page, show up to 3 other ideas sharing a tag. Fetch from existing `/ideas` response (client-side filter, no new API).
- Effort: S (half day combined)

**P1-3: Fix stagger animation cap** ❌ Open
- `MyIdeas.jsx`: change `index * 40` to `Math.min(index, 10) * 40`.
- One line. Do it next time the file is open.
- Effort: XS (5 min)

**P1-4: Remove or implement `location` in SessionInfo** ❌ Open
- `geoip-lite` is installed. Wire it up in `session.service.ts` to resolve IP → city/country.
- Private/loopback IPs → "Local". Unknown → omit the field rather than showing "Unknown location".
- Effort: S (2h to implement, 30min to just remove)

**P1-5: Fix checkbox persistence in ViewIdea** ❌ Open
- Replace DOMParser hand-edit approach with Tiptap JSON storage.
- Store `{ html, json }` on the idea model. Use Tiptap editor instance (read-only, `editable: false`) and re-enable only for checkbox interactions.
- Effort: M (1 day). Correctness issue, not just polish.

---

### Phase 3 — Scale & Quality

**P2-1: First-run empty state for new users** ❌ Open
- When a user has 0 ideas, show a warm guided prompt instead of a blank list.
- Prompt: "Capture your first idea →" with a `[Spark a new idea]` CTA.
- Optionally: 2–3 starter prompts ("A problem worth solving", "Something I keep putting off").
- Effort: S (half day)

**P2-2: Server-side search + pagination** ❌ Open
- Add `$text` index on `{ title: 'text', details: 'text', tags: 'text' }` in `idea.model.ts`.
- `GET /api/ideas?q=&page=&limit=` returns paginated results with `total`.
- Client switches from local filter to debounced API calls when `query.length >= SEARCH_MIN_LENGTH`.
- Effort: L (3–5 days)

**P2-3: Export per-idea as Markdown** ❌ Open
- Single-idea export button on ViewIdea (alongside Edit / Delete / Restore).
- Use `turndown` to convert Tiptap HTML → GitHub-Flavoured Markdown.
- Downloads `idea-title-slug.md`.
- Bulk export (all ideas as ZIP) — defer until single-idea is validated.
- Effort: M (1–2 days)

**P2-4: Client-side tests** ❌ Open
- Vitest + React Testing Library.
- Priority targets: `AuthContext` (login/logout/pending state), `TagPicker` (add/remove/limit), `MyIdeas` filter/sort logic.
- Effort: L (1 week)

**P2-5: Constants hygiene** ❌ Open
- `VIEW_KEY = 'planme-view'` and `SORT_KEY = 'planme-sort'` in `MyIdeas.jsx` → move to `client/src/lib/constants.js`.
- Add cross-reference comment linking `TAG_PATTERN` in `server/src/schemas/idea.schema.ts` and `client/src/pages/Settings.jsx`.
- Effort: XS (30 min)

---

### Phase 4 — Long Term

**Pinned ideas**
- `pinned: boolean` on idea model. Pin up to 3; float to top of list regardless of sort.
- Pin action on idea row (thumbtack icon).
- Effort: M (1–2 days)

**"Remember me" checkbox on login**
- Extends `cookie.maxAge` to 30 days when checked. Separate from session store TTL.
- Effort: S (half day)

**Docker compose**
- `docker-compose.yml` spinning up MongoDB + Express.
- Unblocks CI and simplifies contributor onboarding.
- Effort: S (half day)

**PWA / offline support**
- Service worker: cache-first for static assets, stale-while-revalidate for `/api/ideas`.
- Web app manifest (old one was deleted with legacy stack).
- Makes planMe installable on iOS/Android home screen — changes usage habits for a personal tool.
- Effort: L (1 week)

**OAuth — Google login**
- Only after email delivery is confirmed working.
- Adds `googleId` to `UserModel`, new Passport strategy, route pair.
- Effort: L (3–5 days)

**Collections / notebooks**
- New `Collection` model, many-to-many with ideas, new sidebar nav entry.
- Do not build until the core idea loop has real users validating the need.
- Effort: XL (2+ weeks)

**Revision history**
- `history` array on each idea — snapshot on save.
- High storage cost for a personal tool; validate before building.
- Effort: XL (1–2 weeks)

**AI tagging / summarisation**
- Async post-save call to Anthropic Claude API.
- Suggested tags surfaced as accept/reject chips. Never auto-applied.
- Effort: L (3–5 days for integration, M for good UX)

---

## 5. Quick Wins Table

| Item | Effort | Status |
|---|---|---|
| Rate limiting on auth routes | 2–3h | ❌ P0 |
| Keyboard shortcuts (`N`, `/`, `Esc`) | 1 day | ❌ P1 |
| Word count / reading time on ViewIdea | 1h | ❌ P1 |
| Last edited timestamp on ViewIdea | 30 min | ❌ P1 |
| Related ideas by tag (client-side, ViewIdea) | 2h | ❌ P1 |
| Cap stagger animation at index 10 | 5 min | ❌ P1 |
| Remove / implement `location` in SessionInfo | 1–2h | ❌ P1 |
| First-run empty state for 0-idea users | half day | ❌ P2 |
| Move `VIEW_KEY`/`SORT_KEY` to constants | 30 min | ❌ P2 |
| Configure SMTP env vars on Render for email | 30 min | ❌ P0 |
| Fix stagger cap (one-liner) | 5 min | ❌ |
| Fix checkbox silent catch in ViewIdea | 30 min | ❌ |

---

## 6. What NOT to Build

- **Activity feed** — an `events` collection for every edit is disproportionate infrastructure for a personal tool. High write amplification, low value.
- **Full-text search with Atlas Search** — `$text` index covers 95% of the need without locking into Atlas.
- **Templates as a feature** — the rich editor already covers everything templates would offer.
- **Split-panel auth layouts** — banned by design system rules.
- **Second chromatic accent** — amber is the only hue budget. No feature justifies a second accent color.
- **Inline `style={}` overrides for theme values** — new utility classes go in `design-system.css`.

---

## 7. Assumptions

- No real users in production yet — missing email delivery for password reset confirms this. P0 items must be done before onboarding any real users.
- Deployment target: Render (full-stack). Build: `pnpm install && pnpm build`. Start: `pnpm start`. MongoDB: Atlas M0 free cluster.
- MongoDB is self-hosted or Atlas. Server-side search recommendation uses `$text` index, not Atlas Search.
- The client remains plain JSX (no TS migration). All new client code follows existing patterns.
- Light theme (`[data-theme="light"]`) exists in CSS and is toggleable in Settings, but is not a primary delivery requirement.
- No CI pipeline yet. Adding GitHub Actions running `pnpm test` is worthwhile but not in scope.
- The 3-session limit (`MAX_SESSIONS_PER_USER`) is intentional and configurable via env var.
