import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Keyboard, PlusCircle, Settings, UserCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { flushPendingQueue } from '@/lib/sync';

const navItems = [
  { to: '/ideas', label: 'Ideas', icon: BookOpen },
  { to: '/ideas/add', label: 'New idea', icon: PlusCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
];

function NavItem({ to, icon: Icon, label, mobile = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/ideas'}
      className={({ isActive }) => cn(
        mobile
          ? 'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[var(--ds-radius-sm)] px-2 py-2 text-[11px] font-medium transition-[color,background-color] duration-150'
          : 'relative flex items-center gap-2.5 rounded-[var(--ds-radius-sm)] px-3 py-2 text-sm transition-[color,background-color,box-shadow] duration-150',
        isActive
          ? mobile
            ? 'bg-[var(--ds-color-glow-soft)] text-[var(--ds-color-glow)]'
            : 'bg-[var(--ds-color-glow-soft)] text-[var(--ds-color-text)] font-medium shadow-[inset_2px_0_0_var(--ds-color-glow)]'
          : 'text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-accent-soft)] hover:text-[var(--ds-color-text)]'
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn(
            'shrink-0',
            mobile ? 'h-5 w-5' : 'h-4 w-4',
            isActive && !mobile && 'text-[var(--ds-color-glow)]'
          )} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  const location = useLocation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const [bannerStatus, setBannerStatus] = useState('idle');
  const syncedTimer = useRef(null);
  const prevOnline = useRef(isOnline);
  useKeyboardShortcuts();

  useEffect(() => {
    const handler = () => setShortcutsOpen(true);
    window.addEventListener('planme:shortcuts-open', handler);
    return () => window.removeEventListener('planme:shortcuts-open', handler);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setBannerStatus('offline');
      prevOnline.current = false;
      return;
    }
    if (prevOnline.current === false) {
      setBannerStatus('syncing');
      flushPendingQueue().then(() => {
        setBannerStatus('synced');
        window.dispatchEvent(new CustomEvent('planme:sync-complete'));
        clearTimeout(syncedTimer.current);
        syncedTimer.current = setTimeout(() => setBannerStatus('idle'), 2500);
      }).catch(() => setBannerStatus('idle'));
    } else {
      setBannerStatus('idle');
    }
    prevOnline.current = true;
  }, [isOnline]);

  const sectionTitle = navItems.find((item) => location.pathname.startsWith(item.to))?.label || 'Workspace';

  return (
    <div className="app-shell min-h-screen pb-20 md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--ds-radius-sm)] focus:bg-[var(--ds-color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--ds-color-text)] focus:shadow-[var(--ds-shadow-focus)]"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex min-h-screen max-w-[var(--ds-size-container)] gap-0 md:gap-6 px-0 py-0 md:px-6 md:py-6">

        {/* Sidebar */}
        <aside className="surface-glass hidden w-56 shrink-0 flex-col p-3 md:flex sticky top-6 h-[calc(100dvh-3rem)]">
          <div className="mb-6 px-2 pt-1">
            <Link to="/" aria-label="Go to home page">
              <Logo className="text-sm" />
            </Link>
          </div>

          <nav className="flex-1 space-y-0.5">
            {navItems.map((item) => <NavItem key={item.to} {...item} />)}
          </nav>

          <div className="mt-4 border-t border-[var(--ds-color-border)] pt-3 px-3 flex items-center justify-between">
            <p className="text-[11px] text-[var(--ds-color-text-soft)]">
              planMe <span className="opacity-50">v{__APP_VERSION__}</span>
            </p>
            <button
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              className="flex items-center justify-center w-6 h-6 rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-soft)] hover:text-[var(--ds-color-text)] hover:bg-[var(--ds-color-surface-strong)] transition-colors"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="sr-only">{sectionTitle}</h1>
          <OfflineBanner status={bannerStatus} />

          <main id="main-content" key={location.pathname} className="ds-page-enter min-w-0 flex-1 px-4 py-4 md:px-0">
            <Outlet />
          </main>
        </div>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Mobile bottom nav */}
      <nav className="nav-shell fixed inset-x-3 bottom-3 z-20 rounded-[var(--ds-radius-lg)] px-2 py-2 md:hidden">
        <div className="flex items-center gap-1">
          {navItems.map((item) => <NavItem key={item.to} {...item} mobile />)}
        </div>
      </nav>
    </div>
  );
}
