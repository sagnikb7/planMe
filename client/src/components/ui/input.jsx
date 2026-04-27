import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-[var(--ds-size-control-md)] w-full rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-strong)] px-3 py-2 text-sm text-[var(--ds-color-text)] placeholder:text-[var(--ds-color-text-soft)]',
        'focus:border-transparent focus:outline-none focus:shadow-[var(--ds-shadow-focus)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
