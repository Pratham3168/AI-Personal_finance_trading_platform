import { ChevronDown } from 'lucide-react'
import { Card } from '../ui'
import { flatten, fmtAny, isObj } from '../discover/helpers'
import { formatMoney, prettify } from '../../utils/format'
import { fmtCount } from '../../utils/text'

// These fields have no dedicated card, so we can't be sure a number is money. Only show ₹ when the name says so.
const MONEYISH = /amount|total|income|expense|saving|cost|price|balance|spen[dt]|paid|salary|outflow/i
const fmt = (key, v, ctx = '') => {
  if (typeof v === 'number') {
    if (/pct|percent|rate|share/i.test(key)) return `${Math.round(v * 100) / 100}%`
    return MONEYISH.test(`${ctx} ${key}`) ? formatMoney(v) : fmtCount(v)
  }
  return fmtAny(key, v, ctx)
}

// Safety net: anything in the summary the page doesn't have a dedicated card for.
function Block({ title, value }) {
  const rows = Array.isArray(value) && value.some(isObj) ? value.filter(isObj) : null
  const cols = rows ? Object.keys(rows[0] || {}).filter((k) => rows[0][k] == null || typeof rows[0][k] !== 'object') : []
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-fg">{prettify(title)}</h3>
      {rows ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-subtle"><tr>{cols.map((c) => <th key={c} className="py-1.5 pr-4 font-medium">{prettify(c)}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c} className="py-1.5 pr-4 text-fg">{fmt(c, r[c], title)}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      ) : (
        <dl className="divide-y divide-line text-sm">
          {flatten({ [title]: value }, fmt).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-1.5"><dt className="text-muted">{k}</dt><dd className="font-medium text-fg">{v}</dd></div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default function MoreDetails({ data }) {
  const entries = Object.entries(data)
  if (!entries.length) return null
  return (
    <Card as="details" className="group p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-fg">
        More details
        <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {entries.map(([k, v]) => <Block key={k} title={k} value={v} />)}
      </div>
    </Card>
  )
}
