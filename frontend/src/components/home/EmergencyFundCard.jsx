import { Link } from 'react-router-dom'
import { PiggyBank } from 'lucide-react'
import { buttonClass } from '../ui'
import { BlockSkeleton, CardError, CardShell } from './parts'
import { formatMoney } from '../../utils/format'
import { cn } from '../../utils/cn'

export default function EmergencyFundCard({ summary, loading, error, onRetry }) {
  const noProfile = error?.status === 409
  return (
    <CardShell title="Emergency fund" subtitle="Cash set aside before investing">
      {loading ? (
        <BlockSkeleton lines={4} />
      ) : noProfile ? (
        <div className="flex h-full flex-col items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 text-accent-text">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-muted">
            Set up your investor profile to see your emergency fund and how much is safe to invest.
          </p>
          <Link to="/investments" className={buttonClass({ variant: 'secondary' })}>
            Set up profile
          </Link>
        </div>
      ) : error ? (
        <CardError message={error.status === 422 ? 'Your opening month is later than this month.' : error.message} onRetry={error.status === 422 ? undefined : onRetry} />
      ) : summary ? (
        <Fund summary={summary} />
      ) : null}
    </CardShell>
  )
}

function Fund({ summary }) {
  const cash = summary.cash?.cashAtMonthEnd ?? 0
  const ef = summary.emergencyFund || {}
  const target = ef.target ?? 0
  const pct = target > 0 ? Math.min((cash / target) * 100, 100) : null
  const short = (ef.shortfall ?? 0) > 0

  return (
    <div className="flex h-full flex-col">
      <p className="text-sm text-muted">Cash at month end</p>
      <p className="num mt-1 text-2xl font-semibold text-fg">{formatMoney(cash)}</p>

      {pct != null && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-line-strong" role="img" aria-label={`${Math.round(pct)}% of emergency fund target`}>
            <div className={cn('h-full rounded-full', short ? 'bg-warning' : 'bg-positive')} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-subtle">
            {Math.round(pct)}% of your {formatMoney(target)} target
          </p>
        </div>
      )}

      <div className="mt-auto border-t border-line pt-4">
        <p className="text-sm text-muted">Safe to invest</p>
        <p className={cn('num mt-0.5 text-lg font-semibold', (ef.safeToInvestRoom ?? 0) > 0 ? 'text-positive' : 'text-fg')}>
          {formatMoney(ef.safeToInvestRoom ?? 0)}
        </p>
      </div>
    </div>
  )
}
