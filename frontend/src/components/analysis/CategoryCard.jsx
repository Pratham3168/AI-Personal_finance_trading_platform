import { Suspense, lazy, useState } from 'react'
import { Badge, Skeleton } from '../ui'
import { CardShell } from '../home/parts'
import { usePalette } from '../home/palette'
import { categoryIcon } from '../transactions/categoryMeta'
import { displayLabel, pctText, toKey } from './shared'
import { formatCompact } from '../home/data'
import { formatMoney } from '../../utils/format'
import { cn } from '../../utils/cn'

// Recharts is loaded on demand (shared with Home's chart file)
const DonutChart = lazy(() => import('../home/charts').then((m) => ({ default: m.DonutChart })))

const TOP = 5
const SHOW = 6

export default function CategoryCard({ categories, total, cmp }) {
  const palette = usePalette().donut
  const [all, setAll] = useState(false)

  const top = categories.slice(0, TOP)
  const rest = categories.slice(TOP)
  const slices = [...top.map((r) => ({ name: displayLabel(r.label), value: r.amount })), ...(rest.length ? [{ name: 'Others', value: rest.reduce((s, r) => s + r.amount, 0) }] : [])]
  const sum = categories.reduce((s, r) => s + r.amount, 0)
  const shown = all ? categories : categories.slice(0, SHOW)

  return (
    <CardShell title="Where your money went" subtitle="Spending by category">
      <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
        <Suspense fallback={<Skeleton className="mx-auto h-48 w-48 rounded-full" />}>
          <DonutChart slices={slices} centerLabel="Spent" centerValue={formatCompact(total ?? sum)} ariaLabel={`Spending split across ${categories.length} categories`} />
        </Suspense>

        <div>
          <ul className="space-y-3">
            {shown.map((r, i) => {
              const Icon = categoryIcon(toKey(r.label))
              const color = palette[Math.min(i, TOP) % palette.length]
              const change = cmp?.category(r.label, r.amount)
              return (
                <li key={r.label}>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
                    <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{displayLabel(r.label)}</span>
                    {change?.isNew && <Badge tone="accent">New</Badge>}
                    {change && !change.isNew && change.pct != null && Math.abs(change.pct) >= 1 && (
                      <Badge tone={change.pct > 0 ? 'warning' : 'positive'}>{change.pct > 0 ? '↑' : '↓'} {pctText(change.pct)}</Badge>
                    )}
                    <span className="num w-28 shrink-0 text-right text-sm font-semibold text-fg">{formatMoney(r.amount)}</span>
                    <span className="num w-12 shrink-0 text-right text-xs text-subtle">{pctText(r.share)}</span>
                  </div>
                  <div className="ml-[1.375rem] mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-strong/70">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(r.share, 1)}%`, background: color }} />
                  </div>
                </li>
              )
            })}
          </ul>
          {categories.length > SHOW && (
            <button type="button" onClick={() => setAll((a) => !a)} className={cn('mt-4 text-sm font-semibold text-accent-text hover:underline')}>
              {all ? 'Show fewer' : `Show all ${categories.length}`}
            </button>
          )}
          {cmp && <p className="mt-4 text-xs text-subtle">Arrows compare each category with last month.</p>}
        </div>
      </div>
    </CardShell>
  )
}
