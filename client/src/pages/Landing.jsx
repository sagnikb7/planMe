import './Landing.css';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTypewriter } from '@/hooks/useTypewriter';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Zap, Hash, ShieldCheck, WifiOff, ChevronDown, ExternalLink, Check, Download, Trash2, Mail } from 'lucide-react';

const TYPEWRITER_WORDS = [
  'ideas',
  'sparks',
  'notes',
  'plans',
  'tasks',
  'drafts',
  'lists',
  'goals'
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Capture in seconds',
    body: 'One tap to a blank editor. No folders to pick, no templates to fill. Just write.',
  },
  {
    icon: Hash,
    title: 'Find it instantly',
    body: 'Tag once, filter forever. No deep folder trees or complex search syntax.',
  },
  {
    icon: ShieldCheck,
    title: 'Yours alone',
    body: 'No feeds, no algorithms, no one reading your drafts. Private by default.',
  },
  {
    icon: WifiOff,
    title: 'Works without Wi-Fi',
    body: 'Create and read offline. Everything syncs automatically when you\'re back online.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Capture it',
    body: 'Open the app, hit the spark button. Write your idea before it disappears.',
  },
  {
    num: '02',
    title: 'Tag it',
    body: 'Add a tag or two. Skip the folders. planMe stays out of your way.',
  },
  {
    num: '03',
    title: 'Come back',
    body: 'Filter by tag, search by keyword. Your idea is exactly where you left it.',
  },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Private workspace',
    body: 'Your ideas stay in your account. No ads, no public feed, no selling your notes.',
  },
  {
    icon: Download,
    title: 'Export anytime',
    body: 'Download your workspace from Settings as JSON whenever you need a backup.',
  },
  {
    icon: Trash2,
    title: 'Delete when done',
    body: 'Account deletion removes your account, ideas, and sessions from the server.',
  },
];

const PREVIEW_IDEAS = [
  { title: 'Shower thought: what if the search was a command palette', tag: 'product', time: '3 ideas ago' },
  { title: 'Series A pitch — questions to prep', tag: 'work', time: 'yesterday' },
  { title: 'Mom Test — key lessons from the book', tag: 'reading', time: 'last week' },
  { title: 'Building in public: tweet thread outline', tag: 'content', time: '2 weeks ago' },
];

const STATS = [
  'No credit card',
  'No tracking',
  'Works offline',
  'Open source',
];

