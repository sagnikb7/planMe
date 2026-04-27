import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineBanner({ status }) {
  if (!status || status === 'idle') return null;

  const configs = {
    offline: {
      icon: WifiOff,
      text: "You're offline. Ideas are saved locally and will sync when you reconnect.",
      className: 'bg-[var(--ds-color-glow-soft)] text-[var(--ds-color-glow)] border-[var(--ds-color-glow)]/30',
    },
    syncing: {
      icon: RefreshCw,
      text: 'Syncing local ideas…',
      className: 'bg-[var(--ds-color-surface-strong)] text-[var(--ds-color-text-muted)] border-[var(--ds-color-border-strong)]',
      spin: true,
    },
    synced: {
      icon: CheckCircle2,
      text: 'All synced',
      className: 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20',
    },
  };

  const { icon: Icon, text, className, spin } = configs[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b px-4 py-2 text-xs font-medium transition-all duration-300',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', spin && 'animate-spin')} />
      <span>{text}</span>
    </div>
  );
}
