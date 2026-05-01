import './Legal.css';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

const updated = 'May 1, 2026';

function LegalShell({ title, subtitle, children }) {
  return (
    <div className="legal-root">
      <header className="legal-header">
        <Link to="/" aria-label="Go to home page">
          <Logo className="text-sm" />
        </Link>
        <nav className="legal-nav">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="mailto:sagnikbetal@gmail.com">Contact</a>
        </nav>
      </header>

      <main className="legal-main">
        <p className="legal-updated">Updated {updated}</p>
        <h1>{title}</h1>
        <p className="legal-subtitle">{subtitle}</p>
        <div className="legal-card">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="planMe is built as a private idea workspace. This page explains what the app stores and the controls you have."
    >
      <section>
        <h2>What planMe stores</h2>
        <p>
          planMe stores the account details needed to run the app, including your name, email address,
          password hash, active sessions, and the ideas, tags, and rich-text content you create.
        </p>
      </section>

      <section>
        <h2>What planMe does not do</h2>
        <p>
          planMe does not sell your data, run an ad network, or use your private ideas to build a feed.
          The product promise is simple: your workspace is yours.
        </p>
      </section>

      <section>
        <h2>Offline data</h2>
        <p>
          The app can save ideas locally in your browser through IndexedDB so you can create and read
          ideas offline. Local changes sync to your account when the app can reach the server again.
        </p>
      </section>

      <section>
        <h2>Export and deletion</h2>
        <p>
          You can export your ideas from Settings as a JSON file. You can also delete your account from
          Settings; that permanently removes your account, ideas, and sessions from the server.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For privacy or support questions, email <a href="mailto:sagnikbetal@gmail.com">sagnikbetal@gmail.com</a>.
        </p>
      </section>
    </LegalShell>
  );
}

export function TermsOfService() {
  return (
    <LegalShell
      title="Terms of Service"
      subtitle="These terms keep expectations clear while planMe is in early production."
    >
      <section>
        <h2>Use of the service</h2>
        <p>
          You may use planMe to capture, organize, and revisit your own ideas. Do not use the service
          for unlawful activity, abuse, or attempts to disrupt the app or other users.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You keep ownership of the ideas and notes you create. planMe stores and processes that content
          only to provide the workspace features you use.
        </p>
      </section>

      <section>
        <h2>Account responsibility</h2>
        <p>
          Keep your login details secure. If you think your account has been accessed without permission,
          change your password and contact support.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          planMe is provided as an early-stage product. The app may change, improve, or experience
          downtime as the service evolves.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to <a href="mailto:sagnikbetal@gmail.com">sagnikbetal@gmail.com</a>.
        </p>
      </section>
    </LegalShell>
  );
}
