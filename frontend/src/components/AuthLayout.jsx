import { APP_NAME } from '../config'

const points = [
  ['Verified accounts', 'Every account is confirmed through email verification.'],
  ['Private by design', 'Your records are only visible to you after you sign in.'],
  ['Clear financial picture', 'Track income, expenses and investments in one place.'],
]

function Logo({ light }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${light ? 'bg-white/10' : 'bg-blue-700'}`}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 3v6c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <span className={`text-lg font-semibold ${light ? 'text-white' : 'text-slate-900'}`}>{APP_NAME}</span>
    </div>
  )
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel (desktop only) */}
      <aside className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            Take control of your money with confidence.
          </h2>
          <ul className="mt-10 space-y-6">
            {points.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-slate-400">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  )
}
