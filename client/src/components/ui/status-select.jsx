import './status-select.css';
import { cn } from '@/lib/utils';
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from '@/lib/constants';

const OPTIONS = IDEA_STATUSES.map((s) => ({ value: s, label: IDEA_STATUS_LABELS[s] }));

export function StatusSelect({ value, onChange, disabled }) {
  return (
    <div className="status-select">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn('status-select-btn', value === opt.value && 'is-active')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
