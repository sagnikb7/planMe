import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Check, Pencil, X, Heart } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/context/toast-context';
import { Loader } from '@/components/ui/loader';
import api from '@/lib/api';
import { TAG_MIN_LENGTH, TAG_MAX_LENGTH, WORKSPACE_MAX_TAGS } from '@/lib/constants';

const TAG_PATTERN = /^[a-z][a-z-]*[a-z]$|^[a-z]{2}$/;

function isValidTag(tag) {
  return tag.length >= TAG_MIN_LENGTH && tag.length <= TAG_MAX_LENGTH && TAG_PATTERN.test(tag);
}

function ThemeOption({ value, label, icon: Icon, current, onChange }) {
  const active = current === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-[var(--ds-color-surface-strong)] text-[var(--ds-color-text)]'
          : 'text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)]',
      ].join(' ')}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function TagRow({ entry, allTags, onRenamed }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(entry.tag);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const startEdit = () => {
    setDraftName(entry.tag);
    setError('');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancel = () => {
    setEditing(false);
    setError('');
  };

  const save = async () => {
    const normalized = draftName.trim().toLowerCase();
    if (normalized === entry.tag) { cancel(); return; }
    if (!isValidTag(normalized)) {
      setError('Letters and hyphens only, min 2 chars, cannot start/end with hyphen.');
      return;
    }
    if (allTags.some((t) => t.tag === normalized && t.tag !== entry.tag)) {
      setError(`"${normalized}" already exists in your workspace.`);
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/ideas/tags/${encodeURIComponent(entry.tag)}`, { name: normalized });
      toast(`Renamed "${entry.tag}" to "${normalized}"`);
      onRenamed(entry.tag, normalized);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rename tag');
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') cancel();
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {editing ? (
          <>
            <input
              ref={inputRef}
              className="tag-picker-create-input w-full"
              value={draftName}
              onChange={(e) => { setDraftName(e.target.value); setError(''); }}
              onKeyDown={onKeyDown}
              maxLength={TAG_MAX_LENGTH}
              autoFocus
            />
            {error && <p className="text-xs text-[var(--ds-color-danger)] mt-0.5">{error}</p>}
          </>
        ) : (
          <span className="tag-chip self-start">{entry.tag}</span>
        )}
        <p className="text-xs text-[var(--ds-color-text-soft)] mt-0.5">
          <Link
            to={`/ideas?tag=${encodeURIComponent(entry.tag)}`}
            className="hover:text-[var(--ds-color-text-muted)] transition-colors"
          >
            used in {entry.count} {entry.count === 1 ? 'idea' : 'ideas'}
          </Link>
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="flex items-center justify-center w-7 h-7 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
              aria-label="Save rename"
            >
              {saving ? <Loader /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="flex items-center justify-center w-7 h-7 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
              aria-label="Cancel rename"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center justify-center w-7 h-7 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
            aria-label={`Rename ${entry.tag}`}
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    api.get('/ideas/tags')
      .then((res) => setTags(res.data.tags || []))
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, []);

  const handleRenamed = (oldTag, newTag) => {
    setTags((prev) => prev.map((t) => t.tag === oldTag ? { ...t, tag: newTag } : t));
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="surface-card divide-y divide-[var(--ds-color-border)]">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-[var(--ds-color-text)]">Appearance</p>
            <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">Choose your preferred theme</p>
          </div>
          <div className="flex overflow-hidden rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)]">
            <ThemeOption value="dark" label="Dark" icon={Moon} current={theme} onChange={setTheme} />
            <ThemeOption value="light" label="Light" icon={Sun} current={theme} onChange={setTheme} />
          </div>
        </div>
      </div>

      <div className="surface-card divide-y divide-[var(--ds-color-border)]">
        <div className="px-4 py-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-[var(--ds-color-text)]">Workspace tags</p>
            <span className="text-xs text-[var(--ds-color-text-soft)] font-variant-numeric tabular-nums">
              {tags.length}/{WORKSPACE_MAX_TAGS}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">
            Tags in use across your ideas. Create tags by adding them to an idea. Rename here to update everywhere.
          </p>
        </div>

        {tagsLoading ? (
          <div className="flex items-center justify-center py-8 text-[var(--ds-color-text-muted)]">
            <Loader />
          </div>
        ) : tags.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-[var(--ds-color-text-soft)]">No tags yet.</p>
            <p className="text-xs text-[var(--ds-color-text-soft)] mt-0.5">
              Add tags when{' '}
              <Link to="/ideas/add" className="underline hover:text-[var(--ds-color-text-muted)] transition-colors">
                creating an idea
              </Link>.
            </p>
          </div>
        ) : (
          tags.map((entry) => (
            <TagRow
              key={entry.tag}
              entry={entry}
              allTags={tags}
              onRenamed={handleRenamed}
            />
          ))
        )}
      </div>

      <div className="surface-card px-4 py-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-medium text-[var(--ds-color-text)]">planMe</span>
          <span className="text-xs text-[var(--ds-color-text-soft)] tabular-nums">v2.0.0</span>
        </div>
        <p className="text-xs text-[var(--ds-color-text-muted)] mb-3 leading-relaxed">
          A focused space for capturing and developing your ideas.
        </p>
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-[var(--ds-color-text-soft)]">
          <span className="flex items-center gap-1">
            Made with
            <Heart className="w-3 h-3 text-[var(--ds-color-glow)]" aria-hidden="true" />
            by sagnikbetal
          </span>
          <span aria-hidden="true" className="select-none">·</span>
          <a
            href="https://github.com/sagnikb7/planMe"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-[var(--ds-color-text-muted)] transition-colors"
          >
            GitHub
          </a>
          <span aria-hidden="true" className="select-none">·</span>
          <span>© 2026</span>
        </div>
      </div>
    </div>
  );
}
