import { describe, it, expect } from 'vitest';
import {
  tagSchema,
  createIdeaSchema,
  patchIdeaStatusSchema,
  reorderIdeasSchema,
  renameTagSchema,
} from '../../../src/schemas/idea.schema';

const VALID_OID = '507f1f77bcf86cd799439011';

describe('tagSchema', () => {
  it('accepts valid lowercase tag', () => {
    expect(tagSchema.safeParse('my-tag').success).toBe(true);
  });

  it('normalizes uppercase to lowercase', () => {
    const result = tagSchema.safeParse('MyTag');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('mytag');
  });

  it('rejects single character', () => {
    expect(tagSchema.safeParse('a').success).toBe(false);
  });

  it('accepts exactly 2 characters', () => {
    expect(tagSchema.safeParse('ab').success).toBe(true);
  });

  it('rejects tag longer than 32 chars', () => {
    expect(tagSchema.safeParse('a'.repeat(33)).success).toBe(false);
  });

  it('rejects tag with leading hyphen', () => {
    expect(tagSchema.safeParse('-tag').success).toBe(false);
  });

  it('rejects tag with trailing hyphen', () => {
    expect(tagSchema.safeParse('tag-').success).toBe(false);
  });

  it('rejects tag with spaces', () => {
    expect(tagSchema.safeParse('my tag').success).toBe(false);
  });

  it('accepts tag with internal hyphens', () => {
    expect(tagSchema.safeParse('my-cool-tag').success).toBe(true);
  });

  it('accepts alphanumeric only', () => {
    expect(tagSchema.safeParse('tag123').success).toBe(true);
  });
});

describe('createIdeaSchema', () => {
  it('accepts minimal valid input (details only)', () => {
    const result = createIdeaSchema.safeParse({ details: 'Some idea' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('');
      expect(result.data.tags).toEqual([]);
      expect(result.data.status).toBe('draft');
    }
  });

  it('accepts full valid input', () => {
    const result = createIdeaSchema.safeParse({
      title: 'My Idea',
      details: 'Details here',
      tags: ['tag-one', 'tag-two'],
      status: 'archived',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing details', () => {
    expect(createIdeaSchema.safeParse({ title: 'No details' }).success).toBe(false);
  });

  it('rejects empty details', () => {
    expect(createIdeaSchema.safeParse({ details: '' }).success).toBe(false);
  });

  it('rejects title longer than 200 chars', () => {
    const result = createIdeaSchema.safeParse({ title: 'x'.repeat(201), details: 'ok' });
    expect(result.success).toBe(false);
  });

  it('rejects more than 3 tags', () => {
    const result = createIdeaSchema.safeParse({ details: 'ok', tags: ['a1', 'b2', 'c3', 'd4'] });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate tags', () => {
    const result = createIdeaSchema.safeParse({ details: 'ok', tags: ['tag', 'tag'] });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 3 tags', () => {
    const result = createIdeaSchema.safeParse({ details: 'ok', tags: ['a1', 'b2', 'c3'] });
    expect(result.success).toBe(true);
  });
});

describe('patchIdeaStatusSchema', () => {
  it('accepts draft', () => {
    expect(patchIdeaStatusSchema.safeParse({ status: 'draft' }).success).toBe(true);
  });

  it('accepts archived', () => {
    expect(patchIdeaStatusSchema.safeParse({ status: 'archived' }).success).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(patchIdeaStatusSchema.safeParse({ status: 'published' }).success).toBe(false);
  });
});

describe('reorderIdeasSchema', () => {
  it('accepts valid ObjectId array', () => {
    const result = reorderIdeasSchema.safeParse({ ids: [VALID_OID, VALID_OID] });
    expect(result.success).toBe(true);
  });

  it('rejects non-ObjectId string', () => {
    const result = reorderIdeasSchema.safeParse({ ids: ['not-an-id'] });
    expect(result.success).toBe(false);
  });

  it('accepts empty array', () => {
    expect(reorderIdeasSchema.safeParse({ ids: [] }).success).toBe(true);
  });

  it('rejects more than 500 ids', () => {
    const ids = Array.from({ length: 501 }, () => VALID_OID);
    expect(reorderIdeasSchema.safeParse({ ids }).success).toBe(false);
  });
});

describe('renameTagSchema', () => {
  it('accepts valid tag name', () => {
    expect(renameTagSchema.safeParse({ name: 'new-tag' }).success).toBe(true);
  });

  it('rejects invalid tag format', () => {
    expect(renameTagSchema.safeParse({ name: '-bad' }).success).toBe(false);
  });
});
