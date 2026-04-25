import { cn } from '@/lib/utils';

export function Loader({ className }) {
  return (
    <span className={cn('ds-loader', className)} aria-label="Loading" role="status">
      <span className="ds-loader-dot" />
      <span className="ds-loader-dot" />
      <span className="ds-loader-dot" />
    </span>
  );
}
