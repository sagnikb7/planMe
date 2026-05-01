# planMe — Docs Index

Quick-nav for the knowledge base. Start here.

## Architecture
- [Overview](architecture/overview.md) — stack, monorepo layout, request lifecycle, prod vs dev
- [Data Models](architecture/data-models.md) — User, Idea, UserSession, IndexedDB stores

## Flows
- [Auth](flows/auth.md) — register, login, logout, forgot/reset/change password, delete account
- [Session Limit](flows/session-limit.md) — MAX_SESSIONS_PER_USER flow, pending state, resolve
- [Ideas](flows/ideas.md) — CRUD, archive/restore, reorder, tag management, limits
- [Offline Sync](flows/offline-sync.md) — seedCache, pendingQueue, flushPendingQueue, local_ ids

## APIs
- [Auth API](apis/auth.md) — `/api/auth/*`
- [Ideas API](apis/ideas.md) — `/api/ideas/*`
- [Sessions API](apis/sessions.md) — `/api/sessions/*`

## Modules
- [Server](modules/server.md) — routes, services, repositories, middleware, utils
- [Client](modules/client.md) — routing, pages, components, hooks, lib

## Guidelines
- [Constants](guidelines/constants.md) — all shared constants and their values
- [Design System](guidelines/design-system.md) — tokens, classes, button variants, amber accent rule

## History
- [CHANGELOG](CHANGELOG.md)
