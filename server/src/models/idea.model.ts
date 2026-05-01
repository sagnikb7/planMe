import { Schema, model, Document, Types } from 'mongoose';
import { IDEA_STATUSES, IdeaStatus } from '../constants';

export type { IdeaStatus };

export interface IIdea extends Document {
  _id: Types.ObjectId;
  title: string;
  details: string;
  tags: string[];
  status: IdeaStatus;
  pinned: boolean;
  sortOrder: number;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ideaSchema = new Schema<IIdea>(
  {
    title: { type: String, default: '' },
    details: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: { type: String, enum: IDEA_STATUSES, default: 'draft' },
    pinned: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const IdeaModel = model<IIdea>('Idea', ideaSchema);
