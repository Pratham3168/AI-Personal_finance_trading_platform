import { analysisApi } from '../../api/analysis'
import { currentMonth } from '../../utils/format'

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
      const income = Number(s.totalIncome)
      const expenses = Number(s.totalExpenses)
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
