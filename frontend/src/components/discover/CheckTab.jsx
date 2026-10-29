import { useEffect, useState } from 'react'
import { Alert, Button, Field, Input, Select } from '../ui'
import { discoverApi } from '../../api/discover'
import { prettify } from '../../utils/format'
import { Group } from '../investments/shared'
import { findList, flatten, fmtAny, isObj, pick } from './helpers'

/* ---------- defensive: the exact shape of checks / what-if / facts varies ---------- */
function statusOf(v) {
  if (v === true) return 'pass'
  if (v === false) return 'warn'
  const s = String(v ?? '').toLowerCase()
  if (['pass', 'passed', 'ok', 'good', 'within', 'yes', 'true', 'within_limit'].includes(s)) return 'pass'
  if (['fail', 'failed', 'exceeds', 'over', 'blocked', 'no', 'false', 'exceeded'].includes(s)) return 'fail'
  if (['warn', 'warning', 'caution', 'review', 'attention'].includes(s)) return 'warn'
  return null
}

function normChecks(c) {
  const arr = Array.isArray(c)
    ? c
    : isObj(c)
    ? Object.entries(c).map(([k, v]) => (isObj(v) ? { _key: k, ...v } : { _key: k, value: v }))
    : []
  return arr.map((it) => {
    if (!isObj(it)) return { label: 'Check', message: String(it), status: null }
    const label = pick(it, ['label', 'name', 'title', 'check', 'id', '_key'])
    const message = pick(it, ['message', 'detail', 'details', 'reason', 'explanation', 'description', 'summary'])
    const raw = pick(it, ['status', 'result', 'passed', 'ok', 'pass', 'withinLimit', 'within'])
    return {
      label: label ? prettify(label) : 'Check',
      status: statusOf(raw),
      message: message != null ? String(message) : it.value !== undefined ? fmtAny(it._key || '', it.value) : '',
    }
  })
}

const badge = {
  pass: ['Within limits', 'bg-green-50 text-green-800'],
  warn: ['Review', 'bg-amber-50 text-amber-800'],
  fail: ['Over limit', 'bg-red-50 text-red-800'],
}

