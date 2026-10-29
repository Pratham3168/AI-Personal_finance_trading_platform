import { useEffect, useState } from 'react'
import { Alert } from '../ui'
import { discoverApi } from '../../api/discover'
import { formatMoney, prettify } from '../../utils/format'
import { Empty, Group } from '../investments/shared'
import { CheckResult } from './CheckTab'
import { findList, fmtDateTime, flatten, isObj, pick } from './helpers'

function titleOf(it) {
  const subject = it.subject
  const t = pick(it, ['symbol', 'ipoName', 'name']) ?? (isObj(subject) ? pick(subject, ['symbol', 'name']) : subject) ?? it.ipoId
  return t ? String(t) : 'Check'
}

export default function HistoryTab({ goCheck }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    discoverApi.history()
      .then((r) => setItems(findList(r.data)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
  if (error) return <Alert>{error}</Alert>
  if (!items?.length) {
    return (
      <Empty title="No checks yet">
        Your last 20 checks are saved here.{' '}
        <button onClick={() => goCheck('')} className="font-semibold text-blue-700">Run your first check</button>.
      </Empty>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Your last {items.length} {items.length === 1 ? 'check' : 'checks'}, newest first.</p>
      {items.map((it, i) => {
        const payload = isObj(it.result) ? it.result : isObj(it.response) ? it.response : isObj(it.data) ? it.data : it
        const hasFull = Array.isArray(payload.checks) || isObj(payload.checks) || payload.aiExplanation
        const when = pick(it, ['createdAt', 'created_at', 'checkedAt'])
        const kind = it.kind ?? payload.kind
        const amt = pick(it, ['amount']) 
        const lots = pick(it, ['lots'])
        return (
          <details key={it.id ?? i} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span className="flex items-center gap-3">
                <span className="font-medium text-slate-900">{titleOf(it)}</span>
                {kind && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{kind === 'ipo' ? 'IPO' : prettify(kind)}</span>}
                {amt != null && <span className="text-sm text-slate-600">{formatMoney(amt)}</span>}
                {lots != null && <span className="text-sm text-slate-600">{lots} {Number(lots) === 1 ? 'lot' : 'lots'}</span>}
              </span>
              <span className="text-xs text-slate-500">{when ? fmtDateTime(when) : ''}</span>
            </summary>
            <div className="border-t border-slate-100 p-5">
              {hasFull ? <CheckResult d={payload} /> : <Group title="Details" rows={flatten(it)} />}
            </div>
          </details>
        )
      })}
    </div>
  )
}