export default function Landing() {
  const { user } = useAuth();
  const typeword = useTypewriter(TYPEWRITER_WORDS);

  return (
    <div className="landing-root">
      <header className="landing-header">
        <Logo className="landing-logo text-base" />
        <nav className="landing-header-nav">
          {user ? (
            <Button asChild variant="spark" className="landing-header-cta">
              <Link to="/ideas">
                <span className="landing-header-cta-full">Open workspace</span>
                <span className="landing-header-cta-short">Open</span>
              </Link>
            </Button>
          ) : (
            <>
              <Link to="/login" className="landing-nav-link">Log in</Link>
              <Button asChild variant="spark" className="landing-header-cta">
                <Link to="/register">
                  <span className="landing-header-cta-full">Get started</span>
                  <span className="landing-header-cta-short">Start</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="landing-hero" aria-label="Introduction">
          <div className="landing-hero-badge" aria-hidden="true">
            Free forever · Open source
          </div>
          <h1 className="landing-headline">
            A place for the{' '}
            <span className="landing-headline-accent typewriter-word">
              {typeword}<span className="typewriter-cursor" aria-hidden="true" />
            </span>
            <br />
            worth coming back to.
          </h1>
          <p className="landing-subhead">
            The fastest way to capture an idea and actually find it later.
            Private, offline-ready, and free.
          </p>
          {!user && (
            <>
              <div className="landing-actions">
                <Button asChild size="lg" variant="spark">
                  <Link to="/register">Get started — it&apos;s free</Link>
                </Button>
              </div>
              <ul className="landing-stats-strip" aria-label="Key features">
                {STATS.map((s) => (
                  <li key={s} className="landing-stats-item">
                    <Check aria-hidden="true" className="landing-stats-check" size={13} strokeWidth={2.5} />
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="landing-scroll-cue" aria-hidden="true">
            <ChevronDown size={18} strokeWidth={1.5} />
          </div>
        </section>

        {/* Product preview mockup */}
        <section className="landing-preview" aria-label="Product preview">
          <p className="landing-section-label" aria-hidden="true">What it looks like</p>
          <div className="landing-preview-window" role="img" aria-label="planMe app screenshot mockup">
            <div className="landing-preview-titlebar" aria-hidden="true">
              <div className="landing-preview-dots">
                <span /><span /><span />
              </div>
              <span className="landing-preview-tab">planMe · Ideas</span>
            </div>
            <div className="landing-preview-body">
              {PREVIEW_IDEAS.map((idea) => (
                <div key={idea.title} className="landing-preview-row">
                  <p className="landing-preview-title">{idea.title}</p>
                  <div className="landing-preview-meta">
                    <span className="landing-preview-tag">{idea.tag}</span>
                    <span className="landing-preview-time">{idea.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-features" aria-label="Features">
          <p className="landing-section-label" aria-hidden="true">Why planMe</p>
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

        {/* Trust */}
        <section className="landing-trust" aria-label="Privacy and control">
          <div className="landing-trust-copy">
            <p className="landing-section-label" aria-hidden="true">Trust basics</p>
            <h2 className="landing-trust-headline">Private by default, portable when needed.</h2>
            <p className="landing-trust-body">
              planMe keeps the product simple: your ideas are private, offline-friendly, exportable,
              and removable from your account settings.
            </p>
          </div>
          <div className="landing-trust-grid">
            {TRUST_ITEMS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="landing-trust-item">
                <Icon className="landing-trust-icon" size={16} strokeWidth={1.8} />
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="landing-howitworks" aria-label="How it works">
          <p className="landing-section-label" aria-hidden="true">Simple by design</p>
          <h2 className="landing-howitworks-headline">Three steps. That&apos;s all.</h2>
          <div className="landing-howitworks-grid">
            {STEPS.map(({ num, title, body }) => (
              <div key={num} className="landing-howitworks-col">
                <p className="landing-step-num" aria-hidden="true">{num}</p>
                <h3 className="landing-step-title">{title}</h3>
                <p className="landing-step-body">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Manifesto */}
        <section className="landing-manifesto" aria-label="Mission">
          <blockquote className="landing-manifesto-quote">
            Not a doc. Not a database.{' '}
            <span className="landing-manifesto-accent">Just a place to think.</span>
          </blockquote>
          <p className="landing-manifesto-sub">planMe is intentionally minimal.</p>
        </section>

        {/* Footer CTA */}
        {!user && (
          <section className="landing-footer-cta" aria-label="Call to action">
            <p className="landing-footer-cta-text">Ready to stop losing your best ideas?</p>
            <p className="landing-footer-cta-sub">No credit card. No tracking. Just your ideas.</p>
            <Button asChild size="lg" variant="spark">
              <Link to="/register">Start for free</Link>
            </Button>
          </section>
        )}
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <Logo className="text-sm" />
            <p className="landing-footer-tagline">
              Capture ideas, half-thoughts, and sparks before they disappear.
            </p>
          </div>

          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <p className="landing-footer-col-label">Product</p>
              {!user && <Link to="/register" className="landing-footer-link">Get started</Link>}
              <Link to="/login" className="landing-footer-link">Sign in</Link>
            </div>
            <div className="landing-footer-col">
              <p className="landing-footer-col-label">Source</p>
              <a
                href="https://github.com/sagnikb7/planMe"
                target="_blank"
                rel="noreferrer"
                className="landing-footer-link landing-footer-gh"
              >
                <ExternalLink size={13} aria-hidden="true" />
                GitHub
              </a>
            </div>
            <div className="landing-footer-col">
              <p className="landing-footer-col-label">Trust</p>
              <Link to="/privacy" className="landing-footer-link">Privacy</Link>
              <Link to="/terms" className="landing-footer-link">Terms</Link>
              <a href="mailto:sagnikbetal@gmail.com" className="landing-footer-link landing-footer-gh">
                <Mail size={13} aria-hidden="true" />
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>© 2026 planMe. All rights reserved.</span>
          <span>
            Made with <span className="landing-footer-heart" aria-hidden="true">♥</span> by sagnikbetal
          </span>
        </div>
      </footer>
    </div>
  );
}
