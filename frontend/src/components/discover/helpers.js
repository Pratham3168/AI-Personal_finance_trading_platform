import { formatDate, formatMoney, prettify } from '../../utils/format'

export const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
export const pick = (o, keys) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null)

// The backend returns a list under some key; find it whatever the wrapper is called
export const findList = (d) => (Array.isArray(d) ? d : Object.values(d || {}).find(Array.isArray) || [])

export function fmtAny(key, v) {
  if (v == null) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'number') {
    if (/pct|percent|rate/i.test(key)) return `${Math.round(v * 100) / 100}%`
    if (/shares|lots|quantity|count|years|months/i.test(key)) return new Intl.NumberFormat('en-IN').format(v)
    return formatMoney(v)
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDate(v)
  return String(v)
}

// One level of flattening: { a: 1, b: { c: 2 } } -> [['A', '1'], ['B – C', '2']]
export function flatten(obj, fmt = fmtAny) {
  const rows = []
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (isObj(v)) {
      Object.entries(v).forEach(([k2, v2]) => {
        if (!isObj(v2) && !Array.isArray(v2)) rows.push([`${prettify(k)} – ${prettify(k2)}`, fmt(k2, v2)])
      })
    } else if (Array.isArray(v)) {
      if (v.every((x) => !isObj(x))) rows.push([prettify(k), v.join(', ') || '—'])
    } else rows.push([prettify(k), fmt(k, v)])
  })
  return rows
}

export const fmtDateTime = (iso) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
