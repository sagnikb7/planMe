import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Loader } from './loader';
import { haptic } from '@/lib/haptics';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  confirmDisabled = false,
  children,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="ghost-danger"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => { haptic('heavy'); onConfirm(); }}
            disabled={loading || confirmDisabled}
          >
            {loading ? <><Loader /> {confirmLabel}…</> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