export function CheckResult({ d }) {
  const cap = d.capacity
  const facts = d.stock ?? d.ipo ?? d.facts ?? d.subject
  const whatIf = d.whatIf ?? d.whatif
  const checks = normChecks(d.checks)

  return (
    <div className="space-y-5">
      {checks.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900">Fit checks</h3>
          <ul className="divide-y divide-slate-100">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.label}</p>
                  {c.message && <p className="mt-0.5 text-sm text-slate-600">{c.message}</p>}
                </div>
                {c.status && (
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${badge[c.status][1]}`}>{badge[c.status][0]}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {isObj(facts) && <Group title={d.ipo ? 'IPO details' : 'Details'} rows={flatten(facts)} />}
        {isObj(whatIf) && <Group title="What if you buy" rows={flatten(whatIf)} />}
        {isObj(cap) && (
          <Group title="Your investing capacity" rows={[
            ['Cash now', fmtAny('cashNow', cap.cashNow)],
            ['Emergency fund target', fmtAny('emergencyTarget', cap.emergencyTarget)],
            ['Reserved amount', fmtAny('reservedAmount', cap.reservedAmount)],
            ['Investable capacity', fmtAny('investableCapacity', cap.investableCapacity)],
            ['Per-purchase limit', fmtAny('perPurchaseLimit', cap.perPurchaseLimit)],
            ['Per-purchase cap', fmtAny('perPurchaseCapPct', cap.perPurchaseCapPct)],
            ['Volatility limit', fmtAny('volatilityLimitPct', cap.volatilityLimitPct)],
          ]} />
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Explanation</h3>
        {d.aiExplanation ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{d.aiExplanation}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            A written explanation isn’t available right now. The checks above are still based on your numbers.
          </p>
        )}
      </div>

      <p className="text-xs text-slate-500">{d.disclaimer || 'For information only. This is not investment advice.'}</p>
    </div>
  )
}

/* ---------- tab ---------- */
// initial: { kind: 'stock', symbol } or { kind: 'ipo', ipoId, ipoName }
export default function CheckTab({ initial = {} }) {
  const [kind, setKind] = useState(initial.kind || 'stock')
  const [form, setForm] = useState({ symbol: initial.symbol || '', amount: '', ipoId: initial.ipoId || '', lots: '1' })
  const [ipos, setIpos] = useState(null)
  const [iposError, setIposError] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // IPO mode: load the IPO list for the dropdown
  useEffect(() => {
    if (kind !== 'ipo' || ipos) return
    discoverApi.ipos('active')
      .then((r) => setIpos(findList(r.data.ipos ?? r.data)))
      .catch((e) => { setIpos([]); setIposError(e.message) })
  }, [kind, ipos])

  const ipoOptions = (() => {
    const list = (ipos || []).filter((i) => i.id)
    if (initial.ipoId && !list.some((i) => i.id === initial.ipoId)) {
      list.unshift({ id: initial.ipoId, name: initial.ipoName || initial.ipoId })
    }
    return list
  })()

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setFormError('')
    const e = {}
    let body
    if (kind === 'stock') {
      const sym = form.symbol.trim()
      const amt = Number(form.amount)
      if (!sym) e.symbol = 'Enter a stock symbol.'
      if (!(amt > 0) || amt > 1000000000) e.amount = 'Enter an amount greater than 0.'
      body = { kind: 'stock', symbol: sym.toUpperCase(), amount: amt }
    } else {
      const lots = Number(form.lots)
      if (!form.ipoId) e.ipoId = 'Choose an IPO.'
      if (!Number.isInteger(lots) || lots < 1) e.lots = 'Enter a whole number of lots (1 or more).'
      body = { kind: 'ipo', ipoId: form.ipoId, lots }
    }
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    setResult(null)
    try {
      const res = await discoverApi.check(body)
      setResult(res.data.check ?? res.data)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(
        err.status === 429 ? 'You’ve reached the hourly limit for checks. Please try again later.'
        : err.status === 404 ? (kind === 'stock'
            ? 'We couldn’t find that stock symbol. Use the Search tab to find the right one.'
            : 'We couldn’t find that IPO. Pick one from the list.')
        : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const switchKind = (k) => { setKind(k); setErrors({}); setFormError(''); setResult(null) }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Check an investment</h2>
        <p className="mt-1 text-sm text-slate-600">
          See how a planned purchase compares with your cash, emergency fund and limits before you buy. Nothing is bought or recorded here.
        </p>

        <div className="mt-4 inline-flex rounded-lg border border-slate-300 p-1">
          {[['stock', 'Stock'], ['ipo', 'IPO']].map(([k, label]) => (
            <button key={k} type="button" onClick={() => switchKind(k)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${kind === k ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {formError && <Alert>{formError}</Alert>}

          {kind === 'stock' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Stock symbol" htmlFor="symbol" error={errors.symbol}>
                <Input id="symbol" name="symbol" placeholder="e.g. RELIANCE" maxLength={20} className="uppercase"
                  value={form.symbol} onChange={onChange} error={errors.symbol} />
              </Field>
              <Field label="Amount you plan to invest" htmlFor="amount" error={errors.amount}>
                <Input id="amount" name="amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={onChange} error={errors.amount} />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="IPO" htmlFor="ipoId" error={errors.ipoId}
                hint={iposError || (ipos && ipoOptions.length === 0 ? 'No active IPOs found right now.' : undefined)}>
                <Select id="ipoId" name="ipoId" value={form.ipoId} onChange={onChange} error={errors.ipoId} disabled={!ipos}>
                  <option value="">{ipos ? 'Select an IPO' : 'Loading…'}</option>
                  {ipoOptions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Select>
              </Field>
              <Field label="Number of lots" htmlFor="lots" error={errors.lots}>
                <Input id="lots" name="lots" type="number" inputMode="numeric" min="1" step="1"
                  value={form.lots} onChange={onChange} error={errors.lots} />
              </Field>
            </div>
          )}

          <div className="sm:max-w-[12rem]">
            <Button type="submit" loading={loading}>Check fit</Button>
          </div>
        </div>
      </form>

      {result && <CheckResult d={result} />}
    </div>
  )
}
