# planMe Roadmap
_Updated: 2026-05-01 (product + launch-readiness review)_

---

## Product Verdict

planMe is ready for a controlled production beta, not a loud public launch yet.

The core product is stronger than a prototype: private idea capture, rich editing, tags/search, offline support, PWA installability, account/session controls, export, and a polished visual system are already in place. The app has a clear promise: **a private, offline-first idea workspace for people who want to capture thoughts quickly and find them later.**

The biggest product gap is not capture. Capture is good. The gap is **retention**: users need more reasons to come back after they save an idea.

### Current Scorecard

| Area | Score | Notes |
|---|---:|---|
| Problem clarity | 8/10 | Clear, focused idea workspace positioning. |
| Core feature completeness | 8/10 | CRUD, editor, tags, search, archive, offline, auth, settings are covered. |
| UX polish | 7.5/10 | Strong visual identity; keep tightening mobile/card edge cases. |
| Technical readiness | 8/10 | Build/tests pass; good server/client separation. |
| Trust/security | 7.5/10 | Privacy/terms and baseline headers added; SMTP and deeper testing still matter. |
| Retention potential | 6/10 | Needs review loops, reminders, pinned ideas, or another recurring pull. |
| Differentiation | 6.5/10 | Offline/private/open-source helps, but notes/ideas is a crowded space. |
| Investor attractiveness | 6/10 | Good craft; needs a sharper wedge, usage proof, and retention signal. |
| Launch readiness | 7.5/10 | Good for beta after SMTP is configured and key flows are smoke-tested. |

---

## Positioning

**Primary audience:** builders, writers, indie hackers, students, and professionals who capture lots of half-formed thoughts and want a private place to revisit them.

**Current wedge:** offline-first private idea capture with a calm, minimal product surface.

**Suggested sharper positioning:** “An offline-first idea inbox for builders who want to capture thoughts fast and review the ones worth pursuing.”

This is stronger than “notes app” because it emphasizes idea capture, resurfacing, and action.

---

## Launch Readiness

### P0 Before Production

**Password reset email delivery**
- SMTP is wired, but production must set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.
- Smoke-test forgot/reset password on the deployed Render domain before inviting users.

**Production smoke test**
- Register → login → create idea → edit idea → archive/restore → export → logout.
- Forgot password → receive email → reset password → log in with new password.
- Session cap flow: log in from 3 sessions, attempt 4th, terminate one, resolve pending session.
- Offline flow: create/edit while offline, reconnect, verify sync.

### P1 Shortly After Launch

**Basic product telemetry**
- Track privacy-conscious aggregate events: signup, first idea created, second session, export, delete account, offline sync success/failure.
- Do not track idea content.
- Goal: understand activation and 7-day return rate.

**Frontend integration coverage**
- Add React Testing Library tests for AuthContext, TagPicker, filter/sort behavior, and key page states.

---

## Product Risks

### Retention Risk

Users may capture ideas once and then forget to return. The product needs a recurring loop.

Best retention bets:
- Weekly review mode: “Review 5 ideas you have not revisited.”
- Pinned ideas: keep 1–3 important ideas visible.
- Reminders/follow-ups: lightweight revisit dates.
- “Stale ideas” view: ideas not opened or edited recently.
- Better related ideas: encourage browsing the workspace.

### Differentiation Risk

The notes/ideas space is crowded. “Private and offline” is valuable, but it may not be enough by itself.

Best differentiation bets:
- Make planMe feel like an **idea inbox**, not a general notes app.
- Focus on capture → revisit → decide.
- Add AI only where it reinforces that loop: suggested tags, summaries, next action extraction.

### Scale Risk

Current client-side search/list handling is fine for small workspaces, but will degrade with heavier users.

Mitigation:
- Server-side search and pagination before supporting large workspaces.
- Add `$text` index on title/details/tags.
- Add API params: `GET /api/ideas?q=&page=&limit=`.

---

## Roadmap

### Phase 0 — Launch Readiness

**Status:** Mostly complete.

- Configure production SMTP and verify password reset delivery.
- Do one deployed end-to-end smoke pass.
- Confirm Privacy/Terms/contact links render correctly on the deployed domain.
- Confirm production CSP does not block service worker, fonts, reset flows, or API calls.
- Decide whether the beta is invite-only, public beta, or soft launch to a small audience.

### Phase 1 — Retention Loop

**Goal:** Give users a reason to return.

**Pinned ideas**
- Add `pinned: boolean` to idea model.
- Float pinned ideas above normal sort.
- Limit to 3 pinned ideas.
- Add thumbtack action on idea rows/cards.

**Review mode**
- Add a simple review queue: recently untouched ideas, older drafts, or ideas with matching tags.
- First version can be manual: “Review ideas.”
- Later version can become weekly/digest-driven.

**Stale / revisit views**
- “Not opened recently”
- “Recently updated”
- “Archived”
- “Pinned”

