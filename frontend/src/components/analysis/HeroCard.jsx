import { useId } from 'react'
import { Card, Metric } from '../ui'
import { formatMoney } from '../../utils/format'
import { fmtCount } from '../../utils/text'
import { cn } from '../../utils/cn'

function Ring({ pct }) {
  const id = useId()
  const r = 52
  const circ = 2 * Math.PI * r
  const p = pct == null ? 0 : Math.max(0, Math.min(100, pct))
  const neg = pct != null && pct < 0
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={pct == null ? 'Savings rate unavailable' : `Savings rate ${Math.round(pct)} percent`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent-2)' }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" style={{ stroke: 'var(--border-strong)' }} />
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke={`url(#${id})`}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - p / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('num text-3xl font-bold tracking-tight', neg ? 'text-negative' : 'text-fg')}>{pct == null ? '—' : `${Math.round(pct)}%`}</span>
        <span className="text-xs text-muted">saved</span>
      </div>
    </div>
  )
}

export default function AnalysisHero({ model }) {
  const { income, expenses, savings, savingsOutflow, rate, counts } = model
  const over = savings != null && savings < 0
  return (
    <Card variant="hero" className="flex h-full flex-col p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <Ring pct={rate} />
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-sm font-medium text-muted">{over ? 'Overspent this month' : 'Saved this month'}</p>
          <p className={cn('num mt-1 break-words text-4xl font-bold tracking-tight sm:text-5xl', over ? 'text-negative' : 'text-fg')}>
            {savings == null ? '—' : `${over ? '−' : ''}${formatMoney(Math.abs(savings))}`}
          </p>
          {rate != null && (
            <p className="mt-2 text-sm text-muted">
              {rate >= 0 ? <>You kept about <span className="num font-medium text-fg">{Math.round(rate)}%</span> of what you earned.</> : 'You spent more than you earned.'}
            </p>
          )}
          {savingsOutflow != null && savingsOutflow > 0 && (
            <p className="mt-1 text-sm text-muted">
              Moved to savings or investments: <span className="num font-medium text-fg">{formatMoney(savingsOutflow)}</span>
            </p>
          )}
        </div>
      </div>

      <div className="min-h-6 flex-1" />
      <div className="grid grid-cols-2 gap-6 border-t border-line pt-6">
        <Metric label="Income" value={income == null ? '—' : formatMoney(income)} tone="positive" size="md" />
        <Metric label="Expenses" value={expenses == null ? '—' : formatMoney(expenses)} size="md" />
      </div>
      {counts.length > 0 && (
        <p className="mt-4 text-xs text-subtle">
          Entries: {counts.map((c) => `${c.label} ${fmtCount(c.value)}`).join(' · ')}
        </p>
      )}
    </Card>
  )
}
