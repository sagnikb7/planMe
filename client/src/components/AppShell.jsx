import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, PlusCircle, Settings, UserCircle2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/ideas', label: 'Ideas', icon: BookOpen },
  { to: '/ideas/add', label: 'New idea', icon: PlusCircle },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/settings', label: 'Settings', icon: Settings },
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
        <aside className="surface-glass hidden w-56 shrink-0 flex-col p-3 md:flex">
          <div className="mb-6 px-2 pt-1">
            <Link to="/" aria-label="Go to home page">
              <Logo className="text-sm" />
            </Link>
          </div>

          <nav className="flex-1 space-y-0.5">
            {navItems.map((item) => <NavItem key={item.to} {...item} />)}
          </nav>

          <div className="mt-4 border-t border-[var(--ds-color-border)] pt-3 px-3">
            <p className="text-[11px] text-[var(--ds-color-text-soft)]">
              planMe <span className="opacity-50">v{__APP_VERSION__}</span>
            </p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="sr-only">{sectionTitle}</h1>

          <main id="main-content" key={location.pathname} className="ds-page-enter min-w-0 flex-1 px-4 py-4 md:px-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="nav-shell fixed inset-x-3 bottom-3 z-20 rounded-[var(--ds-radius-lg)] px-2 py-2 md:hidden">
        <div className="flex items-center gap-1">
          {navItems.map((item) => <NavItem key={item.to} {...item} mobile />)}
        </div>
      </nav>
    </div>
  );
}
