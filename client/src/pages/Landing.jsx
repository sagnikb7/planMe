import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { PenLine, Hash, Lock } from 'lucide-react';

const FEATURES = [
  {
    icon: PenLine,
    title: 'Capture richly',
    body: 'Bold, bullets, or a single sentence. The editor steps aside so you can think.',
  },
  {
    icon: Hash,
    title: 'Tag and find',
    body: 'Organize by topic. Filter at a glance. No folders, no hierarchy, no friction.',
  },
  {
    icon: Lock,
    title: 'Yours alone',
    body: 'Your ideas stay private by default. No feeds, no algorithms, no noise.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing-root">
      <header className="landing-header">
        <Logo className="landing-logo text-base" />
        <nav className="landing-header-nav">
          {user ? (
            <Button asChild variant="spark">
              <Link to="/ideas">Open workspace</Link>
            </Button>
          ) : (
            <>
              <Link to="/login" className="landing-nav-link">Log in</Link>
              <Button asChild variant="spark">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-label="Introduction">
          <h1 className="landing-headline">
            A place for the{' '}
            <span className="landing-headline-accent">ideas</span>
            <br />
            worth coming back to.
          </h1>
          <p className="landing-subhead">
            Capture notes, half-formed thoughts, and sparks before they disappear.
            Private, simple, yours.
          </p>
          {!user && (
            <>
              <div className="landing-actions">
                <Button asChild size="lg" variant="spark">
                  <Link to="/register">Get started — it&apos;s free</Link>
                </Button>
              </div>
              <p className="landing-pills" aria-label="Key features">
                <span>Rich notes</span>
                <span aria-hidden="true">·</span>
                <span>Tags</span>
                <span aria-hidden="true">·</span>
                <span>Private</span>
                <span aria-hidden="true">·</span>
                <span>Free</span>
              </p>
            </>
          )}
        </section>

        <section className="landing-features" aria-label="Features">
          <div className="landing-features-grid">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="landing-feature-card"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="landing-feature-icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={1.75} />
                </div>
                <h2 className="landing-feature-title">{title}</h2>
                <p className="landing-feature-body">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {!user && (
          <section className="landing-footer-cta" aria-label="Call to action">
            <p className="landing-footer-cta-text">Ready to start capturing?</p>
            <Button asChild size="lg" variant="spark">
              <Link to="/register">Start for free</Link>
            </Button>
          </section>
        )}
      </main>

      <footer className="landing-footer">
        <span>© 2026 planMe</span>
        <span aria-hidden="true">·</span>
        <Link to="/login" className="landing-nav-link">Sign in</Link>
      </footer>
    </div>
  );
}
