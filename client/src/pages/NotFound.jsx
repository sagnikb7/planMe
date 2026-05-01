import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--ds-space-8) var(--ds-space-6)',
        background: 'var(--ds-color-bg)',
        textAlign: 'center',
        gap: 'var(--ds-space-6)',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Logo className="text-base" />
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
        <span
          style={{
            fontSize: '4.5rem',
            fontWeight: 600,
            lineHeight: 1,
            color: 'var(--ds-color-glow)',
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          404
        </span>
        <p style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-muted)', margin: 0, maxWidth: '22rem' }}>
          This page doesn't exist or was moved.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--ds-space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/ideas"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 'var(--ds-size-control-md)',
            padding: '0 var(--ds-space-5)',
            borderRadius: 'var(--ds-radius-md)',
            background: 'var(--ds-color-glow)',
            color: 'var(--ds-color-glow-fg)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go to my ideas
        </Link>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 'var(--ds-size-control-md)',
            padding: '0 var(--ds-space-5)',
            borderRadius: 'var(--ds-radius-md)',
            border: '1px solid var(--ds-color-border-strong)',
            color: 'var(--ds-color-text-muted)',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
