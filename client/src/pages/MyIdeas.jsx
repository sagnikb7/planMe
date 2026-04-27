import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trash2, Plus, Lightbulb, Search, X, Archive,
  List, LayoutGrid, GripVertical, RotateCcw,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import { SORT_OPTIONS, SEARCH_MIN_LENGTH, IDEA_LIMIT } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/context/toast-context';
import { cn } from '@/lib/utils';

const VIEW_KEY = 'planme-view';
const SORT_KEY = 'planme-sort';
const SORT_SHORT = { newest: 'New', updated: 'Upd', oldest: 'Old', 'a-z': 'A–Z', manual: '↕' };

function StatusBadge({ status }) {
  return (
    <span className="status-badge" data-status={status}>
      <span className="status-badge-dot" />
      {status}
    </span>
  );
}

function SortableIdeaRow({ idea, index, sortBy, filterTag, setFilterTag, openActionDialog, onSwipeArchive }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isArchived = idea.status === 'archived';
  const canSwipe = !isArchived && sortBy !== 'manual';

  const touchRef = useRef({ startX: 0, startY: 0 });
  const elRef = useRef(null);

  const setRefs = useCallback((el) => {
    setNodeRef(el);
    elRef.current = el;
  }, [setNodeRef]);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !canSwipe) return;
    const onStart = (e) => {
      touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
    };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = e.changedTouches[0].clientY - touchRef.current.startY;
      if (dx < -72 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipeArchive(idea._id);
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [canSwipe, idea._id, onSwipeArchive]);

  return (
    <div
      ref={setRefs}
      style={{ ...style, animationDelay: `${Math.min(index, 10) * 40}ms` }}
      className={cn('idea-row', isArchived && 'opacity-50')}
    >
      <div className="idea-row-left">
        {sortBy === 'manual' ? (
          <button
            className="idea-drag-handle"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            tabIndex={0}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="idea-index">{String(index + 1).padStart(2, '0')}</span>
        )}
        <span className="idea-date">
          {new Date(idea.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <IdeaBody
        idea={idea}
        filterTag={filterTag}
        setFilterTag={setFilterTag}
        openActionDialog={openActionDialog}
        isArchived={isArchived}
      />
    </div>
  );
}

function SortableIdeaCard({ idea, sortBy, filterTag, setFilterTag, openActionDialog }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isArchived = idea.status === 'archived';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('idea-card', isArchived && 'opacity-50')}
    >
      {sortBy === 'manual' && (
        <button
          className="idea-drag-handle idea-drag-handle--card"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <IdeaBody
        idea={idea}
        filterTag={filterTag}
        setFilterTag={setFilterTag}
        openActionDialog={openActionDialog}
        isArchived={isArchived}
        compact
      />
    </div>
  );
}

function IdeaBody({ idea, filterTag, setFilterTag, openActionDialog, isArchived, compact = false }) {
  const navigate = useNavigate();

  const handleBodyClick = (e) => {
    if (e.target.closest('a, button, [role="button"]')) return;
    navigate(`/ideas/${idea._id}`);
  };

  const date = new Date(idea.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return (
    <div className="idea-row-body cursor-pointer" onClick={handleBodyClick}>
      <div className="idea-title-row">
        <h3 className={cn('idea-title', !idea.title && 'text-[var(--ds-color-text-soft)] italic')}>
          <Link
            to={`/ideas/${idea._id}`}
            className="hover:text-[var(--ds-color-glow)] transition-colors duration-150"
          >
            {idea.title || 'Untitled'}
          </Link>
        </h3>
        {isArchived && <StatusBadge status="archived" />}
      </div>
      <div
        className="idea-preview-rich"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(idea.details) }}
      />
      <div className="idea-meta">
        <div className="idea-meta-left">
          {(idea.tags || []).map((tag) => (
            <button
              key={tag}
              className="tag-chip"
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
          {compact && (
            <span className="idea-card-date">{date}</span>
          )}
        </div>
        <div className="idea-row-actions">
          {isArchived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openActionDialog(idea)}
              aria-label="Restore idea"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost-danger"
            size="sm"
            onClick={() => openActionDialog(idea)}
            aria-label="Delete idea"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyIdeas() {
  const toast = useToast();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem(SORT_KEY) || 'newest');
  const [filterTag, setFilterTag] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'list');
  const [activeId, setActiveId] = useState(null);

  const [pendingIdea, setPendingIdea] = useState(null);

  const reorderTimeoutRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = () => searchRef.current?.focus();
    window.addEventListener('planme:focus-search', handler);
    return () => window.removeEventListener('planme:focus-search', handler);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    api.get('/ideas')
      .then((res) => setIdeas(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load ideas'))
      .finally(() => setLoading(false));
  }, []);

  const persistView = (v) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const persistSort = (key) => {
    setSortBy(key);
    localStorage.setItem(SORT_KEY, key);
  };

  const openActionDialog = (idea) => setPendingIdea(idea);

  const handleSwipeArchive = useCallback(async (ideaId) => {
    try {
      await api.patch(`/ideas/${ideaId}/status`, { status: 'archived' });
      setIdeas((prev) => prev.map((i) => i._id === ideaId ? { ...i, status: 'archived' } : i));
      toast('Idea archived');
    } catch {
      toast('Failed to archive');
    }
  }, [toast]);

  const handleArchive = async () => {
    if (!pendingIdea) return;
    try {
      await api.patch(`/ideas/${pendingIdea._id}/status`, { status: 'archived' });
      setIdeas((prev) => prev.map((i) => i._id === pendingIdea._id ? { ...i, status: 'archived' } : i));
      setPendingIdea(null);
      toast('Idea archived');
    } catch {
      toast('Failed to archive idea');
    }
  };

  const handleRestore = async () => {
    if (!pendingIdea) return;
    try {
      await api.patch(`/ideas/${pendingIdea._id}/status`, { status: 'draft' });
      setIdeas((prev) => prev.map((i) => i._id === pendingIdea._id ? { ...i, status: 'draft' } : i));
      setPendingIdea(null);
      toast('Idea restored');
    } catch {
      toast('Failed to restore idea');
    }
  };

  const handleDelete = async () => {
    if (!pendingIdea) return;
    try {
      await api.delete(`/ideas/${pendingIdea._id}`);
      setIdeas((prev) => prev.filter((i) => i._id !== pendingIdea._id));
      setPendingIdea(null);
      toast('Idea deleted');
    } catch {
      toast('Failed to delete idea');
    }
  };

  const tagCounts = useMemo(() => {
    const counts = {};
    ideas
      .filter((i) => i.status !== 'archived' || showArchived)
      .forEach((i) => (i.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return counts;
  }, [ideas, showArchived]);

  const allTags = [...new Set(
    ideas.filter((i) => i.status !== 'archived' || showArchived).flatMap((i) => i.tags || [])
  )].sort();

  const displayed = ideas
    .filter((idea) => {
      if (!showArchived && idea.status === 'archived') return false;
      if (filterTag && !(idea.tags || []).includes(filterTag)) return false;
      if (query.length < SEARCH_MIN_LENGTH) return true;
      const q = query.toLowerCase();
      const text = `${idea.title} ${(idea.tags || []).join(' ')}`.toLowerCase();
      const detailsText = idea.details?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') ?? '';
      return text.includes(q) || detailsText.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'updated') return new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'a-z') return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

  const archivedCount = ideas.filter((i) => i.status === 'archived').length;
  const atIdeaLimit = ideas.length >= IDEA_LIMIT;

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = displayed.findIndex((i) => i._id === active.id);
    const newIndex = displayed.findIndex((i) => i._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(displayed, oldIndex, newIndex);
    const reorderedIds = reordered.map((i) => i._id);

    setIdeas((prev) => {
      const updatedMap = new Map(reordered.map((idea, idx) => [idea._id, { ...idea, sortOrder: idx }]));
      return prev.map((i) => updatedMap.get(i._id) ?? i);
    });

    clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(() => {
      api.patch('/ideas/reorder', { ids: reorderedIds }).catch(() => {});
    }, 600);
  };

  const activeIdea = activeId ? displayed.find((i) => i._id === activeId) : null;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-[var(--ds-color-text-muted)]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-error flex min-h-[160px] items-center justify-center px-4">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const isDraggable = sortBy === 'manual';

  return (
    <main>
      {ideas.filter((i) => i.status !== 'archived').length === 0 && !showArchived ? (
        <div className="ideas-empty">
          <Lightbulb className="ideas-empty-icon h-8 w-8" />
          {ideas.length === 0 ? (
            <>
              <p className="ideas-empty-text">Your workspace is empty. Start with something on your mind.</p>
              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                {atIdeaLimit ? (
                  <Button variant="spark" disabled title={`Idea limit of ${IDEA_LIMIT} reached`}>
                    <Plus className="w-4 h-4" /> Capture an idea
                  </Button>
                ) : (
                  <Button asChild variant="spark">
                    <Link to="/ideas/add"><Plus className="w-4 h-4" /> Capture an idea</Link>
                  </Button>
                )}
                <p className="text-[11px] text-[var(--ds-color-text-soft)] uppercase tracking-widest">or start from a prompt</p>
                <div className="flex flex-col gap-2 w-full">
                  {[
                    'A problem I keep noticing',
                    'Something I\'ve been putting off',
                    'An idea I keep coming back to',
                  ].map((prompt) => (
                    <Link
                      key={prompt}
                      to={`/ideas/add?title=${encodeURIComponent(prompt)}`}
                      className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-4 py-2.5 text-sm text-[var(--ds-color-text-muted)] text-left transition-colors hover:border-[var(--ds-color-border-strong)] hover:text-[var(--ds-color-text)]"
                    >
                      {prompt} →
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="ideas-empty-text">{archivedCount} idea{archivedCount > 1 ? 's' : ''} archived.</p>
              <div className="flex flex-col items-center gap-3">
                {!atIdeaLimit && (
                  <Button asChild variant="spark">
                    <Link to="/ideas/add"><Plus className="w-4 h-4" /> Capture your next idea</Link>
                  </Button>
                )}
                <button
                  onClick={() => setShowArchived(true)}
                  className="flex items-center gap-1.5 text-xs text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text-muted)] transition-colors"
                >
                  <Archive className="h-3 w-3" />
                  View {archivedCount} archived
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Unified controls row */}
          <div className="flex items-center gap-2 mt-3 mb-2">
            {/* Search — taller on mobile */}
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-color-text-soft)]" />
              <Input
                ref={searchRef}
                className="h-10 sm:h-8 pl-8 text-sm sm:text-xs"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Sort — abbreviated labels on mobile */}
            <div className="flex shrink-0 overflow-hidden rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)]">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => persistSort(key)}
                  className={cn(
                    'px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-colors',
                    sortBy === key
                      ? 'bg-[var(--ds-color-surface-strong)] text-[var(--ds-color-text)]'
                      : 'text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)]'
                  )}
                >
                  <span className="sm:hidden">{SORT_SHORT[key]}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* View toggle — desktop only (single column on mobile = no difference) */}
            <div className="hidden sm:flex shrink-0 overflow-hidden rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)]">
              <button
                onClick={() => persistView('list')}
                className={cn(
                  'flex items-center justify-center px-2 py-1.5 transition-colors',
                  view === 'list'
                    ? 'bg-[var(--ds-color-surface-strong)] text-[var(--ds-color-text)]'
                    : 'text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)]'
                )}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => persistView('grid')}
                className={cn(
                  'flex items-center justify-center px-2 py-1.5 transition-colors',
                  view === 'grid'
                    ? 'bg-[var(--ds-color-surface-strong)] text-[var(--ds-color-text)]'
                    : 'text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)]'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Archive toggle — desktop inline, mobile below */}
            {archivedCount > 0 && (
              <button
                onClick={() => setShowArchived((v) => !v)}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 text-xs shrink-0 transition-colors',
                  showArchived
                    ? 'text-[var(--ds-color-text-muted)]'
                    : 'text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text-muted)]'
                )}
              >
                <Archive className="h-3 w-3" />
                {showArchived ? 'Hide archived' : `${archivedCount} archived`}
              </button>
            )}

            {/* New idea — icon+label on desktop, icon-only on mobile */}
            {atIdeaLimit ? (
              <Button variant="spark" size="sm" disabled className="shrink-0 h-10 sm:h-[var(--ds-size-control-sm)]" title={`Idea limit of ${IDEA_LIMIT} reached`}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New idea</span>
              </Button>
            ) : (
              <Button asChild variant="spark" size="sm" className="shrink-0 h-10 sm:h-[var(--ds-size-control-sm)]">
                <Link to="/ideas/add">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New idea</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Archive toggle row — mobile only */}
          {archivedCount > 0 && (
            <div className="flex sm:hidden mb-2">
              <button
                onClick={() => setShowArchived((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 text-xs transition-colors',
                  showArchived
                    ? 'text-[var(--ds-color-text-muted)]'
                    : 'text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text-muted)]'
                )}
              >
                <Archive className="h-3 w-3" />
                {showArchived ? 'Hide archived' : `${archivedCount} archived`}
              </button>
            </div>
          )}

          {/* Tags — horizontal scroll on mobile, wrap on desktop */}
          {allTags.length > 0 && (
            <div className="flex overflow-x-auto gap-1.5 mb-3 mt-1 pb-0.5 flex-nowrap sm:flex-wrap">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  className={cn(
                    'tag-chip transition-opacity shrink-0',
                    filterTag && filterTag !== tag && 'opacity-40'
                  )}
                  style={filterTag === tag ? { outline: '1px solid var(--ds-color-glow)' } : {}}
                >
                  {tag}
                  {tagCounts[tag] > 0 && (
                    <span className="ml-1 opacity-50 text-[10px]">{tagCounts[tag]}</span>
                  )}
                  {filterTag === tag && <X className="w-2.5 h-2.5 ml-0.5" />}
                </button>
              ))}
            </div>
          )}

          {displayed.length === 0 ? (
            <div className="ideas-empty">
              <p className="ideas-empty-text">
                {filterTag ? `No ideas tagged "${filterTag}"` : `No ideas match "${query}"`}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayed.map((i) => i._id)}
                strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
              >
                {view === 'list' ? (
                  <div className="ideas-list">
                    {displayed.map((idea, index) => (
                      <SortableIdeaRow
                        key={idea._id}
                        idea={idea}
                        index={index}
                        sortBy={sortBy}
                        filterTag={filterTag}
                        setFilterTag={setFilterTag}
                        openActionDialog={openActionDialog}
                        onSwipeArchive={handleSwipeArchive}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="ideas-grid">
                    {displayed.map((idea) => (
                      <SortableIdeaCard
                        key={idea._id}
                        idea={idea}
                        sortBy={sortBy}
                        filterTag={filterTag}
                        setFilterTag={setFilterTag}
                        openActionDialog={openActionDialog}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>

              <DragOverlay>
                {activeIdea ? (
                  <div className={cn(view === 'grid' ? 'idea-card idea-card--dragging' : 'idea-row idea-row--dragging')}>
                    <span className="idea-title">{activeIdea.title || 'Untitled'}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      <Dialog open={!!pendingIdea} onOpenChange={(open) => !open && setPendingIdea(null)}>
        <DialogContent>
          <DialogTitle>
            {pendingIdea?.status === 'archived' ? 'Archived idea' : 'Remove idea'}
          </DialogTitle>
          <DialogDescription>
            {pendingIdea?.status === 'archived'
              ? 'Restore brings it back to drafts. Permanent delete cannot be undone.'
              : 'Archive keeps the idea hidden but recoverable. Permanent delete cannot be undone.'}
          </DialogDescription>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setPendingIdea(null)}
            >
              Cancel
            </Button>
            {pendingIdea?.status === 'archived' ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto flex items-center gap-1.5"
                onClick={handleRestore}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto flex items-center gap-1.5"
                onClick={handleArchive}
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </Button>
            )}
            <Button
              variant="ghost-danger"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleDelete}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
