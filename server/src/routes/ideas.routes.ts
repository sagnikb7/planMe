import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ensureAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createIdeaSchema, updateIdeaSchema, patchIdeaStatusSchema, reorderIdeasSchema, renameTagSchema, tagSchema } from '../schemas/idea.schema';
import { ideaService } from '../services/idea.service';
import { AppError } from '../utils/errors';
import { WORKSPACE_MAX_TAGS } from '../constants';

const router = Router();
router.use(ensureAuthenticated);

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

function validateId(req: Request, res: Response, next: NextFunction): void {
  if (!isValidObjectId(req.params.id as string)) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    const ideas = await ideaService.getAll(req.user!._id);
    res.json(ideas);
  } catch {
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

router.get('/tags', async (req, res) => {
  try {
    const tags = await ideaService.getWorkspaceTags(req.user!._id);
    res.json({ tags, limit: WORKSPACE_MAX_TAGS });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.patch('/tags/:tag', validate(renameTagSchema), async (req, res) => {
  const oldTag = req.params.tag;
  const parsed = tagSchema.safeParse(oldTag);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid tag name' });
    return;
  }
  try {
    await ideaService.renameTag(req.user!._id, parsed.data, req.body.name);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: 'Failed to rename tag' });
  }
});

router.patch('/reorder', validate(reorderIdeasSchema), async (req, res) => {
  try {
    await ideaService.reorder(req.body.ids, req.user!._id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to reorder ideas' });
  }
});

router.get('/:id', validateId, async (req, res) => {
  try {
    const idea = await ideaService.getById(req.params.id as string, req.user!._id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json(idea);
  } catch {
    res.status(500).json({ error: 'Failed to fetch idea' });
  }
});

router.post('/', validate(createIdeaSchema), async (req, res) => {
  try {
    const idea = await ideaService.create(req.body, req.user!._id);
    res.status(201).json(idea);
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

router.put('/:id', validateId, validate(updateIdeaSchema), async (req, res) => {
  try {
    const idea = await ideaService.update(req.params.id as string, req.user!._id, req.body);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json(idea);
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

router.patch('/:id/status', validateId, validate(patchIdeaStatusSchema), async (req, res) => {
  try {
    const idea = await ideaService.patchStatus(req.params.id as string, req.user!._id, req.body.status);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json(idea);
  } catch {
    res.status(500).json({ error: 'Failed to update idea status' });
  }
});

router.delete('/:id', validateId, async (req, res) => {
  try {
    const deleted = await ideaService.delete(req.params.id as string, req.user!._id);
    if (!deleted) return res.status(404).json({ error: 'Idea not found' });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

export default router;
