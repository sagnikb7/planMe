import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import db from '@/lib/db';
import { isOfflineError } from '@/lib/sync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { TITLE_MAX_LENGTH, PROMPT_TEMPLATES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { RichEditor } from '@/components/ui/rich-editor';
import { TagPicker } from '@/components/ui/tag-picker';
import { useToast } from '@/context/toast-context';

const schema = z.object({
  title: z.string().max(TITLE_MAX_LENGTH).optional().default(''),
});

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function AddIdea() {
  const navigate = useNavigate();
  const toast = useToast();
  const isOnline = useOnlineStatus();
  const [searchParams] = useSearchParams();
  const prefillTitle = searchParams.get('title') || '';
  const prefillTemplate = PROMPT_TEMPLATES.find((t) => t.key === searchParams.get('template'));
  const [details, setDetails] = useState(prefillTemplate?.details ?? '');
  const [tags, setTags] = useState([]);
  const [detailsError, setDetailsError] = useState('');
  const [workspaceTags, setWorkspaceTags] = useState([]);

  useEffect(() => {
    api.get('/ideas/tags').then((res) => setWorkspaceTags((res.data.tags || []).map((t) => t.tag))).catch(() => {});
  }, []);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: prefillTitle },
  });
  const titleValue = watch('title') ?? '';

  const saveLocally = async (payload) => {
    const localId = `local_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await db.ideas.put({
      _id: localId,
      ...payload,
      syncStatus: 'pending-create',
      createdAt: now,
      updatedAt: now,
    });
    await db.pendingQueue.add({
      type: 'pending-create',
      ideaId: localId,
      payload,
      createdAt: now,
    });
    toast('Saved locally — will sync when you reconnect');
    navigate('/ideas');
  };

  const onSubmit = async (data) => {
    if (!stripHtml(details)) {
      setDetailsError('Add at least a sentence.');
      return;
    }
    setDetailsError('');
    const payload = { ...data, details, tags, status: 'draft' };
    if (!isOnline) {
      await saveLocally(payload);
      return;
    }
    try {
      await api.post('/ideas', payload);
      toast('Idea saved');
      navigate('/ideas');
    } catch (err) {
      if (isOfflineError(err)) {
        await saveLocally(payload);
        return;
      }
      setError('root', { message: err.response?.data?.error || 'Failed to save idea' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="w-full">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="idea-form">
            {errors.root && (
              <p className="feedback-error px-3 py-2 text-sm">{errors.root.message}</p>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title</Label>
                <span className="text-xs text-[var(--ds-color-text-soft)]">{titleValue.length}/{TITLE_MAX_LENGTH}</span>
              </div>
              <Input id="title" placeholder="Give your idea a title (optional)" maxLength={TITLE_MAX_LENGTH} {...register('title')} />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <RichEditor
                content={details}
                onChange={(html) => { setDetails(html); if (detailsError) setDetailsError(''); }}
              />
              {detailsError && <p className="text-xs text-[var(--ds-color-danger)]">{detailsError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagPicker value={tags} onChange={setTags} workspaceTags={workspaceTags} />
            </div>
          </form>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" form="idea-form" disabled={isSubmitting}>
            {isSubmitting ? <><Loader /> Saving</> : 'Save idea'}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/ideas">Cancel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
