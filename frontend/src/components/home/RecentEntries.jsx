import { Link } from 'react-router-dom'
import { ArrowRight, Inbox } from 'lucide-react'
import { EmptyState, buttonClass } from '../ui'
import { BlockSkeleton, CardError, CardShell } from './parts'
import { formatDate, formatMoney, prettify } from '../../utils/format'
import { toText } from '../../utils/text'
import { cn } from '../../utils/cn'

export default function RecentEntries({ data, loading, error, onRetry }) {
  const list = data?.transactions ?? []
  return (
    <CardShell
      title="Recent entries"
      subtitle="Your latest income and expenses"
      action={
        <Link to="/transactions" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-text hover:underline">
          View all <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      }
    >
      {loading ? (
        <BlockSkeleton lines={5} />
      ) : error ? (
        <CardError message={error.message} onRetry={onRetry} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No entries yet"
          action={<Link to="/transactions" className={buttonClass()}>Add an entry</Link>}
        >
          Record your first income or expense to see it here.
        </EmptyState>
      ) : (
        <ul className="-my-1 divide-y divide-line">
          {list.slice(0, 5).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{prettify(t.category)}</p>
                <p className="truncate text-xs text-subtle">
                  {formatDate(t.date)}
                  {t.description ? ` · ${toText(t.description)}` : ''}
                </p>
              </div>
              <p className={cn('num shrink-0 text-sm font-semibold', t.type === 'income' ? 'text-positive' : 'text-fg')}>
                {t.type === 'income' ? '+' : '−'}
                {formatMoney(t.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  )
}
