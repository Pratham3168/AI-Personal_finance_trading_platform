import { analysisApi } from '../../api/analysis'
import { currentMonth } from '../../utils/format'

// Reads a money total from a summary whatever its exact shape: a plain number, or an object such as
// { total: 123 }. Tries each key in order. Returns NaN when nothing usable is found.
export function readTotal(summary, keys) {
  for (const k of keys) {
    const v = summary?.[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (v && typeof v === 'object') {
      for (const inner of ['total', 'amount', 'value', 'sum']) {
        const n = Number(v[inner])
        if (v[inner] != null && Number.isFinite(n)) return n
      }
    }
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  }
  return NaN
}

// ['2026-05', ..., '2026-10'], oldest first, ending with the current month
export function lastMonths(n = 6) {
  const [y, m] = currentMonth().split('-').map(Number)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - (n - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}

// One summary request per month, in parallel. A month with no entries is a normal "empty" result.
export async function loadTrend(months) {
  const results = await Promise.allSettled(months.map((mo) => analysisApi.summary(mo)))
  return results.map((r, i) => {
    const month = months[i]
    if (r.status === 'fulfilled') {
      const s = r.value.data?.summary ?? r.value.data ?? {}
      const income = readTotal(s, ['totalIncome', 'income'])
      const expenses = readTotal(s, ['totalExpenses', 'expenses'])
      if (!Number.isFinite(income) && !Number.isFinite(expenses)) return { month, income: 0, expenses: 0, status: 'empty' }
      return { month, income: Number.isFinite(income) ? income : 0, expenses: Number.isFinite(expenses) ? expenses : 0, status: 'ok' }
    }
    if (r.reason?.status === 404) return { month, income: 0, expenses: 0, status: 'empty' }
    return { month, income: 0, expenses: 0, status: 'error', message: r.reason?.message }
  })
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export const formatCompact = (n) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n) || 0)
