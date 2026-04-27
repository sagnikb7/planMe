import { z } from 'zod';
import { IDEA_STATUSES, TAG_MIN_LENGTH, TAG_MAX_LENGTH, TITLE_MAX_LENGTH, DETAILS_MAX_LENGTH, IDEA_MAX_TAGS } from '../constants';

// Letters, digits, hyphens; must start and end with a letter or digit; min 2 chars.
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{2}$/;

export const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(TAG_MIN_LENGTH, `Tag must be at least ${TAG_MIN_LENGTH} characters`)
  .max(TAG_MAX_LENGTH, `Tag must be at most ${TAG_MAX_LENGTH} characters`)
  .regex(TAG_PATTERN, 'Tag must contain only letters, digits, and hyphens, and cannot start or end with a hyphen');

const tagsArraySchema = z
  .array(tagSchema)
  .max(IDEA_MAX_TAGS, `Cannot add more than ${IDEA_MAX_TAGS} tags per idea`)
  .default([])
  .refine((tags) => new Set(tags).size === tags.length, { message: 'Duplicate tags are not allowed' });

export const createIdeaSchema = z.object({
  title: z.string().max(TITLE_MAX_LENGTH).default(''),
  details: z.string().min(1, 'Details are required').max(DETAILS_MAX_LENGTH),
  tags: tagsArraySchema,
  status: z.enum(IDEA_STATUSES).default('draft'),
});

export const updateIdeaSchema = createIdeaSchema;

export const renameTagSchema = z.object({
  name: tagSchema,
});

export const patchIdeaStatusSchema = z.object({
  status: z.enum(IDEA_STATUSES),
});

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/;

export const reorderIdeasSchema = z.object({
  ids: z.array(z.string().regex(OBJECT_ID_REGEX, 'Invalid id')).max(500),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type PatchIdeaStatusInput = z.infer<typeof patchIdeaStatusSchema>;
export type ReorderIdeasInput = z.infer<typeof reorderIdeasSchema>;
export type RenameTagInput = z.infer<typeof renameTagSchema>;
