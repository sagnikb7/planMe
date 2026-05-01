# API — Ideas (`/api/ideas`)

All routes require `ensureAuthenticated`. All ideas scoped to `req.user._id`.

---

## GET /
- **Output**: `Idea[]` (all ideas for user, sorted by sortOrder)

## GET /:id
- **Output**: `Idea` or 404
- **Guard**: `isValidObjectId(id)` → 404 if invalid

## POST /
- **Input**: `{ title?: string, details: string (required, min 1), tags?: string[], status?: 'draft'|'archived' }`
- **Output**: 201 `Idea`
- **Errors**: 400 if idea count ≥ 100 | workspace tag limit exceeded
- **Side effects**: sortOrder = max + 1

## PUT /:id
- **Input**: same as POST (full replace)
- **Output**: `Idea` or 404
- **Errors**: 400 workspace tag limit

## PATCH /:id/status
- **Input**: `{ status: 'draft'|'archived' }`
- **Output**: `Idea` or 404

## PATCH /reorder
- **Input**: `{ ids: ObjectId[] }` (max 500)
- **Output**: `{ ok: true }`
- **Side effects**: updates sortOrder for each idea by array position

## DELETE /:id
- **Output**: `{ message: 'Deleted' }` or 404

## GET /tags
- **Output**: `{ tags: { tag: string, count: number }[], limit: 10 }`

## PATCH /tags/:tag
- **Input**: `{ name: string }` (valid tag format)
- **Output**: `{ ok: true }`
- **Errors**: 400 if newTag already exists | invalid tag format; 404 if oldTag not found
- **Side effects**: renames tag across all user's ideas

---

## Idea shape
```ts
{
  _id: string,
  title: string,
  details: string,     // HTML from rich editor
  tags: string[],
  status: 'draft' | 'archived',
  sortOrder: number,
  user: string,
  createdAt: string,
  updatedAt: string,
}
```

## Tag validation
- Pattern: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{2}$/`
- Length: 2–32 chars
- Normalized: lowercase, trimmed
- No duplicates within one idea
