import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Badge } from '../ui'
import { labelOf } from '../transactions/categoryMeta'
import { formatMoney } from '../../utils/format'

// Backend names are snake_case keys ("personal_care"); show a friendly label, keep human text as is.
export const displayLabel = (label) => (/^[a-z0-9_]+$/.test(label) ? labelOf(label) : label)
// Normalise any label into the category key used for icons
export const toKey = (label) => String(label).toLowerCase().replace(/[\s&/-]+/g, '_')

export const pctText = (n) => `${Math.abs(Math.round(n * 10) / 10)}%`

/** ▲/▼ chip for a change. goodWhenUp: true for income/savings, false for expenses. */
export function DeltaBadge({ delta, pct, goodWhenUp, money = true }) {
  if (delta == null) return null
  if (delta === 0) return <Badge>No change</Badge>
  const up = delta > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <Badge tone={up === goodWhenUp ? 'positive' : 'warning'} className="gap-1">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {money ? formatMoney(Math.abs(delta)) : ''}
      {pct != null && <span className="opacity-80">{money ? ` (${pctText(pct)})` : pctText(pct)}</span>}
    </Badge>
  )
}
