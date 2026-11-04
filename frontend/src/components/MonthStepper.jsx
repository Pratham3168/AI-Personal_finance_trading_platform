import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from './ui'
import { currentMonth } from '../utils/format'

export const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const stepBtn = 'glass-flat flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:text-fg disabled:cursor-not-allowed disabled:opacity-40'

/** ‹ [month] › — cannot go past the current month. */
export default function MonthStepper({ month, onChange, className }) {
  const now = currentMonth()
  return (
    <div className={`flex items-center gap-2 ${className || ''}`} role="group" aria-label="Choose month">
      <button type="button" className={stepBtn} aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <Input type="month" aria-label="Month" value={month} max={now} onChange={(e) => e.target.value && onChange(e.target.value)} className="min-w-0 flex-1 text-center font-medium sm:w-44 sm:flex-none" />
      <button type="button" className={stepBtn} aria-label="Next month" disabled={month >= now} onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}
