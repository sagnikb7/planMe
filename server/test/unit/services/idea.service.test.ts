import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';

vi.mock('../../../src/repositories/idea.repository', () => ({
  ideaRepository: {
    findAllByUser: vi.fn(),
    findByIdAndUser: vi.fn(),
    getTagUsageCounts: vi.fn(),
    getDistinctTagsByUser: vi.fn(),
    renameTag: vi.fn(),
    countByUser: vi.fn(),
    countPinnedByUser: vi.fn(),
    getMaxSortOrder: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    patchStatus: vi.fn(),
    patchPin: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
    deleteAllByUser: vi.fn(),
  },
}));

import { ideaService } from '../../../src/services/idea.service';
import { ideaRepository } from '../../../src/repositories/idea.repository';
import { AppError } from '../../../src/utils/errors';
import { IDEA_LIMIT, WORKSPACE_MAX_TAGS, PIN_LIMIT } from '../../../src/constants';

const userId = new Types.ObjectId();
const ideaId = new Types.ObjectId().toString();
const mockIdea = { _id: new Types.ObjectId(), title: 'Test', details: 'Details', tags: [], status: 'draft', userId };

beforeEach(() => vi.clearAllMocks());

describe('getAll', () => {
  it('returns all ideas for user', async () => {
    vi.mocked(ideaRepository.findAllByUser).mockResolvedValue([mockIdea] as never);
    expect(await ideaService.getAll(userId)).toEqual([mockIdea]);
  });
});

describe('getById', () => {
  it('returns the idea when found', async () => {
    vi.mocked(ideaRepository.findByIdAndUser).mockResolvedValue(mockIdea as never);
    expect(await ideaService.getById(ideaId, userId)).toEqual(mockIdea);
  });

  it('returns null when not found', async () => {
    vi.mocked(ideaRepository.findByIdAndUser).mockResolvedValue(null);
    expect(await ideaService.getById(ideaId, userId)).toBeNull();
  });
});

describe('create', () => {
  it('throws AppError(400) when idea limit is reached', async () => {
    vi.mocked(ideaRepository.countByUser).mockResolvedValue(IDEA_LIMIT);
    await expect(
      ideaService.create({ title: '', details: 'x', tags: [], status: 'draft' }, userId),
    ).rejects.toThrow(AppError);
  });

  it('throws AppError(400) when workspace tag limit is exceeded', async () => {
    vi.mocked(ideaRepository.countByUser).mockResolvedValue(0);
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue(
      Array.from({ length: WORKSPACE_MAX_TAGS }, (_, i) => `tag${i}`),
    );
    await expect(
      ideaService.create({ title: '', details: 'x', tags: ['overflow'], status: 'draft' }, userId),
    ).rejects.toThrow(AppError);
  });

  it('creates idea with sortOrder = maxSortOrder + 1', async () => {
    vi.mocked(ideaRepository.countByUser).mockResolvedValue(0);
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue([]);
    vi.mocked(ideaRepository.getMaxSortOrder).mockResolvedValue(5);
    vi.mocked(ideaRepository.create).mockResolvedValue(mockIdea as never);
    await ideaService.create({ title: '', details: 'x', tags: [], status: 'draft' }, userId);
    expect(ideaRepository.create).toHaveBeenCalledWith(expect.any(Object), userId, 6);
  });
});

describe('update', () => {
  it('throws AppError(400) when workspace tag limit is exceeded', async () => {
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue(
      Array.from({ length: WORKSPACE_MAX_TAGS }, (_, i) => `tag${i}`),
    );
    await expect(
      ideaService.update(ideaId, userId, { title: '', details: 'x', tags: ['brandnew'], status: 'draft' }),
    ).rejects.toThrow(AppError);
  });

  it('returns updated idea on success', async () => {
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue([]);
    vi.mocked(ideaRepository.update).mockResolvedValue(mockIdea as never);
    expect(await ideaService.update(ideaId, userId, { title: 'New', details: 'x', tags: [], status: 'draft' })).toEqual(mockIdea);
  });
});

describe('patchPin', () => {
  it('throws AppError(400) when pin limit is reached', async () => {
    vi.mocked(ideaRepository.countPinnedByUser).mockResolvedValue(PIN_LIMIT);
    await expect(ideaService.patchPin(ideaId, userId, true)).rejects.toThrow(AppError);
    expect(ideaRepository.patchPin).not.toHaveBeenCalled();
  });

  it('calls repository when pinning within limit', async () => {
    vi.mocked(ideaRepository.countPinnedByUser).mockResolvedValue(PIN_LIMIT - 1);
    vi.mocked(ideaRepository.patchPin).mockResolvedValue(mockIdea as never);
    await ideaService.patchPin(ideaId, userId, true);
    expect(ideaRepository.patchPin).toHaveBeenCalledWith(ideaId, userId, true);
  });

  it('unpins without checking the pin count', async () => {
    vi.mocked(ideaRepository.patchPin).mockResolvedValue(mockIdea as never);
    await ideaService.patchPin(ideaId, userId, false);
    expect(ideaRepository.countPinnedByUser).not.toHaveBeenCalled();
    expect(ideaRepository.patchPin).toHaveBeenCalledWith(ideaId, userId, false);
  });
});

describe('patchStatus', () => {
  it('delegates to repository', async () => {
    vi.mocked(ideaRepository.patchStatus).mockResolvedValue(mockIdea as never);
    await ideaService.patchStatus(ideaId, userId, 'archived');
    expect(ideaRepository.patchStatus).toHaveBeenCalledWith(ideaId, userId, 'archived');
  });
});

describe('delete', () => {
  it('delegates to repository', async () => {
    vi.mocked(ideaRepository.delete).mockResolvedValue(mockIdea as never);
    await ideaService.delete(ideaId, userId);
    expect(ideaRepository.delete).toHaveBeenCalledWith(ideaId, userId);
  });
});

describe('reorder', () => {
  it('delegates to repository', async () => {
    vi.mocked(ideaRepository.reorder).mockResolvedValue(undefined as never);
    const ids = [new Types.ObjectId().toString()];
    await ideaService.reorder(ids, userId);
    expect(ideaRepository.reorder).toHaveBeenCalledWith(ids, userId);
  });
});

describe('getWorkspaceTags', () => {
  it('returns tag counts from repository', async () => {
    const tags = [{ tag: 'alpha', count: 2 }];
    vi.mocked(ideaRepository.getTagUsageCounts).mockResolvedValue(tags);
    expect(await ideaService.getWorkspaceTags(userId)).toEqual(tags);
  });
});

describe('renameTag', () => {
  it('does nothing when oldTag equals newTag', async () => {
    await ideaService.renameTag(userId, 'same', 'same');
    expect(ideaRepository.getDistinctTagsByUser).not.toHaveBeenCalled();
  });

  it('throws AppError(400) when newTag already exists', async () => {
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue(['existing', 'old']);
    await expect(ideaService.renameTag(userId, 'old', 'existing')).rejects.toThrow(AppError);
  });

  it('throws AppError(404) when oldTag not found', async () => {
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue(['other']);
    await expect(ideaService.renameTag(userId, 'missing', 'newtag')).rejects.toThrow(AppError);
  });

  it('calls repository.renameTag on success', async () => {
    vi.mocked(ideaRepository.getDistinctTagsByUser).mockResolvedValue(['old']);
    vi.mocked(ideaRepository.renameTag).mockResolvedValue(undefined as never);
    await ideaService.renameTag(userId, 'old', 'new');
    expect(ideaRepository.renameTag).toHaveBeenCalledWith(userId, 'old', 'new');
  });
});
