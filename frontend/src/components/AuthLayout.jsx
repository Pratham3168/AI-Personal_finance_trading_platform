import { Link } from 'react-router-dom'
import * as m from 'motion/react-m'
import { ChartNoAxesCombined, LockKeyhole, MailCheck } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { APP_NAME } from '../config'
import { cn } from '../utils/cn'

// Only claims the product actually backs up.
const POINTS = [
  [MailCheck, 'Verified accounts', 'Every account is confirmed with a code sent to your email.'],
  [LockKeyhole, 'Private by design', 'Your records are visible only to you after you sign in.'],
  [ChartNoAxesCombined, 'A clear financial picture', 'Track income, expenses and investments in one place.'],
]

// Decorative layered glass. Hidden from assistive tech; the slabs only appear on wide screens
// so they never sit behind text on smaller laptops.
function GlassShapes() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-accent-2/25 blur-3xl" />
      <div className="glass-hero absolute -right-8 top-[10%] hidden h-60 w-44 rotate-12 rounded-3xl xl:block" />
      <div className="glass-panel absolute -right-20 bottom-[14%] hidden h-44 w-60 -rotate-6 rounded-3xl xl:block" />
      <div className="glass-hero absolute right-[14%] top-[46%] hidden h-16 w-16 rounded-full xl:block" />
    </div>
  )
}

export const linkButtonClass =
  'glass-flat inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-accent/10'

export function LinkButton({ to, children }) {
  return (
    <Link to={to} className={linkButtonClass}>
      {children}
    </Link>
  )
}

export default function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand + trust panel (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line p-12 lg:flex">
        <GlassShapes />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight text-fg xl:text-[2.75rem]">
            Take control of your money with confidence.
          </h2>
          <ul className="mt-10 space-y-3">
            {POINTS.map(([Icon, heading, text]) => (
              <li key={heading} className="glass-flat flex gap-4 rounded-2xl p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent-text">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-fg">{heading}</p>
                  <p className="mt-0.5 text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-subtle">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </aside>

      {/* Form */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('w-full', wide ? 'max-w-xl' : 'max-w-md')}
        >
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <div className="glass-hero rounded-3xl p-6 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </m.div>
      </main>
    </div>
  )
}
