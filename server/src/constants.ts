export const IDEA_STATUSES = ['draft', 'archived'] as const;
export type IdeaStatus = typeof IDEA_STATUSES[number];

export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: true,
  message: 'Password must contain at least one uppercase letter, one number, and one symbol.',
} as const;

export const RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hour

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const PENDING_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const MAX_SESSIONS_PER_USER = 3;

export const BCRYPT_ROUNDS = 12;

export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 32;
export const TITLE_MAX_LENGTH = 200;
export const DETAILS_MAX_LENGTH = 50_000;
export const IDEA_MAX_TAGS = 3;
export const WORKSPACE_MAX_TAGS = 10;
export const IDEA_LIMIT = 100;
