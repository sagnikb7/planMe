# Client Modules

## Entry
| File | Role |
|---|---|
| `main.jsx` | React root mount |
| `App.jsx` | Router + provider tree + route declarations |

## Provider Tree (order matters)
```
BrowserRouter
  ToastProvider       (toast-context.jsx)
    AuthProvider      (AuthContext.jsx)
      AppShell        (protected subtree)
```

## Context
| File | Exports | State |
|---|---|---|
| `context/AuthContext.jsx` | `AuthProvider` | `user` (null\|undefined\|SanitizedUser), `pendingSessions` |
| `context/auth-context.js` | `AuthContext` (raw context object) | |
| `context/toast-context.jsx` | `ToastProvider`, `useToast()` | toast queue |

`user === undefined` = loading; `null` = logged out; object = authenticated.

## Hooks
| File | Purpose |
|---|---|
| `hooks/useAuth.js` | `useContext(AuthContext)` shorthand |
| `hooks/useOnlineStatus.js` | Online/offline detection |
| `hooks/useKeyboardShortcuts.js` | Global keyboard shortcuts |
| `hooks/useTheme.js` | Dark/light theme toggle |
| `hooks/useTypewriter.js` | Typewriter animation for landing |

## Routing
| Type | Path | Component |
|---|---|---|
| Public | `/` | Landing |
| PublicOnly | `/login` | Login |
| PublicOnly | `/register` | Register |
| PublicOnly | `/forgot-password` | ForgotPassword |
| PublicOnly | `/reset-password` | ResetPassword |
| None | `/session-limit` | SessionLimit (accessible in pending state) |
| Protected | `/ideas` | MyIdeas |
| Protected | `/ideas/add` | AddIdea |
| Protected | `/ideas/:id` | ViewIdea |
| Protected | `/ideas/edit/:id` | EditIdea |
| Protected | `/profile` | Profile |
| Protected | `/settings` | Settings |

`ProtectedRoute` redirects to `/login` if `user` is null.  
`PublicOnlyRoute` redirects to `/ideas` if `user` is set.

## Pages
| Page | Key behavior |
|---|---|
| `Landing` | Hero + CTA (hides CTA if logged in) |
| `Login` | Form → `auth.login()` → session-limit redirect or `/ideas` |
| `Register` | Form → `auth.register()` → `/login` |
| `MyIdeas` | List/grid DnD, filter/sort, tag filter, search, swipe-archive, offline-aware |
| `AddIdea` | RichEditor form, prompt templates, offline fallback |
| `EditIdea` | Same form, react-hook-form, auto-populates |
| `ViewIdea` | Read-only rich view, checkbox tasks, inline auto-save, related ideas |
| `Profile` | User identity, session management (SessionList), logout |
| `Settings` | Display name, change password, delete account |
| `SessionLimit` | Show active sessions, terminate one, resolve pending session |
| `ForgotPassword` | Email form → dev shows link, prod sends email |
| `ResetPassword` | Token + new password form |

## Shared Components
| Component | Purpose |
|---|---|
| `AppShell` | Layout: sidebar nav + content outlet + offline banner |
| `ProtectedRoute / PublicOnlyRoute` | Route guards |
| `SessionList` | Reusable session list with ConfirmDialog termination |
| `ShortcutsModal` | Keyboard shortcut reference |
| `OfflineBanner` | Offline status indicator |
| `Logo` | Brand mark |

## UI Primitives (`components/ui/`)
`button`, `card`, `ConfirmDialog`, `dialog`, `input`, `label`, `loader`, `password-field`, `rich-editor`, `status-select`, `tag-input`, `tag-picker`, `textarea`

**`ConfirmDialog`** — shared confirmation dialog used by MyIdeas, ViewIdea, SessionList, Settings.  
Props: `open, onOpenChange, title, description (ReactNode), confirmLabel, loading, onConfirm, confirmDisabled, children`

## Lib
| File | Purpose |
|---|---|
| `lib/api.js` | Axios instance: `baseURL=/api`, `withCredentials`, 8s timeout, offline detection |
| `lib/db.js` | Dexie IndexedDB (`planme-offline`): stores `ideas`, `pendingQueue` |
| `lib/sync.js` | `seedCache()`, `flushPendingQueue()`, `isOfflineError()` |
| `lib/constants.js` | Client-side constants (see [guidelines/constants.md](../guidelines/constants.md)) |
| `lib/passwordPolicy.js` | Client-side password validation mirror |
| `lib/utils.js` | `cn()` (clsx + tailwind-merge) |
