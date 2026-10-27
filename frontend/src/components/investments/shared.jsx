import { formatMoney } from '../../utils/format'

export const fmtQty = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0)
export const fmtPct = (n) => (n == null ? '—' : `${Math.round(Number(n) * 100) / 100}%`)
export const signedMoney = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatMoney(Math.abs(n))}`
export const gainTone = (n) => (n > 0 ? 'text-green-700' : n < 0 ? 'text-red-700' : 'text-slate-900')

export function Stat({ label, value, tone, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone || 'text-slate-900'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

// A titled card with label / value rows
export function Group({ title, rows }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900">{title}</h3>
      <dl className="divide-y divide-slate-100">
        {rows.map(([label, value, tone]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
            <dt className="text-slate-600">{label}</dt>
            <dd className={`text-right font-medium ${tone || 'text-slate-900'}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Empty({ title, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <div className="mt-1 text-sm text-slate-600">{children}</div>
    </div>
  )
}
