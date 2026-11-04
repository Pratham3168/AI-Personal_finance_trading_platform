import { readTotal } from '../home/data'
import { prettify } from '../../utils/format'
import { toList } from '../../utils/text'

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const finite = (n) => (Number.isFinite(n) ? n : null)
const firstString = (o, keys) => {
  for (const k of keys) if (typeof o[k] === 'string' && o[k].trim()) return o[k]
  return null
}

/**
 * Turns a list OR a { name: amount | {amount,...} } map into [{ label, amount, raw }].
 * The backend names the fields in several possible ways, so this accepts all the likely ones.
 */
export function toRows(v) {
  if (!v) return []
  const list = Array.isArray(v)
    ? v
    : isObj(v)
    ? Object.entries(v).map(([k, val]) => (isObj(val) ? { __key: k, ...val } : { __key: k, amount: val }))
    : []
  return list
    .map((item) => {
      if (!isObj(item)) return null
      const label = firstString(item, ['category', 'source', 'method', 'paymentMethod', 'name', 'label', 'title', '__key', 'key'])
      const amount = finite(readTotal(item, ['amount', 'total', 'value', 'sum', 'expenses', 'income']))
      return label && amount != null ? { label, amount, raw: item } : null
    })
    .filter(Boolean)
}

const withShare = (rows) => {
  const total = rows.reduce((s, r) => s + Math.max(r.amount, 0), 0)
  return rows.map((r) => ({ ...r, share: total > 0 ? (Math.max(r.amount, 0) / total) * 100 : 0 }))
}

// Candidate lists/maps in the top two levels of the summary
function collect(summary) {
  const found = []
  for (const [k, v] of Object.entries(summary)) {
    if (Array.isArray(v) || isObj(v)) found.push({ key: k, path: k, top: k, value: v })
    if (isObj(v)) {
      for (const [k2, v2] of Object.entries(v)) {
        if (Array.isArray(v2) || isObj(v2)) found.push({ key: k2, path: `${k}.${k2}`, top: k, value: v2 })
      }
    }
  }
  return found
}

const SCALARS = ['month', 'income', 'totalIncome', 'expenses', 'totalExpenses', 'savings', 'totalSavings', 'savingsOutflow', 'savingsRatePct', 'savingsRate']

/** Reads a raw `summary` object into a predictable model. Anything it can't place goes to `leftovers`. */
export function readSummary(raw) {
  const s = isObj(raw) ? raw : {}
  const income = finite(readTotal(s, ['income', 'totalIncome']))
  const expenses = finite(readTotal(s, ['expenses', 'totalExpenses']))
  const savingsOutflow = finite(readTotal(s, ['savingsOutflow']))
  let savings = finite(readTotal(s, ['savings', 'totalSavings']))
  if (savings == null && income != null && expenses != null) savings = income - expenses
  let rate = finite(readTotal(s, ['savingsRatePct', 'savingsRate']))
  if (rate == null && income != null && income > 0 && savings != null) rate = (savings / income) * 100

  const found = collect(s)
  const used = new Set()
  const take = (test) => {
    const hit = found.find((f) => !used.has(f.path) && test(f))
    if (hit) { used.add(hit.path); used.add(hit.top) }
    return hit?.value
  }
  const sources = take((f) => /source/i.test(f.key) || (/categor/i.test(f.key) && /income/i.test(f.path)))
  const categories = take((f) => /categor/i.test(f.key) && !/income/i.test(f.path))
  const payments = take((f) => /payment|method/i.test(f.key))
  const largest = take((f) => /largest|biggest|top/i.test(f.key))
  const counts = take((f) => /count/i.test(f.key))
  const notes = take((f) => /^notes?$/i.test(f.key))

  const countRows = isObj(counts) ? Object.entries(counts).filter(([, n]) => Number.isFinite(Number(n))).map(([k, n]) => ({ label: prettify(k), value: Number(n) })) : []
  const leftovers = Object.fromEntries(
    Object.entries(s).filter(([k, v]) => !SCALARS.includes(k) && !used.has(k) && (Array.isArray(v) || isObj(v)))
  )

  return {
    income, expenses, savings, savingsOutflow, rate,
    categories: withShare(toRows(categories).filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount)),
    sources: withShare(toRows(sources).filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount)),
    payments: withShare(toRows(payments).filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount)),
    largest: toRows(largest).sort((a, b) => b.amount - a.amount).slice(0, 5),
    counts: countRows,
    notes: toList(notes),
    leftovers,
  }
}

const pctChange = (cur, prev) => (cur != null && prev != null && prev > 0 ? ((cur - prev) / prev) * 100 : null)

/** Month-over-month differences. `prev` is null when last month has no data. */
export function compare(cur, prev) {
  if (!prev) return null
  const line = (c, p) => ({ cur: c, prev: p, delta: c != null && p != null ? c - p : null, pct: pctChange(c, p) })
  const prevCat = new Map(prev.categories.map((r) => [r.label, r.amount]))
  return {
    income: line(cur.income, prev.income),
    expenses: line(cur.expenses, prev.expenses),
    savings: line(cur.savings, prev.savings),
    category: (label, amount) => {
      const p = prevCat.get(label)
      return p == null ? { isNew: true, pct: null } : { isNew: false, pct: pctChange(amount, p) }
    },
  }
}
