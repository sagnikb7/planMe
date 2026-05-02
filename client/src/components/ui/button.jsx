import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--ds-radius-sm)] text-sm font-medium transition-all focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--ds-color-accent)] text-[var(--ds-color-accent-fg)] hover:bg-[var(--ds-color-accent-hover)]',
        /* Amber CTA — primary creative action (capture, new idea) */
        spark:
          'bg-[var(--ds-color-glow)] text-[var(--ds-color-glow-fg)] shadow-[0_0_18px_var(--ds-color-glow-shadow)] hover:opacity-90 hover:shadow-[0_0_26px_var(--ds-color-glow-shadow)]',
        destructive:
          'bg-[var(--ds-color-danger)] text-white hover:opacity-90',
        outline:
          'border border-[var(--ds-color-border-strong)] bg-transparent text-[var(--ds-color-text)] hover:bg-[var(--ds-color-accent-soft)]',
        ghost:
          'text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-accent-soft)] hover:text-[var(--ds-color-text)]',
        /* Inline destructive — for row-level delete actions */
        'ghost-danger':
          'text-[var(--ds-color-danger)] hover:bg-[var(--ds-color-danger-soft)] hover:text-[var(--ds-color-danger)]',
        link:
          'text-[var(--ds-color-text)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[var(--ds-size-control-md)] px-4 py-2',
        sm: 'h-[var(--ds-size-control-sm)] px-3 text-xs',
        lg: 'h-[var(--ds-size-control-lg)] px-6',
        icon: 'h-[var(--ds-size-control-md)] w-[var(--ds-size-control-md)]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export function Button({ className, variant, size, asChild = false, onClick, ...props }) {
  const Comp = asChild ? Slot : 'button';
  const handleClick = (e) => {
    if (variant === 'spark') haptic('light');
    onClick?.(e);
  };
  return <Comp className={cn(buttonVariants({ variant, size, className }))} onClick={handleClick} {...props} />;
}
