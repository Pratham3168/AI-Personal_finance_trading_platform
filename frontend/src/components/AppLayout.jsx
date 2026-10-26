import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../config'

const links = [
  ['/home', 'Home'],
  ['/transactions', 'Income & Expenses'],
  ['/analysis', 'Analysis'],
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const onLogout = async () => {
    setLoggingOut(true)
    await logout() // route guard redirects to /login
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="text-lg font-semibold text-slate-900">{APP_NAME}</span>
          <nav className="hidden gap-1 sm:flex">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`
                }>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 md:block">{user.fullName}</span>
            <button onClick={onLogout} disabled={loggingOut}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
        {/* mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 sm:hidden">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-800' : 'text-slate-600'}`
              }>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
