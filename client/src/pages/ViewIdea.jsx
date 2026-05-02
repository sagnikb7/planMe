import './ViewIdea.css';
import { useState, useEffect, useRef, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArrowLeft, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/context/toast-context';

function wordCount(html) {
  if (!html) return 0;
  return (html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().match(/\S+/g) || []).length;
}

function StatusBadge({ status }) {
  return (
    <span className="status-badge" data-status={status}>
      <span className="status-badge-dot" />
      {status}
    </span>
  );
}

export default function ViewIdea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [allIdeas, setAllIdeas] = useState([]);

  const contentRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    api.get(`/ideas/${id}`)
      .then((res) => setIdea(res.data))
      .catch(() => setError('This idea could not be found.'))
      .finally(() => setLoading(false));
    api.get('/ideas').then((res) => setAllIdeas(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'e' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;
      navigate(`/ideas/edit/${id}`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/ideas/${id}`);
      toast('Idea deleted');
      navigate('/ideas');
    } catch {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await api.patch(`/ideas/${id}/status`, { status: 'draft' });
      setIdea((prev) => ({ ...prev, status: 'draft' }));
      toast('Idea restored');
    } catch {
      toast('Failed to restore idea');
    } finally {
      setRestoring(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await api.patch(`/ideas/${id}/status`, { status: 'archived' });
      setIdea((prev) => ({ ...prev, status: 'archived' }));
      toast('Idea archived');
    } catch {
      toast('Failed to archive idea');
    } finally {
      setArchiving(false);
    }
  };

  const handleCheckboxClick = (e) => {
    if (e.target.type !== 'checkbox') return;

    const allCheckboxes = Array.from(
      contentRef.current.querySelectorAll('li[data-type="taskItem"] input[type="checkbox"]')
    );
    const idx = allCheckboxes.indexOf(e.target);
    if (idx === -1) return;

    const isChecked = e.target.checked;
    const { title, tags, status } = idea;

    const parser = new DOMParser();
    const doc = parser.parseFromString(idea.details, 'text/html');
    const taskItems = doc.querySelectorAll('li[data-type="taskItem"]');

    if (taskItems[idx]) {
      taskItems[idx].setAttribute('data-checked', String(isChecked));
      const cb = taskItems[idx].querySelector('input[type="checkbox"]');
      if (cb) {
        isChecked ? cb.setAttribute('checked', '') : cb.removeAttribute('checked');
      }
    }

    const newDetails = doc.body.innerHTML;
    setIdea((prev) => ({ ...prev, details: newDetails }));

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      api.put(`/ideas/${id}`, {
        title: title || '',
        details: newDetails,
        tags: tags || [],
        status: status || 'draft',
      }).catch(() => {});
    }, 800);
  };

  const createdAt = idea?.createdAt
    ? new Date(idea.createdAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const words = useMemo(() => wordCount(idea?.details), [idea?.details]);
  const readTime = words > 50 ? `~${Math.ceil(words / 200)} min read` : null;

  const wasEdited = idea?.updatedAt && idea?.createdAt
    && new Date(idea.updatedAt) - new Date(idea.createdAt) > 60_000;
  const editedAt = wasEdited
    ? new Date(idea.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const relatedIdeas = useMemo(() => {
    if (!idea?.tags?.length || !allIdeas.length) return [];
    return allIdeas
      .filter((i) => i._id !== id && i.status !== 'archived' && (i.tags || []).some((t) => idea.tags.includes(t)))
      .slice(0, 3);
  }, [idea, allIdeas, id]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/ideas"
          className="flex items-center gap-1.5 text-sm text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ideas
        </Link>

        {idea && (
          <div className="flex items-center gap-2">
            {idea.status === 'archived' ? (
              <>
                <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoring}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {restoring ? 'Restoring…' : 'Restore'}
                </Button>
                <Button variant="ghost-danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/ideas/edit/${id}`}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleArchive} disabled={archiving}>
                  <Archive className="h-3.5 w-3.5" />
                  {archiving ? 'Archiving…' : 'Archive'}
                </Button>
                <Button variant="ghost-danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="surface-card flex min-h-[200px] items-center justify-center p-8">
          <Loader />
        </div>
      )}

      {error && (
        <div className="feedback-error px-4 py-3 text-sm">{error}</div>
      )}

      {idea && (
        <div className="surface-card p-8">
          <h1 className={idea.title ? 'idea-view-title' : 'idea-view-title text-[var(--ds-color-text-soft)] italic'}>
            {idea.title || 'Untitled'}
          </h1>

          <div className="mt-3 mb-6 flex flex-wrap items-center gap-2">
            {idea.status === 'archived' && <StatusBadge status="archived" />}
            {(idea.tags || []).map((tag) => (
              <span key={tag} className="tag-chip pointer-events-none">{tag}</span>
            ))}
            {createdAt && (
              <span className="text-xs text-[var(--ds-color-text-soft)]">· {createdAt}</span>
            )}
            {editedAt && (
              <span className="text-xs text-[var(--ds-color-text-soft)]">· edited {editedAt}</span>
            )}
            {readTime && (
              <span className="text-xs text-[var(--ds-color-text-soft)]">· {readTime}</span>
            )}
          </div>

          {idea.status === 'archived' && (
            <div className="mb-6 flex items-center gap-2 rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-strong)] px-3 py-2 text-sm text-[var(--ds-color-text-muted)]">
              <Archive className="h-3.5 w-3.5 flex-shrink-0" />
              This idea is archived — it won't appear in your active list.
            </div>
          )}

          {idea.details ? (
            <div
              ref={contentRef}
              className="idea-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(idea.details) }}
              onClick={handleCheckboxClick}
            />
          ) : (
            <p className="text-sm text-[var(--ds-color-text-soft)] italic">No details added.</p>
          )}
        </div>
      )}

      {/* Related ideas */}
      {relatedIdeas.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-color-text-soft)]">
            Related ideas
          </p>
          <div className="space-y-1.5">
            {relatedIdeas.map((related) => (
              <Link
                key={related._id}
                to={`/ideas/${related._id}`}
                className="flex items-center gap-2 rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-3 py-2.5 text-sm text-[var(--ds-color-text-muted)] transition-colors hover:border-[var(--ds-color-border-strong)] hover:text-[var(--ds-color-text)]"
              >
                <span className="min-w-0 flex-1 truncate">{related.title || 'Untitled'}</span>
                <span className="flex shrink-0 gap-1">
                  {(related.tags || []).filter((t) => idea.tags.includes(t)).map((t) => (
                    <span key={t} className="tag-chip pointer-events-none">{t}</span>
                  ))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && setShowDeleteDialog(false)}
        title="Delete idea"
        description="This cannot be undone. The idea will be permanently removed."
        confirmLabel="Delete permanently"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