### Phase 2 — Portability + Power Use

**Goal:** Make planMe safer to trust with long-term ideas.

**Export per idea as Markdown**
- Use `turndown` to convert Tiptap HTML to GFM.
- Add `Download .md` action on ViewIdea.

**Bulk actions**
- Multi-select idea rows/cards.
- Archive, delete, and retag selected ideas.

**Server-side search + pagination**
- `$text` index on title/details/tags.
- `GET /api/ideas?q=&page=&limit=`.
- Debounce client search when `query.length >= 2`.
- Needed once users approach 200+ ideas.

### Phase 3 — Trust + Robustness

**Goal:** Reduce edge-case risk before wider launch.

**Fix checkbox persistence**
- Current DOMParser approach depends on Tiptap HTML format.
- Better fix: store `{ html, json }`, update checkbox state through a Tiptap editor instance.

**EditIdea load failure**
- If fetch fails with a non-offline error, show a full-page error state instead of rendering an empty edit form.

**Tag validation coverage**
- Add/expand integration tests for tag rename and idea creation edge cases:
  - valid tags with digits: `3dprinting`, `web3`, `html5`
  - hyphen-only rejection
  - leading/trailing hyphen rejection
  - duplicate tags
  - over-limit arrays

**Security follow-up**
- Review CSP in production after deploy.
- Consider CSRF protection for state-changing routes.
- Add a deployment checklist for cookie flags, SMTP, MongoDB URI, and client origin.

### Phase 4 — Growth Features

**Goal:** Add convenience without bloating the product.

**OAuth**
- Google login after email delivery is proven stable.

**Collections / notebooks**
- Add only if real users outgrow tags.
- Avoid building this before evidence of workspace complexity.

**Revision history**
- Snapshot on save.
- Useful for trust, but validate demand because storage cost grows.

**AI assist**
- Suggested tags.
- One-line summary.
- Extracted next step.
- Keep opt-in and content-aware because the product promise is privacy.

---

## Shipped

### Auth & Accounts

- Register, login with remember-me 30-day cookie, logout, forgot/reset password.
- Edit display name inline, change password, delete account with cascade wipe.
- Session management: 3-session cap, pending flow, terminate-to-unblock, session list on Profile.

### Ideas

- Full CRUD with Tiptap rich editor: headings, task lists, code, blockquote, bullet/ordered lists.
- Archive / restore with contextual banners on ViewIdea and EditIdea.
- Search, tag filter with counts, sort by newest / updated / A–Z / manual drag-and-drop.
- Tags allow digits such as `3dprinting`, `web3`, `html5`.
- Card/list metadata layout stays stable when ideas have 0–3 tags; card footers keep date/actions aligned.
- List + grid view toggle; drag-and-drop manual reorder persisted to server.
- Word count, reading time, last edited date, related ideas by tag on ViewIdea.
- Swipe left to archive on mobile idea rows.
- Empty state with 3 starter prompt links that prefill title + rich-text templates.
- Keyboard shortcuts: `n` new idea, `/` focus search, `e` edit idea, `?` shortcuts modal.
- Inline checkbox persistence in ViewIdea.

### Profile & Settings

- Profile: avatar initials, name, email, joined date, idea stats, active sessions, sign out.
- Preferences: dark/light theme toggle.
- Workspace: tag rename with usage counts, export all ideas as JSON.
- Account: change password, delete account with type-to-confirm dialog.
- Public Privacy Policy and Terms pages linked from landing footer.
- Contact/support email linked from legal pages and footer.

### Offline + PWA

- Dexie.js IndexedDB store: `planme-offline`.
- Cached ideas and pending queue for offline writes.
- Pending ops: create, update, archive, delete.
- Auto-flush queue on reconnect.
- 404 sync ops skipped safely; network errors halt and retry later.
- Offline banner: offline, syncing, synced states.
- Axios 8s timeout treats Render cold start as offline.
- Workbox `StaleWhileRevalidate` runtime cache for `GET /api/ideas`.
- Local ideas show amber `Local` badge and are non-navigable until synced.
- PWA service worker, offline caching, install prompt, app icons.

### Infrastructure + Trust

- Express + TypeScript API with routes → services → repositories.
- MongoDB via Mongoose.
- Rate limiting on auth endpoints.
- DOMPurify on rendered idea HTML.
- Baseline HTTP hardening headers:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - production CSP
- Render deployment flow: `pnpm build` → `pnpm start`.
- Client sync tests with fake-indexeddb.
- Server unit tests.

---

## Won't Build For Now

- Activity feed — high write amplification, low value for a personal tool.
- Atlas Search — `$text` index should cover the first search scale-up.
- Full template system — starter prompts and rich editor cover the current need.
- Second accent color — amber remains the single chromatic accent.
- Team/workspace collaboration — not aligned with the current private idea workspace wedge.
