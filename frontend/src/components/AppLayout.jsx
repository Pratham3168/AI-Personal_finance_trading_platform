import { NavLink, Outlet, useLocation } from 'react-router-dom'
import * as m from 'motion/react-m'
import { ArrowLeftRight, ChartPie, Compass, LayoutDashboard, TrendingUp } from 'lucide-react'
import Logo from './Logo'
import ErrorBoundary from './ErrorBoundary'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'
import { MIGRATED_ROUTES } from '../config'
import { cn } from '../utils/cn'

const NAV = [
  { to: '/home', label: 'Home', short: 'Home', icon: LayoutDashboard },
  { to: '/transactions', label: 'Income & Expenses', short: 'Money', icon: ArrowLeftRight },
  { to: '/analysis', label: 'Analysis', short: 'Analysis', icon: ChartPie },
  { to: '/investments', label: 'Investments', short: 'Invest', icon: TrendingUp },
  { to: '/discover', label: 'Discover', short: 'Discover', icon: Compass },
]

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'text-fg' : 'text-muted hover:text-fg'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <m.span
              layoutId="sidebar-pill"
              className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/12"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
            />
          )}
          <Icon className={cn('relative h-[18px] w-[18px]', isActive && 'text-accent-text')} aria-hidden />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function BottomLink({ to, short, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors',
          isActive ? 'text-fg' : 'text-muted'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <m.span
              layoutId="bottom-pill"
              className="absolute inset-0 rounded-xl bg-accent/12"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
            />
          )}
          <Icon className={cn('relative h-5 w-5', isActive && 'text-accent-text')} aria-hidden />
          <span className="relative">{short}</span>
        </>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const current = NAV.find((n) => pathname.startsWith(n.to))
  const migrated = MIGRATED_ROUTES.some((p) => pathname.startsWith(p))

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="glass-panel fixed inset-y-0 left-0 z-40 hidden w-64 flex-col rounded-none border-y-0 border-l-0 px-4 py-5 lg:flex">
        <div className="px-2 pb-6">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map((n) => (
            <SidebarLink key={n.to} {...n} />
          ))}
        </nav>
      </aside>

      {/* Topbar */}
      <header className="glass-panel sticky top-0 z-30 flex h-16 items-center justify-between rounded-none border-x-0 border-t-0 px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <p className="hidden text-sm font-medium text-muted lg:block">{current?.label}</p>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
        <m.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <ErrorBoundary key={pathname}>
            {migrated ? (
              <Outlet />
            ) : (
              <div className="legacy-sheet force-light rounded-3xl p-4 sm:p-8">
                <Outlet />
              </div>
            )}
          </ErrorBoundary>
        </m.div>
      </main>

      {/* Bottom bar (mobile) */}
      <nav
        aria-label="Main"
        className="glass-bar fixed inset-x-3 bottom-3 z-40 flex rounded-2xl p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        {NAV.map((n) => (
          <BottomLink key={n.to} {...n} />
        ))}
      </nav>
    </div>
  )
}
