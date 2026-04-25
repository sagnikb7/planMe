import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[96px] w-full rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-strong)] px-3 py-2 text-sm text-[var(--ds-color-text)] placeholder:text-[var(--ds-color-text-soft)]',
        'focus:border-transparent focus:outline-none focus:shadow-[var(--ds-shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
        className
      )}
      {...props}
    />
  );
}
