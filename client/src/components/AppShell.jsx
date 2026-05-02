import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Keyboard, PlusCircle, Settings, Smartphone, UserCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { OfflineBanner } from '@/components/OfflineBanner';
import { flushPendingQueue } from '@/lib/sync';

const INSTALL_DISMISSED_KEY = 'planme-install-dismissed';

function PWAInstallModal({ onInstall, onDismiss }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60"
        style={{ zIndex: 'calc(var(--ds-z-modal) - 1)', animation: 'ds-fade-in 0.2s ease-out both' }}
        onClick={onDismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-modal-title"
        className="fixed left-1/2 top-1/2 w-[min(calc(100vw-2rem),22rem)] surface-panel p-7"
        style={{ zIndex: 'var(--ds-z-modal)', animation: 'ds-modal-enter 0.22s ease-out both', transform: 'translate(-50%, -50%)' }}
      >
        <div className="mb-5 flex h-12 w-12 mx-auto items-center justify-center rounded-[var(--ds-radius-md)] bg-[var(--ds-color-glow-soft)] text-[var(--ds-color-glow)]">
          <Smartphone className="h-6 w-6" />
        </div>
        <h2 id="pwa-modal-title" className="text-base font-semibold text-[var(--ds-color-text)] text-center mb-2">
          Better as an app
        </h2>
        <p className="text-sm text-[var(--ds-color-text-muted)] text-center leading-relaxed mb-6">
          Add planMe to your home screen for instant access, offline support, and a feel closer to native — no app store needed.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2 rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-glow)] px-4 py-2.5 text-sm font-semibold text-[var(--ds-color-glow-fg)] transition-opacity hover:opacity-90"
          >
            Install planMe
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2 text-sm text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text)]"
          >
            Not now
          </button>
        </div>
      </div>
    </>
  );
}

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
          ? 'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[var(--ds-radius-sm)] px-2 py-2 text-[12px] font-medium transition-[color,background-color] duration-150'
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
  const [bannerStatus, setBannerStatus] = useState('idle');
  const [navHidden, setNavHidden] = useState(false);
  const [trackedPathname, setTrackedPathname] = useState(location.pathname);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const syncedTimer = useRef(null);
  const reachable = useRef(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef(null);
  useKeyboardShortcuts();

  const { installPrompt, prompt: promptInstall } = usePWAInstall();

  // Show install modal once, 5 s after the app is ready, if not already installed/dismissed
  useEffect(() => {
    if (!installPrompt) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone || localStorage.getItem(INSTALL_DISMISSED_KEY)) return;
    const timer = setTimeout(() => setShowInstallModal(true), 5000);
    return () => clearTimeout(timer);
  }, [installPrompt]);

  const handleInstall = async () => {
    await promptInstall();
    setShowInstallModal(false);
  };

  const handleInstallDismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    setShowInstallModal(false);
  };

  // Reset nav when route changes — setState during render is the React-recommended
  // pattern for deriving state from props/context without a useEffect
  if (trackedPathname !== location.pathname) {
    setTrackedPathname(location.pathname);
    setNavHidden(false);
  }

  // Auto-hide nav on scroll down, restore on scroll up / top / bottom.
  // main is the scroll container on mobile (body no longer scrolls), so we
  // listen to mainRef. Re-run on route change because main remounts via key.
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    lastScrollY.current = 0;
    const onScroll = () => {
      const y = el.scrollTop;
      const nearBottom = y + el.clientHeight >= el.scrollHeight - 80;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;
      if (nearBottom || y < 80) { setNavHidden(false); return; }
      if (delta > 8)  setNavHidden(true);
      if (delta < -8) setNavHidden(false);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setShortcutsOpen(true);
    window.addEventListener('planme:shortcuts-open', handler);
    return () => window.removeEventListener('planme:shortcuts-open', handler);
  }, []);

  const tryFlush = (showSyncing = true) => {
    if (showSyncing) setBannerStatus('syncing');
    flushPendingQueue().then((synced) => {
      if (synced > 0) {
        setBannerStatus('synced');
        window.dispatchEvent(new CustomEvent('planme:sync-complete'));
        clearTimeout(syncedTimer.current);
        syncedTimer.current = setTimeout(() => setBannerStatus('idle'), 2500);
      } else {
        setBannerStatus('idle');
      }
    }).catch(() => setBannerStatus('idle'));
  };

  // Flush on mount — handles app restart and "opened while online with queued ops"
  useEffect(() => {
    if (navigator.onLine) setTimeout(() => tryFlush(false), 0);
  }, []);

  // React to real server reachability (browser events + API-level signals)
  useEffect(() => {
    const goOffline = () => {
      if (reachable.current) {
        reachable.current = false;
        setBannerStatus('offline');
      }
    };
    const goOnline = () => {
      if (!reachable.current) {
        reachable.current = true;
        tryFlush();
      }
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    window.addEventListener('planme:server-offline', goOffline);
    window.addEventListener('planme:server-back-online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('planme:server-offline', goOffline);
      window.removeEventListener('planme:server-back-online', goOnline);
    };
  }, []);

  // Flush on visibilitychange — Android backgrounded WebView misses the `online` event
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        tryFlush(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const sectionTitle = navItems.find((item) => location.pathname.startsWith(item.to))?.label || 'Workspace';

  return (
    <div className="app-shell app-shell-layout">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--ds-radius-sm)] focus:bg-[var(--ds-color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--ds-color-text)] focus:shadow-[var(--ds-shadow-focus)]"
      >
        Skip to main content
      </a>
      <div className="app-shell-inner mx-auto flex min-h-screen max-w-[var(--ds-size-container)] gap-0 md:gap-6 px-0 py-0 md:px-6 md:py-6">

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
        <div className="app-shell-content-col flex min-w-0 flex-1 flex-col min-h-0">
          <h1 className="sr-only">{sectionTitle}</h1>
          <OfflineBanner status={bannerStatus} />

          <main ref={mainRef} id="main-content" key={location.pathname} className="app-shell-main ds-page-enter min-w-0 flex-1 px-4 py-4 md:px-0">
            <Outlet />
          </main>
        </div>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {showInstallModal && (
        <PWAInstallModal onInstall={handleInstall} onDismiss={handleInstallDismiss} />
      )}

      {/* Mobile bottom nav */}
      <nav className={cn('nav-shell fixed inset-x-3 z-20 rounded-[var(--ds-radius-lg)] px-2 pt-2 md:hidden', navHidden && 'nav-hidden')}>
        <div className="flex items-center gap-1">
          {navItems.map((item) => <NavItem key={item.to} {...item} mobile />)}
        </div>
      </nav>
    </div>
  );
}
