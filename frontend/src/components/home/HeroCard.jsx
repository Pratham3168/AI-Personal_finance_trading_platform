import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react'
import { Badge, Card, Metric, Skeleton, buttonClass } from '../ui'
import { CardError } from './parts'
import { formatMoney, formatMonth } from '../../utils/format'
import { cn } from '../../utils/cn'

// The most important number on the page: what is left of this month's income.
export default function HeroCard({ month, current, previous, loading, error, onRetry }) {
  return (
    <Card variant="hero" className="flex h-full flex-col p-6 sm:p-8">
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-14 w-72 max-w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <CardError message={error.message} onRetry={onRetry} />
      ) : current?.status === 'error' ? (
        <CardError message={current.message} onRetry={onRetry} />
      ) : current?.status === 'empty' ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-4">
          <p className="text-sm font-medium text-muted">{formatMonth(month)}</p>
          <p className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">No entries for this month yet</p>
          <p className="max-w-md text-sm text-muted">Add your income and expenses to see what you have left to spend and save.</p>
          <Link to="/transactions" className={buttonClass()}>
            <Plus className="h-4 w-4" aria-hidden /> Add your first entry
          </Link>
        </div>
      ) : (
        <Content month={month} current={current} previous={previous} />
      )}
    </Card>
  )
}

function Content({ month, current, previous }) {
  const left = current.income - current.expenses
  const over = left < 0
  const spentPct = current.income > 0 ? (current.expenses / current.income) * 100 : null
  const prevLeft = previous?.status === 'ok' ? previous.income - previous.expenses : null
  const delta = prevLeft == null ? null : left - prevLeft

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted">{over ? 'Overspent this month' : 'Left over this month'}</p>
        <span className="text-sm text-subtle">{formatMonth(month)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
        <p className={cn('num text-4xl font-bold tracking-tight sm:text-5xl', over ? 'text-negative' : 'text-fg')}>
          {over ? '−' : ''}
          {formatMoney(Math.abs(left))}
        </p>
        {delta != null && delta !== 0 && (
          <Badge tone={delta > 0 ? 'positive' : 'negative'} className="mb-1.5 gap-1 text-xs">
            {delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {formatMoney(Math.abs(delta))} {delta > 0 ? 'more' : 'less'} than last month
          </Badge>
        )}
      </div>

      {spentPct != null && (
        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-line-strong" role="img" aria-label={`Spent ${Math.round(spentPct)}% of income`}>
            <div
              className={cn('h-full rounded-full', spentPct > 100 ? 'bg-negative' : 'bg-linear-to-r from-accent to-accent-2')}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            You’ve spent <span className="num font-medium text-fg">{Math.round(spentPct)}%</span> of your income
          </p>
        </div>
      )}

      <div className="min-h-6 flex-1" />
      <div className="grid grid-cols-2 gap-6 border-t border-line pt-6">
        <Metric label="Income" value={formatMoney(current.income)} tone="positive" size="md" />
        <Metric label="Expenses" value={formatMoney(current.expenses)} size="md" />
      </div>
    </>
  )
}
