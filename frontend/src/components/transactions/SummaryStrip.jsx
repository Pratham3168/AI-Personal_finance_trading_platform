import { Card, Skeleton } from '../ui'
import { CardError } from '../home/parts'
import { formatMoney, formatMonth } from '../../utils/format'

const money = (v) => (v == null ? '—' : formatMoney(v))

// Totals for the chosen month, from the analysis summary (not from the paginated list).
export default function SummaryStrip({ month, data, loading, error, onRetry }) {
  if (loading && !data) {
    return (
      <Card className="grid grid-cols-3 gap-3 p-4 sm:gap-6 sm:p-6" aria-busy="true">
        {[0, 1, 2].map((i) => <div key={i} className="space-y-2"><Skeleton className="h-3 w-14 sm:h-4 sm:w-20" /><Skeleton className="h-6 w-full sm:h-8 sm:w-32" /></div>)}
      </Card>
    )
  }
  if (error) {
    return <Card className="p-5 sm:p-6"><CardError message={error.message} onRetry={onRetry} /></Card>
  }
  if (!data) return null

  const net = data.income != null && data.expenses != null ? data.income - data.expenses : null
  const over = net != null && net < 0
  const items = [
    ['Income', money(data.income), 'text-positive'],
    ['Expenses', money(data.expenses), 'text-fg'],
    [over ? 'Overspent' : 'Left over', net == null ? '—' : `${over ? '−' : ''}${formatMoney(Math.abs(net))}`, over ? 'text-negative' : 'text-fg'],
  ]
  return (
    <Card className="grid grid-cols-3 gap-3 p-4 sm:gap-6 sm:p-6" aria-label={`Totals for ${formatMonth(month)}`}>
      {items.map(([label, value, tone]) => (
        <div key={label} className="min-w-0">
          <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
          <p className={`num mt-1 break-words text-base font-semibold tracking-tight sm:text-3xl ${tone}`}>{value}</p>
        </div>
      ))}
    </Card>
  )
}
