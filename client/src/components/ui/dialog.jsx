import * as RadixDialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => { if (open) haptic('medium'); }, [open]);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}

export function DialogContent({ children, className }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-[ds-fade-in_0.15s_ease-out]" />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-sm',
          'surface-card p-6 shadow-[var(--ds-shadow-lg)]',
          'data-[state=open]:animate-[ds-modal-enter_0.18s_ease-out_both]',
          className
        )}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({ children, className }) {
  return (
    <RadixDialog.Title className={cn('text-sm font-semibold text-[var(--ds-color-text)] mb-1', className)}>
      {children}
    </RadixDialog.Title>
  );
}

export function DialogDescription({ children, className }) {
  return (
    <RadixDialog.Description className={cn('text-xs text-[var(--ds-color-text-muted)] mb-5', className)}>
      {children}
    </RadixDialog.Description>
  );
}

export function DialogFooter({ children, className }) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  );
}

export { RadixDialog as DialogPrimitive };
