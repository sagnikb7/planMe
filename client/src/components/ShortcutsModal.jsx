import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const SECTIONS = [
  {
    label: 'Anywhere',
    rows: [
      { keys: ['n'], description: 'New idea' },
      { keys: ['/'], description: 'Focus search' },
      { keys: ['?'], description: 'Show this panel' },
    ],
  },
  {
    label: 'Reading an idea',
    rows: [
      { keys: ['e'], description: 'Edit idea' },
    ],
  },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-strong)] px-1.5 font-mono text-[11px] text-[var(--ds-color-text-muted)]">
      {children}
    </kbd>
  );
}

export function ShortcutsModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <div className="mt-2 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--ds-color-text-soft)]">
                {section.label}
              </p>
              <div className="space-y-2">
                {section.rows.map(({ keys, description }) => (
                  <div key={keys.join()} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[var(--ds-color-text-muted)]">{description}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
