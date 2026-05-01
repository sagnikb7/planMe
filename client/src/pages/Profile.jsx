import '../components/ui/tag-picker.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LogOut, Pencil, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SessionList } from '@/components/SessionList';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import api from '@/lib/api';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const nameInputRef = useRef(null);

  const startEditName = () => {
    setNameInput(user?.name || '');
    setNameError('');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setNameError('');
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) { setNameError('Name must be at least 2 characters.'); return; }
    if (trimmed === user?.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await api.patch('/auth/me', { name: trimmed });
      updateUser({ name: trimmed });
      setEditingName(false);
    } catch {
      setNameError('Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const onNameKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveName(); }
    if (e.key === 'Escape') cancelEditName();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const [ideasStats, setIdeasStats] = useState(null);

  useEffect(() => {
    api.get('/ideas')
      .then((res) => {
        const ideas = res.data;
        setIdeasStats({
          active: ideas.filter((i) => i.status !== 'archived').length,
          archived: ideas.filter((i) => i.status === 'archived').length,
        });
      })
      .catch(() => {});
  }, []);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');

  const loadSessions = useCallback(() => {
    setSessionsLoading(true);
    setSessionsError('');
    api.get('/sessions/me')
      .then((res) => setSessions(res.data.sessions))
      .catch(() => setSessionsError('Failed to load sessions'))
      .finally(() => setSessionsLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleTerminate = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setSessionsError('Failed to terminate session');
    }
  };

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })
    : '—';

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PM';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Identity card */}
      <div className="surface-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ds-color-surface-strong)] text-xl font-semibold text-[var(--ds-color-text)] ring-2 ring-[var(--ds-color-glow-ring)]">
          {initials}
        </div>
        <div className="flex items-center justify-center gap-2">
          {editingName ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <input
                  ref={nameInputRef}
                  className="tag-picker-create-input text-center text-sm font-semibold"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
                  onKeyDown={onNameKeyDown}
                  maxLength={64}
                  autoFocus
                />
                <button
                  type="button"
                  disabled={savingName}
                  onClick={handleSaveName}
                  className="flex items-center justify-center w-7 h-7 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
                  aria-label="Save name"
                >
                  {savingName ? <Loader /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={cancelEditName}
                  className="flex items-center justify-center w-7 h-7 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
                  aria-label="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {nameError && <p className="text-xs text-[var(--ds-color-danger)]">{nameError}</p>}
            </div>
          ) : (
            <>
              <p className="text-base font-semibold text-[var(--ds-color-text)]">{user?.name}</p>
              <button
                type="button"
                onClick={startEditName}
                className="flex items-center justify-center w-6 h-6 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
                aria-label="Edit name"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--ds-color-text-muted)]">{user?.email}</p>
        <span className="mt-3 inline-block rounded-full bg-[var(--ds-color-surface-strong)] px-3 py-1 text-xs text-[var(--ds-color-text-soft)]">
          Member since {joined}
        </span>
        {ideasStats !== null && (
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-[var(--ds-color-text-soft)]">
            <span>
              <span className="font-medium text-[var(--ds-color-text)]">{ideasStats.active}</span> active
            </span>
            <span>·</span>
            <span>
              <span className="font-medium text-[var(--ds-color-text)]">{ideasStats.archived}</span> archived
            </span>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="surface-card px-5 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--ds-color-text)]">Sign out</p>
          <p className="text-xs text-[var(--ds-color-text-muted)]">Ends your current session on this device.</p>
        </div>
        <Button
          variant="ghost-danger"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="self-start sm:self-auto"
        >
          {loggingOut ? <Loader /> : <LogOut className="h-4 w-4" />}
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>

      {/* Sessions section */}
      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--ds-color-text)]">Active sessions</h2>
          <button
            onClick={loadSessions}
            className="text-xs text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text)]"
          >
            Refresh
          </button>
        </div>
        <SessionList
          sessions={sessions}
          loading={sessionsLoading}
          error={sessionsError}
          onTerminate={handleTerminate}
          showConfirm
          hideCurrentTerminate
        />
      </div>
    </div>
  );
}
