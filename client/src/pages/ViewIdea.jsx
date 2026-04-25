import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/context/toast-context';

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

  const contentRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    api.get(`/ideas/${id}`)
      .then((res) => setIdea(res.data))
      .catch(() => setError('This idea could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

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
            <Button asChild variant="ghost" size="sm">
              <Link to={`/ideas/edit/${id}`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            <Button
              variant="ghost-danger"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
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
          </div>

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

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
        <DialogContent>
          <DialogTitle>Delete idea</DialogTitle>
          <DialogDescription>
            This cannot be undone. The idea will be permanently removed.
          </DialogDescription>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost-danger"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <><Loader /> Deleting…</> : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
