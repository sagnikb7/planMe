import { Types } from 'mongoose';
import { IdeaModel, IIdea, IdeaStatus } from '../models/idea.model';
import type { CreateIdeaInput, UpdateIdeaInput } from '../schemas/idea.schema';

export class IdeaRepository {
  async countByUser(userId: Types.ObjectId): Promise<number> {
    return IdeaModel.countDocuments({ user: userId });
  }

  async findAllByUser(userId: Types.ObjectId): Promise<IIdea[]> {
    return IdeaModel.find({ user: userId }).sort({ sortOrder: 1, createdAt: -1 }).lean() as unknown as Promise<IIdea[]>;
  }

  async getMaxSortOrder(userId: Types.ObjectId): Promise<number> {
    const result = await IdeaModel.findOne({ user: userId }).sort({ sortOrder: -1 }).select('sortOrder').lean();
    return result ? (result as unknown as { sortOrder: number }).sortOrder : -1;
  }

  async reorder(ids: string[], userId: Types.ObjectId): Promise<void> {
    const ops = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { sortOrder: index } },
      },
    }));
    if (ops.length > 0) await IdeaModel.bulkWrite(ops);
  }

  async findByIdAndUser(id: string, userId: Types.ObjectId): Promise<IIdea | null> {
    return IdeaModel.findOne({ _id: id, user: userId }).lean() as Promise<IIdea | null>;
  }

  async create(data: CreateIdeaInput, userId: Types.ObjectId, sortOrder: number): Promise<IIdea> {
    return IdeaModel.create({ ...data, user: userId, sortOrder });
  }

  async update(id: string, userId: Types.ObjectId, data: UpdateIdeaInput): Promise<IIdea | null> {
    return IdeaModel.findOneAndUpdate(
      { _id: id, user: userId },
      data,
      { new: true }
    ).lean() as Promise<IIdea | null>;
  }

  async patchStatus(id: string, userId: Types.ObjectId, status: IdeaStatus): Promise<IIdea | null> {
    return IdeaModel.findOneAndUpdate(
      { _id: id, user: userId },
      { status },
      { new: true }
    ).lean() as Promise<IIdea | null>;
  }

  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const result = await IdeaModel.deleteOne({ _id: id, user: userId });
    return result.deletedCount > 0;
  }

  async getDistinctTagsByUser(userId: Types.ObjectId, excludeIdeaId?: string): Promise<string[]> {
    const filter: Record<string, unknown> = { user: userId };
    if (excludeIdeaId) filter['_id'] = { $ne: excludeIdeaId };
    return IdeaModel.distinct('tags', filter);
  }

  async getTagUsageCounts(userId: Types.ObjectId): Promise<{ tag: string; count: number }[]> {
    return IdeaModel.aggregate([
      { $match: { user: userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
      { $sort: { tag: 1 } },
    ]);
  }

  async renameTag(userId: Types.ObjectId, oldTag: string, newTag: string): Promise<void> {
    await IdeaModel.updateMany(
      { user: userId, tags: oldTag },
      [{ $set: { tags: { $map: { input: '$tags', as: 't', in: { $cond: [{ $eq: ['$$t', oldTag] }, newTag, '$$t'] } } } } }],
    );
  }
}

export const ideaRepository = new IdeaRepository();
