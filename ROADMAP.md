# planMe Roadmap
_Updated: 2026-04-27_

---

## Shipped

**Auth & accounts**
- Register, login (with "remember me" — 30-day cookie), logout, forgot/reset password
- Edit display name inline, change password, delete account (cascade wipe)
- Session management: 3-session cap, pending flow, terminate-to-unblock, session list on Profile

**Ideas**
- Full CRUD with Tiptap rich editor (headings, task lists, code, blockquote, bullet/ordered lists)
- Archive / restore with contextual banners on ViewIdea and EditIdea
- Search, tag filter (with counts), sort: newest / updated / oldest / A–Z / manual drag-and-drop
- List + grid view toggle; drag-and-drop manual reorder persisted to server
- Word count, reading time, last edited date, related ideas by tag — all on ViewIdea
- Swipe left to archive on mobile (idea rows)
- Empty state with starter prompts for brand-new users
- `n` → new idea, `/` → focus search, `e` → edit idea, `?` → keyboard shortcuts modal
- Keyboard shortcuts modal: `⌨` button in sidebar footer (desktop) + Settings row (mobile)
- Inline checkbox persistence (HTML-based, ViewIdea)

**Profile & Settings**
- Profile: avatar initials, name (inline edit), email, joined date, idea stats (active/archived), sessions, sign out
- Settings — PREFERENCES: dark/light theme toggle
- Settings — WORKSPACE: tag rename with usage counts, export all ideas as JSON
- Settings — ACCOUNT: change password, delete account with type-to-confirm dialog

**Offline support**
- Dexie.js IndexedDB store (`planme-offline`) — ideas cached locally, pending queue for offline writes
- Four op types: `pending-create`, `pending-update`, `pending-archive`, `pending-delete`
- Auto-flush queue on `window.online` event; 404 ops skipped silently, network errors halt and retry next reconnect
- Offline banner: amber (offline) → spinner (syncing) → green flash (synced)
- Axios 8 s timeout — Render cold-start treated as offline; user saves locally, syncs once server wakes
- Workbox `StaleWhileRevalidate` runtime cache for `GET /api/ideas` — list loads instantly on cold-start
- Local ideas shown with amber "Local" badge; non-navigable until synced
- Offline swipe-to-archive queued and applied optimistically
- Settings → App section: offline feature info + PWA install prompt (`beforeinstallprompt`)
- Landing: "Works offline" feature card + "Offline-ready" pill

**Infrastructure**
- PWA: service worker, offline caching, installable (192 + 512px PNG icons, apple-touch-icon)
- Sticky sidebar — never stretches to match long pages
- Mobile bottom nav (Ideas → New idea → Settings → Profile)
- DOMPurify on all HTML rendering; toast feedback on all mutations
- Render deployment: `pnpm build` → `pnpm start`, MongoDB Atlas
- Vitest client test suite — `sync.js` unit tests with `fake-indexeddb` (19 tests, no browser/MongoDB needed)

---

## Fix before ship (P0)

**Rate limiting on auth endpoints** — no `express-rate-limit` yet. Credential stuffing is unmitigated.
- Apply to: `/register`, `/login`, `/forgot-password`, `/change-password`, `/reset-password`
- 10 req/min on login, 5 req/15 min on register + forgot-password
- Define limits in `server/src/constants.ts`

**Email delivery for password reset** — SMTP is wired, just needs env vars set on Render.
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in Render environment

---

## Next (P1–P2)

**Fix checkbox persistence** — current DOMParser approach breaks if Tiptap changes HTML format. Correct fix: store `{ html, json }`, update through a Tiptap editor instance.

**Pinned ideas** — `pinned: boolean` on idea model, float top regardless of sort, thumbtack icon on row. Up to 3 pinned.

**Server-side search + pagination** — `$text` index on title/details/tags. `GET /api/ideas?q=&page=&limit=`. Client debounces to API when `query.length >= 2`. Needed past ~200 ideas.

**Bulk actions** — checkbox select on idea rows → archive all / delete all / retag all.

**Export per-idea as Markdown** — `turndown` converts Tiptap HTML → GFM. Download `slug.md` from ViewIdea alongside Edit / Delete.

**EditIdea load failure** — when fetch fails with a non-offline error (e.g., auth expired), form card still renders with no content. Should show a full-page error. (Offline fallback is handled — Dexie cache is used automatically.)

---

## Later (P3–P4)

- Collections / notebooks — new model, sidebar entry. Don't build until core loop has real users.
- OAuth — Google login. Only after email delivery is confirmed working.
- Revision history — snapshot on save. High storage cost; validate need first.
- Docker compose — spins up MongoDB + Express, simplifies contributor onboarding.
- Client-side tests (RTL layer) — Vitest is set up; sync.js has 19 unit tests. Next: AuthContext, TagPicker, filter/sort logic with React Testing Library.
- AI tagging / summarization — Anthropic API, suggested tags as accept/reject chips.

---

## Won't build

- Activity feed — high write amplification, low value for a personal tool
- Full-text search via Atlas Search — `$text` index covers the need without vendor lock-in
- Templates as a feature — rich editor already handles this
- Second chromatic accent — amber is the only hue budget
