// Recharts is heavy, so this file is only loaded (lazily) when Home shows a chart.
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { EmptyState, buttonClass } from '../ui'
import { useTheme } from '../../context/ThemeContext'
import { formatMoney, formatMonth } from '../../utils/format'
import { formatCompact } from './data'
import { CardError } from './parts'

const PALETTE = {
  light: { income: '#047857', expense: '#1d4ed8', axis: '#5f7391', grid: 'rgba(10,40,90,0.10)', donut: ['#1d4ed8', '#0e7490', '#6366f1', '#0d9488', '#8b5cf6', '#94a3b8'] },
  dark: { income: '#34d399', expense: '#4f8dff', axis: '#8798b8', grid: 'rgba(150,180,255,0.14)', donut: ['#4f8dff', '#22d3ee', '#818cf8', '#2dd4bf', '#a78bfa', '#64748b'] },
}
const usePalette = () => PALETTE[useTheme().resolved === 'dark' ? 'dark' : 'light']

function Tip({ children }) {
  return <div className="glass-hero rounded-xl px-3 py-2 text-xs text-fg">{children}</div>
}

/* ---------------- income vs expenses ---------------- */
export function TrendChart({ rows, onRetry }) {
  const c = usePalette()
  const reduced = useReducedMotion()
  const data = rows.map((r) => ({ ...r, label: new Date(`${r.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }) }))
  const hasData = data.some((r) => r.status === 'ok' && (r.income > 0 || r.expenses > 0))

  // Every month failed to load: say so, instead of claiming there is no history
  if (data.length > 0 && data.every((r) => r.status === 'error')) {
    return <CardError message={data[0].message || 'We couldn’t load your history right now.'} onRetry={onRetry} />
  }

  if (!hasData) {
    return (
      <EmptyState icon={TrendingUp} title="No history yet" action={<Link to="/transactions" className={buttonClass()}>Add entries</Link>}>
        Once you have entries for a few months, your income and expenses will be compared here.
      </EmptyState>
    )
  }

  const failed = data.filter((r) => r.status === 'error').length
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.income }} /> Income</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.expense }} /> Expenses</span>
      </div>
      <div role="img" aria-label={`Income and expenses for the last ${data.length} months`}>
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={data} barGap={4} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: c.axis, fontSize: 12 }} tickFormatter={formatCompact} />
            <Tooltip
              cursor={{ fill: c.grid }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <Tip>
                    <p className="mb-1 font-medium">{formatMonth(payload[0].payload.month)}</p>
                    <p className="num">Income: {formatMoney(payload[0].payload.income)}</p>
                    <p className="num">Expenses: {formatMoney(payload[0].payload.expenses)}</p>
                  </Tip>
                ) : null
              }
            />
            <Bar dataKey="income" name="Income" fill={c.income} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={!reduced} />
            <Bar dataKey="expenses" name="Expenses" fill={c.expense} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={!reduced} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {failed > 0 && <p className="mt-2 text-xs text-subtle">{failed} {failed === 1 ? 'month' : 'months'} couldn’t be loaded.</p>}
      {/* Same data for screen readers */}
      <table className="sr-only">
        <caption>Income and expenses by month</caption>
        <thead><tr><th>Month</th><th>Income</th><th>Expenses</th></tr></thead>
        <tbody>{data.map((r) => <tr key={r.month}><td>{formatMonth(r.month)}</td><td>{formatMoney(r.income)}</td><td>{formatMoney(r.expenses)}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

/* ---------------- portfolio allocation ---------------- */
export function AllocationDonut({ holdings }) {
  const c = usePalette()
  const reduced = useReducedMotion()
  const sorted = [...holdings].map((h) => ({ name: h.symbol, value: Number(h.totalCost) || 0 })).filter((h) => h.value > 0).sort((a, b) => b.value - a.value)
  const slices = sorted.length > 6 ? [...sorted.slice(0, 5), { name: 'Others', value: sorted.slice(5).reduce((s, x) => s + x.value, 0) }] : sorted
  const total = slices.reduce((s, x) => s + x.value, 0)

  if (!total) {
    return (
      <EmptyState icon={TrendingUp} title="No holdings yet" action={<Link to="/investments" className={buttonClass({ variant: 'secondary' })}>Open investments</Link>}>
        Record a purchase to see how your portfolio is spread.
      </EmptyState>
    )
  }

  return (
    <div>
      <div className="relative mx-auto h-44 w-44" role="img" aria-label={`Portfolio allocation across ${slices.length} holdings`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={slices.length > 1 ? 2 : 0} stroke="none" isAnimationActive={!reduced}>
              {slices.map((s, i) => <Cell key={s.name} fill={c.donut[i % c.donut.length]} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <Tip>
                    <p className="font-medium">{payload[0].name}</p>
                    <p className="num">{formatMoney(payload[0].value)} · {Math.round((payload[0].value / total) * 1000) / 10}%</p>
                  </Tip>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-subtle">At cost</span>
          <span className="num text-sm font-semibold text-fg">{formatCompact(total)}</span>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.donut[i % c.donut.length] }} />
              <span className="truncate text-fg">{s.name}</span>
            </span>
            <span className="num text-muted">{Math.round((s.value / total) * 1000) / 10}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
