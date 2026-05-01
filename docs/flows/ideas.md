# Ideas Flow

## Create
1. Client: `AddIdea` page → POST `/api/ideas`
2. Service: count user ideas → 400 if ≥ 100
3. Service: `enforceWorkspaceTagLimit` → 400 if merged unique tags > 10
4. Repo: `getMaxSortOrder` → assign `sortOrder = max + 1`
5. Return created idea (201)

## Read (list)
1. `GET /api/ideas` → `ideaRepository.findAllByUser(userId)` → all ideas sorted by `sortOrder`
2. Client merges with local pending ideas (prepends pending to server list)

## Update
1. PUT `/:id` → full replace (title, details, tags, status)
2. Service enforces workspace tag limit (excludes current idea's existing tags from count)

## Archive / Restore
- PATCH `/:id/status` with `{ status: 'archived'|'draft' }`
- Client: swipe-left gesture on list row (non-archived, non-manual-sort)
- Client: Archive button on each non-archived row
- Client: Restore button on each archived row (direct, no confirm)

## Delete
- DELETE `/:id` — permanent, no soft delete
- Client: Trash button on list row → ConfirmDialog → DELETE
- Client: Delete button on ViewIdea → ConfirmDialog → DELETE → navigate('/ideas')

## Reorder
- PATCH `/reorder` `{ ids: ObjectId[] }` — max 500
- Only active in `sortBy=manual` mode
- Client: DnD (dnd-kit) → optimistic update → persist

## Tag Management
- GET `/tags` → `{ tags: [{tag, count}], limit: 10 }`
- PATCH `/tags/:tag` `{ name: newTag }` → rename across all ideas
  - 400 if `newTag` already exists
  - 404 if `oldTag` not found

## Limits (from constants)
| Constant | Value |
|---|---|
| IDEA_LIMIT | 100 per user |
| IDEA_MAX_TAGS | 3 per idea |
| WORKSPACE_MAX_TAGS | 10 unique tags total |
| TITLE_MAX_LENGTH | 200 chars |
| DETAILS_MAX_LENGTH | 50 000 chars |
| TAG_MAX_LENGTH | 32 chars |
