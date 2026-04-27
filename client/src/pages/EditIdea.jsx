import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Archive } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import db from '@/lib/db';
import { isOfflineError } from '@/lib/sync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { TITLE_MAX_LENGTH } from '@/lib/constants';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { RichEditor } from '@/components/ui/rich-editor';
import { TagPicker } from '@/components/ui/tag-picker';
import { StatusSelect } from '@/components/ui/status-select';

const schema = z.object({
  title: z.string().max(TITLE_MAX_LENGTH).optional().default(''),
});

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function EditIdea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState('');
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState('draft');
  const [detailsError, setDetailsError] = useState('');
  const [workspaceTags, setWorkspaceTags] = useState([]);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  });
  const titleValue = watch('title') ?? '';

  useEffect(() => {
    const populate = (idea) => {
      reset({ title: idea.title });
      setDetails(idea.details || '');
      setTags(idea.tags || []);
      setStatus(idea.status || 'draft');
    };

    Promise.all([
      api.get(`/ideas/${id}`),
      api.get('/ideas/tags'),
    ])
      .then(([ideaRes, tagsRes]) => {
        populate(ideaRes.data);
        setWorkspaceTags((tagsRes.data.tags || []).map((t) => t.tag));
      })
      .catch(async (err) => {
        if (isOfflineError(err)) {
          const cached = await db.ideas.get(id);
          if (cached) {
            populate(cached);
            return;
          }
        }
        setError('root', { message: err.response?.data?.error || 'Failed to load idea' });
      })
      .finally(() => setLoading(false));
  }, [id, reset, setError]);

  const saveLocally = async (payload) => {
    const now = new Date().toISOString();
    const existing = await db.ideas.get(id);
    await db.ideas.put({
      ...(existing || {}),
      _id: id,
      ...payload,
      syncStatus: 'pending-update',
      updatedAt: now,
    });
    const existingQueueEntry = await db.pendingQueue
      .where('ideaId').equals(id)
      .filter((op) => op.type === 'pending-create' || op.type === 'pending-update')
      .first();
    if (existingQueueEntry) {
      await db.pendingQueue.update(existingQueueEntry.id, { payload, createdAt: now });
    } else {
      await db.pendingQueue.add({ type: 'pending-update', ideaId: id, payload, createdAt: now });
    }
    toast('Saved locally — will sync when you reconnect');
    navigate('/ideas');
  };

  const onSubmit = async (data) => {
    if (!stripHtml(details)) {
      setDetailsError('Add at least a sentence.');
      return;
    }
    setDetailsError('');
    const payload = { ...data, details, tags, status };
    if (!isOnline) {
      await saveLocally(payload);
      return;
    }
    try {
      await api.put(`/ideas/${id}`, payload);
      toast('Idea updated');
      navigate('/ideas');
    } catch (err) {
      if (isOfflineError(err)) {
        await saveLocally(payload);
        return;
      }
      setError('root', { message: 'Failed to update idea' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Edit idea</CardTitle>
          <p className="text-sm text-[var(--ds-color-text-muted)]">Tighten the framing, remove noise, and keep the idea easy to revisit later.</p>
          {status === 'archived' && (
            <div className="mt-2 flex items-center gap-2 rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-strong)] px-3 py-2 text-xs text-[var(--ds-color-text-muted)]">
              <Archive className="h-3.5 w-3.5 flex-shrink-0" />
              This idea is archived. Change the Stage field to restore it.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="edit-form">
            {errors.root && (
              <p className="feedback-error px-3 py-2 text-sm">{errors.root.message}</p>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title</Label>
                <span className="text-xs text-[var(--ds-color-text-soft)]">{titleValue.length}/{TITLE_MAX_LENGTH}</span>
              </div>
              <Input id="title" disabled={loading} maxLength={TITLE_MAX_LENGTH} {...register('title')} />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <StatusSelect value={status} onChange={setStatus} disabled={loading} />
            </div>
            {/* Tiptap re-mounts when the idea loads so content pre-fills correctly */}
            <div className="space-y-1.5">
              <Label>Details</Label>
              {loading ? (
                <div className="rich-editor flex items-center justify-center" style={{ minHeight: '9rem' }}>
                  <Loader />
                </div>
              ) : (
                <RichEditor
                  key={id}
                  content={details}
                  onChange={(html) => { setDetails(html); if (detailsError) setDetailsError(''); }}
                />
              )}
              {detailsError && <p className="text-xs text-[var(--ds-color-danger)]">{detailsError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagPicker value={tags} onChange={setTags} workspaceTags={workspaceTags} disabled={loading} />
            </div>
          </form>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" form="edit-form" disabled={isSubmitting || loading}>
            {loading ? <><Loader /> Loading</> : isSubmitting ? <><Loader /> Updating</> : 'Update idea'}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/ideas">Cancel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
