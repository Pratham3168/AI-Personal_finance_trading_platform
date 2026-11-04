import { CardShell, BlockSkeleton } from '../home/parts'
import { DeltaBadge } from './shared'
import { formatMoney, formatMonth } from '../../utils/format'

function Line({ label, value, change, goodWhenUp }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="num text-base font-semibold text-fg">{value == null ? '—' : formatMoney(value)}</p>
      </div>
      <DeltaBadge delta={change.delta} pct={change.pct} goodWhenUp={goodWhenUp} />
    </li>
  )
}

export default function ComparisonCard({ month, prevMonth, status, cmp, cur }) {
  return (
    <CardShell title="Compared with last month" subtitle={formatMonth(prevMonth)}>
      {status === 'loading' ? (
        <BlockSkeleton lines={4} />
      ) : status === 'empty' ? (
        <p className="text-sm text-muted">There are no entries for {formatMonth(prevMonth)}, so there is nothing to compare yet.</p>
      ) : status === 'error' || !cmp ? (
        <p className="text-sm text-muted">The comparison isn’t available right now. Your {formatMonth(month)} numbers are unaffected.</p>
      ) : (
        <ul className="-my-1 divide-y divide-line">
          <Line label="Income" value={cur.income} change={cmp.income} goodWhenUp />
          <Line label="Expenses" value={cur.expenses} change={cmp.expenses} goodWhenUp={false} />
          <Line label="Savings" value={cur.savings} change={cmp.savings} goodWhenUp />
        </ul>
      )}
    </CardShell>
  )
}
