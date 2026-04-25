import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

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

      <main className="landing-hero">
        <h1 className="landing-headline">
          A place for the <span className="landing-headline-accent">ideas</span><br />
          worth coming back to.
        </h1>
        <p className="landing-subhead">
          Capture notes, half-formed thoughts, and sparks before they disappear.
          Private, simple, yours.
        </p>
        {!user && (
          <div className="landing-actions">
            <Button asChild size="lg" variant="spark">
              <Link to="/register">Get started — it&apos;s free</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
