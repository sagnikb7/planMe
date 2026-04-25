import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 tracking-tight', className)}>
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--ds-color-glow)]" />
      <span>
        <span className="font-light text-[var(--ds-color-text-muted)]">plan</span>
        <span className="font-semibold text-[var(--ds-color-text)]">Me</span>
      </span>
    </span>
  );
}
