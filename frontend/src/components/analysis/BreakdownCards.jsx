import { CardShell } from '../home/parts'
import { usePalette } from '../home/palette'
import { categoryIcon, labelOf } from '../transactions/categoryMeta'
import { displayLabel, pctText, toKey } from './shared'
import { formatDate, formatMoney } from '../../utils/format'
import { toText } from '../../utils/text'

// Rows with an amount, share and a thin bar
function ShareRows({ rows }) {
  const palette = usePalette().donut
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const color = palette[i % palette.length]
        return (
          <li key={r.label}>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{displayLabel(r.label)}</span>
              <span className="num shrink-0 text-sm font-semibold text-fg">{formatMoney(r.amount)}</span>
              <span className="num w-12 shrink-0 text-right text-xs text-subtle">{pctText(r.share)}</span>
            </div>
            <div className="ml-[1.375rem] mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-strong/70">
              <div className="h-full rounded-full" style={{ width: `${Math.max(r.share, 1)}%`, background: color }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function SourcesCard({ rows }) {
  return (
    <CardShell title="Where it came from" subtitle="Income by source">
      <ShareRows rows={rows} />
    </CardShell>
  )
}

export function PaymentsCard({ rows }) {
  const palette = usePalette().donut
  return (
    <CardShell title="How you paid" subtitle="Spending by payment method">
      <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-line-strong/70" role="img" aria-label="Share of spending by payment method">
        {rows.map((r, i) => (
          <span key={r.label} style={{ width: `${r.share}%`, background: palette[i % palette.length] }} title={`${labelOf(r.label)} ${pctText(r.share)}`} />
        ))}
      </div>
      <ShareRows rows={rows.map((r) => ({ ...r, label: /^[a-z0-9_]+$/.test(r.label) ? labelOf(r.label) : r.label }))} />
    </CardShell>
  )
}

export function LargestCard({ rows }) {
  return (
    <CardShell title="Largest expenses" subtitle="Your biggest spends this month">
      <ul className="-my-1 divide-y divide-line">
        {rows.map((r, i) => {
          const Icon = categoryIcon(toKey(r.label))
          const desc = toText(r.raw.description)
          const date = typeof r.raw.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.raw.date) ? formatDate(r.raw.date.slice(0, 10)) : ''
          const sub = [desc, date].filter(Boolean).join(' · ')
          return (
            <li key={`${r.label}-${i}`} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent-text">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{displayLabel(r.label)}</span>
                {sub && <span className="block truncate text-xs text-subtle">{sub}</span>}
              </span>
              <span className="num shrink-0 text-sm font-semibold text-fg">{formatMoney(r.amount)}</span>
            </li>
          )
        })}
      </ul>
    </CardShell>
  )
}
