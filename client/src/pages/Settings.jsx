import '../components/ui/tag-picker.css';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Keyboard, Moon, Sun, Check, Pencil, X, Heart, WifiOff, Smartphone } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/context/toast-context';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import api from '@/lib/api';
import { TAG_MIN_LENGTH, TAG_MAX_LENGTH, WORKSPACE_MAX_TAGS } from '@/lib/constants';

const TAG_PATTERN = /^[a-z][a-z-]*[a-z]$|^[a-z]{2}$/;

function isValidTag(tag) {
  return tag.length >= TAG_MIN_LENGTH && tag.length <= TAG_MAX_LENGTH && TAG_PATTERN.test(tag);
}

function SectionLabel({ children }) {
  return (
    <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-color-text-soft)]">
      {children}
    </p>
  );
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
  const toast = useToast();
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [ideaCount, setIdeaCount] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setInstallPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); setInstallPrompt(null); }
  };

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/ideas/tags')
      .then((res) => setTags(res.data.tags || []))
      .catch(() => {})
      .finally(() => setTagsLoading(false));
    api.get('/ideas')
      .then((res) => setIdeaCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setIdeaCount(0));
  }, []);

  const handleRenamed = (oldTag, newTag) => {
    setTags((prev) => prev.map((t) => t.tag === oldTag ? { ...t, tag: newTag } : t));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/ideas');
      setIdeaCount(Array.isArray(res.data) ? res.data.length : 0);
      const date = new Date().toISOString().slice(0, 10);
      const payload = { exported: date, ideas: res.data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planme-ideas-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Export failed — please try again');
    } finally {
      setExporting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setSavingPwd(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      toast('Password updated');
      setCurrentPwd('');
      setNewPwd('');
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">

      {/* App / PWA */}
      <div className="space-y-2">
        <SectionLabel>App</SectionLabel>
        <div className="surface-card divide-y divide-[var(--ds-color-border)]">
          {/* Offline support — always visible */}
          <div className="flex items-start gap-3 px-4 py-4">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-glow-soft)] text-[var(--ds-color-glow)]">
              <WifiOff className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--ds-color-text)]">Offline support</p>
              <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">
                Create and read ideas without an internet connection. Changes sync automatically when you reconnect.
              </p>
            </div>
          </div>

          {/* Install to home screen */}
          {(installPrompt || installed) && (
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-surface-strong)] text-[var(--ds-color-text-muted)]">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--ds-color-text)]">Add to home screen</p>
                  <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">
                    Install planMe as a standalone app for faster access.
                  </p>
                </div>
              </div>
              {installed ? (
                <span className="flex items-center gap-1 shrink-0 text-xs text-[var(--ds-color-text-soft)]">
                  <Check className="h-3.5 w-3.5 text-[#16a34a]" /> Installed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 shrink-0 rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--ds-color-text-muted)] transition-colors hover:bg-[var(--ds-color-accent-soft)] hover:text-[var(--ds-color-text)]"
                >
                  Install
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-2">
        <SectionLabel>Preferences</SectionLabel>
        <div className="surface-card">
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
      </div>

      {/* Workspace */}
      <div className="space-y-2">
        <SectionLabel>Workspace</SectionLabel>
        <div className="surface-card divide-y divide-[var(--ds-color-border)]">
          {/* Tags */}
          <div className="px-4 py-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-[var(--ds-color-text)]">Tags</p>
              <span className="text-xs text-[var(--ds-color-text-soft)] tabular-nums">
                {tags.length}/{WORKSPACE_MAX_TAGS}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">
              Tags in use across your ideas. Rename here to update everywhere.
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

          {/* Export */}
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--ds-color-text)]">Export ideas</p>
              <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">Download all your ideas as a JSON file.</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || ideaCount === 0}
              title={ideaCount === 0 ? 'No ideas to export' : undefined}
              className="flex items-center gap-1.5 rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--ds-color-text-muted)] transition-colors hover:bg-[var(--ds-color-accent-soft)] hover:text-[var(--ds-color-text)] disabled:pointer-events-none disabled:opacity-40 shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="space-y-2">
        <SectionLabel>Account</SectionLabel>
        <div className="surface-card divide-y divide-[var(--ds-color-border)]">
          {/* Change password */}
          <div className="px-4 py-4">
            <p className="text-sm font-medium text-[var(--ds-color-text)]">Change password</p>
            <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">Enter your current password, then choose a new one.</p>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              <div className="flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPwd}
                  onChange={(e) => { setCurrentPwd(e.target.value); setPwdError(''); }}
                  className="tag-picker-create-input w-full"
                  autoComplete="current-password"
                  required
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPwd}
                  onChange={(e) => { setNewPwd(e.target.value); setPwdError(''); }}
                  className="tag-picker-create-input w-full"
                  autoComplete="new-password"
                  required
                />
              </div>
              {pwdError && <p className="text-xs text-[var(--ds-color-danger)]">{pwdError}</p>}
              <button
                type="submit"
                disabled={savingPwd || !currentPwd || !newPwd}
                className="flex items-center gap-1.5 rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--ds-color-text-muted)] transition-colors hover:bg-[var(--ds-color-accent-soft)] hover:text-[var(--ds-color-text)] disabled:pointer-events-none disabled:opacity-40"
              >
                {savingPwd ? <><Loader /> Saving…</> : 'Update password'}
              </button>
            </form>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--ds-color-text)]">Delete account</p>
              <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">Permanently removes your account and all ideas.</p>
            </div>
            <button
              type="button"
              onClick={() => { setDeleteConfirm(''); setShowDeleteDialog(true); }}
              className="flex items-center gap-1.5 rounded-[var(--ds-radius-sm)] px-3 py-1.5 text-xs font-medium text-[var(--ds-color-danger)] transition-colors hover:bg-[var(--ds-color-danger-soft)] shrink-0"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts — visible on mobile where sidebar button isn't */}
      <div className="surface-card divide-y divide-[var(--ds-color-border)] overflow-hidden md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-[var(--ds-color-text)]">Keyboard shortcuts</p>
            <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">Works when a keyboard is connected.</p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('planme:shortcuts-open'))}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] transition-colors hover:bg-[var(--ds-color-surface-strong)] hover:text-[var(--ds-color-text)]"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* About — no card, just footer text */}
      <div className="px-1 pb-2">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-medium text-[var(--ds-color-text-soft)]">planMe</span>
          <span className="text-xs text-[var(--ds-color-text-soft)] tabular-nums">v{__APP_VERSION__}</span>
        </div>
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

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => { if (!open) setShowDeleteDialog(false); }}
        title="Delete account"
        description={<>This will permanently delete your account and all your ideas. Type <strong>delete</strong> to confirm.</>}
        confirmLabel="Delete permanently"
        loading={deleting}
        confirmDisabled={deleteConfirm !== 'delete'}
        onConfirm={handleDeleteAccount}
      >
        <input
          type="text"
          className="tag-picker-create-input w-full mb-4"
          placeholder="Type delete to confirm"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          autoFocus
        />
      </ConfirmDialog>
    </div>
  );
}
