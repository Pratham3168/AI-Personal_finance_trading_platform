import { useState } from 'react'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Input, Select } from '../ui'
import Segmented from '../Segmented'
import { categoriesFor, labelOf } from './categoryMeta'
import { currentMonth } from '../../utils/format'
import { cn } from '../../utils/cn'

const shiftMonth = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const stepBtn = 'glass-flat flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:text-fg disabled:cursor-not-allowed disabled:opacity-40'

export default function FilterBar({ filters, onChange, options, onReset, isDefault }) {
  const { month, type, category } = filters
  const nowYm = currentMonth()
  const [open, setOpen] = useState(false) // phones only: type + category are tucked away
  const activeCount = (type ? 1 : 0) + (category ? 1 : 0)

  const expense = categoriesFor(options, 'expense')
  const income = categoriesFor(options, 'income')

  const setType = (t) => {
    const valid = t === 'income' ? income : t === 'expense' ? expense : [...income, ...expense]
    onChange({ type: t, category: valid.includes(category) ? category : '' })
  }

  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 rounded-2xl p-3 sm:p-4">
      <Segmented
        label="Period"
        value={month ? 'month' : 'all'}
        onChange={(v) => onChange({ month: v === 'month' ? nowYm : '' })}
        options={[['month', 'Month'], ['all', 'All time']]}
      />

      {month && (
        <div className="flex w-full items-center gap-2 sm:w-auto" role="group" aria-label="Choose month">
          <button type="button" className={stepBtn} aria-label="Previous month" onClick={() => onChange({ month: shiftMonth(month, -1) })}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <Input type="month" aria-label="Month" value={month} max={nowYm} onChange={(e) => e.target.value && onChange({ month: e.target.value })} className="min-w-0 flex-1 text-center font-medium sm:w-44 sm:flex-none" />
          <button type="button" className={stepBtn} aria-label="Next month" disabled={month >= nowYm} onClick={() => onChange({ month: shiftMonth(month, 1) })}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="glass-flat flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-fg sm:hidden"
      >
        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-muted" aria-hidden /> Filters</span>
        {activeCount > 0 && <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs text-accent-text">{activeCount} active</span>}
      </button>

      <div className={cn(open ? 'flex w-full flex-col gap-3' : 'hidden', 'sm:contents')}>
      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={[['', 'All'], ['income', 'Income'], ['expense', 'Expenses']]}
        block
        className="sm:ml-auto sm:w-auto"
      />

      <div className="w-full sm:w-52">
        <Select aria-label="Category" value={category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {type === 'income' && income.map((c) => <option key={c} value={c}>{labelOf(c)}</option>)}
          {type === 'expense' && expense.map((c) => <option key={c} value={c}>{labelOf(c)}</option>)}
          {type === '' && (
            <>
              <optgroup label="Expenses">{expense.map((c) => <option key={`e-${c}`} value={c}>{labelOf(c)}</option>)}</optgroup>
              <optgroup label="Income">{income.filter((c) => !expense.includes(c)).map((c) => <option key={`i-${c}`} value={c}>{labelOf(c)}</option>)}</optgroup>
            </>
          )}
        </Select>
      </div>
      </div>

      {!isDefault && (
        <button type="button" onClick={onReset} className="text-sm font-semibold text-accent-text hover:underline">
          Reset
        </button>
      )}
    </div>
  )
}
