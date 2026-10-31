import { prettify } from './format'

const TEXT_KEYS = ['text', 'message', 'description', 'summary', 'label', 'title', 'observation', 'reason']

// Turn any backend value into something safe to print. React crashes if you render a plain object.
export function toText(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ')
  if (typeof v === 'object') {
    const key = TEXT_KEYS.find((k) => typeof v[k] === 'string' && v[k])
    if (key) return v[key]
    return Object.entries(v)
      .map(([k, val]) => `${prettify(k)}: ${toText(val)}`)
      .join('; ')
  }
  return String(v)
}

// A list of printable strings from a string, array or object
export function toList(v) {
  if (v == null) return []
  if (Array.isArray(v)) return v.map(toText).filter(Boolean)
  if (typeof v === 'string') return v ? [v] : []
  if (typeof v === 'object') return Object.entries(v).map(([k, val]) => `${prettify(k)}: ${toText(val)}`)
  return [String(v)]
}

// Field names that hold a plain number of things (entries, lots, days...), never money.
export const isCountKey = (k = '') => /count|entries|entry|number|qty|quantity|lots?\b|shares|days|months|years|holdings/i.test(k)
export const fmtCount = (n) => new Intl.NumberFormat('en-IN').format(n)
