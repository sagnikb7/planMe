export const APP_NAME = 'planMe';

export const IDEA_STATUSES = /** @type {const} */ (['draft', 'archived']);

export const IDEA_STATUS_LABELS = {
  draft: 'Draft',
  archived: 'Archived',
};

export const SORT_OPTIONS = /** @type {const} */ ([
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'a-z',    label: 'A–Z' },
  { key: 'manual', label: 'Manual' },
]);

export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 32;
export const TITLE_MAX_LENGTH = 200;
export const DETAILS_MAX_LENGTH = 50_000;
export const IDEA_MAX_TAGS = 3;
export const WORKSPACE_MAX_TAGS = 10;
export const IDEA_LIMIT = 100;

export const SEARCH_MIN_LENGTH = 2;
