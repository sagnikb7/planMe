import { Component } from 'react';
import { Logo } from '@/components/Logo';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    console.error('[planMe] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (!this.state.crashed) return this.props.children;

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
        <a href="/" style={{ textDecoration: 'none' }}>
          <Logo className="text-base" />
        </a>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ds-color-text-muted)', margin: 0, maxWidth: '26rem' }}>
            Something went wrong. Your ideas are safe — this is a display error.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--ds-space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
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
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
          <a
            href="/"
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
            Go home
          </a>
        </div>
      </div>
    );
  }
}
