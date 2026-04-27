import { Types } from 'mongoose';
import { ideaRepository } from '../repositories/idea.repository';
import type { CreateIdeaInput, UpdateIdeaInput } from '../schemas/idea.schema';
import type { IdeaStatus } from '../models/idea.model';
import { WORKSPACE_MAX_TAGS, IDEA_LIMIT } from '../constants';
import { AppError } from '../utils/errors';

export class IdeaService {
  async getAll(userId: Types.ObjectId) {
    return ideaRepository.findAllByUser(userId);
  }

  async getById(id: string, userId: Types.ObjectId) {
    const idea = await ideaRepository.findByIdAndUser(id, userId);
    if (!idea) return null;
    return idea;
  }

  async getWorkspaceTags(userId: Types.ObjectId): Promise<{ tag: string; count: number }[]> {
    return ideaRepository.getTagUsageCounts(userId);
  }

  async renameTag(userId: Types.ObjectId, oldTag: string, newTag: string): Promise<void> {
    if (oldTag === newTag) return;
    const existing = await ideaRepository.getDistinctTagsByUser(userId);
    if (existing.includes(newTag)) {
      throw new AppError(400, `Tag "${newTag}" already exists in your workspace`);
    }
    if (!existing.includes(oldTag)) {
      throw new AppError(404, `Tag "${oldTag}" not found`);
    }
    await ideaRepository.renameTag(userId, oldTag, newTag);
  }

  async create(data: CreateIdeaInput, userId: Types.ObjectId) {
    const count = await ideaRepository.countByUser(userId);
    if (count >= IDEA_LIMIT) {
      throw new AppError(400, `Idea limit of ${IDEA_LIMIT} reached. Delete some ideas to make room.`);
    }
    await this.enforceWorkspaceTagLimit(data.tags, userId);
    const maxOrder = await ideaRepository.getMaxSortOrder(userId);
    return ideaRepository.create(data, userId, maxOrder + 1);
  }

  async update(id: string, userId: Types.ObjectId, data: UpdateIdeaInput) {
    await this.enforceWorkspaceTagLimit(data.tags, userId, id);
    return ideaRepository.update(id, userId, data);
  }

  async patchStatus(id: string, userId: Types.ObjectId, status: IdeaStatus) {
    return ideaRepository.patchStatus(id, userId, status);
  }

  async delete(id: string, userId: Types.ObjectId) {
    return ideaRepository.delete(id, userId);
  }

  async reorder(ids: string[], userId: Types.ObjectId) {
    return ideaRepository.reorder(ids, userId);
  }

  private async enforceWorkspaceTagLimit(
    incomingTags: string[],
    userId: Types.ObjectId,
    excludeIdeaId?: string,
  ): Promise<void> {
    if (incomingTags.length === 0) return;
    const existing = await ideaRepository.getDistinctTagsByUser(userId, excludeIdeaId);
    const merged = new Set([...existing, ...incomingTags]);
    if (merged.size > WORKSPACE_MAX_TAGS) {
      throw new AppError(
        400,
        `Workspace tag limit of ${WORKSPACE_MAX_TAGS} reached. Remove tags from other ideas before adding new ones.`,
      );
    }
  }
}

export const ideaService = new IdeaService();
