import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SessionList } from '@/components/SessionList';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import api from '@/lib/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

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
        <p className="text-base font-semibold text-[var(--ds-color-text)]">{user?.name}</p>
        <p className="mt-1 text-sm text-[var(--ds-color-text-muted)]">{user?.email}</p>
        <span className="mt-3 inline-block rounded-full bg-[var(--ds-color-surface-strong)] px-3 py-1 text-xs text-[var(--ds-color-text-soft)]">
          Member since {joined}
        </span>
      </div>

      {/* Sign out */}
      <div className="surface-card px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--ds-color-text)]">Sign out</p>
          <p className="text-xs text-[var(--ds-color-text-muted)]">Ends your current session on this device.</p>
        </div>
        <Button
          variant="ghost-danger"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5"
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
