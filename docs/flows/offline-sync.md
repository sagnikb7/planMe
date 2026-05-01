# Offline Sync Flow

## Detection
`isOfflineError(err)` → true if `err.isOffline || code=ECONNABORTED || message="Network Error"`  
axios instance: 8s timeout, `baseURL: '/api'`, `withCredentials: true`

---

## Read Path (load ideas)
1. `GET /api/ideas` → on success: `seedCache(res.data)` → `flushPendingQueue()`
2. On `isOfflineError`: load from `db.ideas` (IndexedDB) ordered by `updatedAt desc`

### seedCache logic
- Mark server ideas as `syncStatus: 'synced'`
- Preserve local pending ideas (not in server response)
- `bulkPut` synced ideas into Dexie (skips pending ones)

---

## Write Path (offline writes)
Each write operation that fails with an offline error:
1. Writes to `db.ideas` with `syncStatus: 'pending-*'`
2. Appends op to `db.pendingQueue` (type + payload + ideaId + createdAt)

| Op type | Trigger |
|---|---|
| `pending-create` | New idea while offline |
| `pending-update` | Edit while offline |
| `pending-archive` | Archive while offline |
| `pending-delete` | (queued if needed) |

---

## Flush (reconnect)
Triggered by:
- Successful server fetch (after seedCache)
- `planme:sync-complete` window event (fired after flush)

### `flushPendingQueue()` logic
- Singleton: concurrent calls share one in-flight promise
- Processes `pendingQueue` ordered by `createdAt` (chronological)
- Per op:
  - `pending-create`: POST → replace local `local_*` id with server id
  - `pending-update`: PUT
  - `pending-archive`: PATCH status
  - `pending-delete`: DELETE
  - 404 → skip (delete from queue + ideas)
  - Other error → **halt flush** (preserve queue order)
- Returns count of synced ops

---

## Local-only ideas
- ID starts with `local_` (`local_${crypto.randomUUID()}`)
- Cannot navigate to `/ideas/local_*` (no View/Edit page)
- Delete is local-only (no API call needed)
- Swipe-archive skipped for local ideas
