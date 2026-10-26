import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const cards = [
  ['/transactions', 'Income & Expenses', 'Record what you earn and spend, and review your entries.'],
  ['/analysis', 'Budget analysis', 'See your monthly summary and get AI-generated spending guidance.'],
]

export default function Home() {
  const { user } = useAuth()
  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <p className="mt-2 text-slate-600">You have successfully logged in.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map(([to, title, desc]) => (
          <Link key={to} to={to}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-blue-700">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
