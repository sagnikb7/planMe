import { Laptop, Monitor, Smartphone, Trash2 } from 'lucide-react';

function getDeviceIcon(device) {
  if (/Android|iOS/i.test(device)) return Smartphone;
  if (/macOS|ChromeOS/i.test(device)) return Laptop;
  return Monitor;
}
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable session list.
 *
 * Props:
 *   sessions       – array of SessionInfo objects
 *   loading        – show loading state
 *   error          – error string or null
 *   onTerminate    – async (sessionId: string) => void — called when user confirms termination
 *   showConfirm    – whether to show a confirm dialog before terminating (default true)
 *   hideCurrentTerminate – if true, hide the terminate button for the current session
 */
export function SessionList({
  sessions = [],
  loading = false,
  error = null,
  onTerminate,
  showConfirm = true,
  hideCurrentTerminate = true,
}) {
  const [pendingTerminate, setPendingTerminate] = useState(null);
  const [terminating, setTerminating] = useState(null);

  const handleTerminate = async (id) => {
    setTerminating(id);
    try {
      await onTerminate(id);
    } finally {
      setTerminating(null);
      setPendingTerminate(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--ds-color-text-muted)]">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-error px-3 py-2 text-sm">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="py-4 text-sm text-[var(--ds-color-text-muted)]">No active sessions.</p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {sessions.map((session) => {
          const DeviceIcon = getDeviceIcon(session.device);
          const canTerminate = onTerminate && !(hideCurrentTerminate && session.isCurrent);
          return (
            <li
              key={session.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-3',
                session.isCurrent && 'border-[var(--ds-color-glow-medium)] bg-[var(--ds-color-glow-soft)]'
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <DeviceIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ds-color-text-muted)]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ds-color-text)] truncate">
                      {session.device}
                    </span>
                    {session.isCurrent && (
                      <span className="inline-flex items-center rounded-full bg-[var(--ds-color-glow-medium)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-color-glow)]">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--ds-color-text-muted)]">
                    {session.ip} · {session.location}
                  </p>
                  <p className="text-xs text-[var(--ds-color-text-soft)]">
                    Signed in {new Date(session.createdAt).toLocaleString('en', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {canTerminate && (
                <Button
                  variant="ghost-danger"
                  size="sm"
                  className="shrink-0"
                  disabled={terminating === session.id}
                  onClick={() => showConfirm ? setPendingTerminate(session) : handleTerminate(session.id)}
                  aria-label="Terminate session"
                >
                  {terminating === session.id
                    ? <Loader />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {showConfirm && (
        <ConfirmDialog
          open={!!pendingTerminate}
          onOpenChange={(open) => !open && setPendingTerminate(null)}
          title="Terminate session?"
          description={
            <>
              This will immediately sign out the device listed below. This cannot be undone.
              {pendingTerminate && (
                <span className="mt-2 block font-medium text-[var(--ds-color-text)]">
                  {pendingTerminate.device} — {pendingTerminate.ip}
                </span>
              )}
            </>
          }
          confirmLabel="Terminate"
          loading={!!terminating}
          onConfirm={() => handleTerminate(pendingTerminate.id)}
        />
      )}
    </>
  );
}
