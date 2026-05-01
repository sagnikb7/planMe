import './auth-layout.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { SessionList } from '@/components/SessionList';
import api from '@/lib/api';

export default function SessionLimit() {
  const { pendingSessions, resolveSession, clearPending } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState(pendingSessions || []);
  const [loading, setLoading] = useState(!pendingSessions);
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!pendingSessions) {
      // Reload if navigated here directly without pending session context
      api.get('/sessions')
        .then((res) => setSessions(res.data.sessions))
        .catch(() => setError('Failed to load sessions'))
        .finally(() => setLoading(false));
    }
  }, [pendingSessions]);

  const handleTerminate = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setResolved(true);
    } catch {
      setError('Failed to terminate session');
    }
  };

  const handleContinue = async () => {
    setResolving(true);
    setError('');
    try {
      await resolveSession();
      navigate('/ideas', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.sessions) setSessions(data.sessions);
      setError(data?.error || 'Could not continue. Please terminate another session first.');
      setResolved(false);
    } finally {
      setResolving(false);
    }
  };

  const handleCancel = () => {
    clearPending();
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-root min-h-screen">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Logo className="text-xl" />
      </div>

      <div className="auth-card w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ds-color-danger-soft)]">
            <ShieldAlert className="h-5 w-5 text-[var(--ds-color-danger)]" />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-[var(--ds-color-text)]">Session limit reached</h1>
            <p className="text-xs text-[var(--ds-color-text-muted)]">
              You have too many active sessions. Terminate one to continue.
            </p>
          </div>
        </div>

        {error && (
          <p className="feedback-error mb-4 px-3 py-2 text-sm">{error}</p>
        )}

        <SessionList
          sessions={sessions}
          loading={loading}
          error={null}
          onTerminate={handleTerminate}
          showConfirm={false}
          hideCurrentTerminate={false}
        />

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="spark"
            size="sm"
            disabled={!resolved || resolving}
            onClick={handleContinue}
          >
            {resolving ? 'Continuing…' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
