import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Field, Select } from '../ui'
import { discoverApi } from '../../api/discover'
import { formatDate, formatMoney, prettify } from '../../utils/format'
import { Empty, Stat } from '../investments/shared'
import { flatten, isObj } from './helpers'

const STATUSES = ['active', 'open', 'upcoming', 'closed', 'listed', 'all']
const money = (v) => (v == null ? '—' : formatMoney(v))
const priceBand = (b) =>
  b == null ? '—' : isObj(b) ? `${money(b.min ?? b.low)} – ${money(b.max ?? b.high)}` : typeof b === 'number' ? money(b) : String(b)
// Subscription numbers are shown as given; only keys that clearly mean "times" get an x
const subFmt = (k, v) => (v == null ? '—' : typeof v === 'number' ? `${v}${/time|multiple|x$/i.test(k) ? 'x' : ''}` : String(v))

export default function IposTab({ onCheck }) {
  const [status, setStatus] = useState('active')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    discoverApi.ipos(status)
      .then((r) => active && setData(r.data))
      .catch((e) => active && setError({ message: e.message, status: e.status }))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [status])

  const ipos = data?.ipos || []

  return (
    <div className="space-y-6">
      <div className="w-48">
        <Field label="Status" htmlFor="ipo-status">
          <Select id="ipo-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{prettify(s)}</option>)}
          </Select>
        </Field>
      </div>

      {error && (
        <Alert>
          {error.message}
          {(error.status === 409 || error.status === 404) && (
            <> <Link to="/investments" className="font-semibold underline">Set up your investor profile</Link> and try again.</>
          )}
        </Alert>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading IPOs…</p>
      ) : data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Per-purchase limit" value={money(data.perPurchaseLimit)} hint="Most you should put into one purchase" />
            <Stat label="IPOs shown" value={String(ipos.length)} hint={data.dataSource ? `Source: ${prettify(data.dataSource)}` : undefined} />
          </div>

          {ipos.length === 0 ? (
            <Empty title="No IPOs found">There are no IPOs with this status right now. Try “All”.</Empty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {ipos.map((ipo, i) => {
                const subRows = isObj(ipo.subscription) ? flatten(ipo.subscription, subFmt) : []
                return (
                  <div key={ipo.id ?? i} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{ipo.name}</h3>
                        <p className="text-sm text-slate-500">{[ipo.industry, ipo.type && prettify(ipo.type)].filter(Boolean).join(' · ') || ' '}</p>
                      </div>
                      {ipo.status && (
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{prettify(ipo.status)}</span>
                      )}
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div><dt className="text-slate-500">Price band</dt><dd className="font-medium text-slate-900">{priceBand(ipo.priceBand)}</dd></div>
                      <div><dt className="text-slate-500">Lot size</dt><dd className="font-medium text-slate-900">{ipo.lotSize != null ? `${ipo.lotSize} shares` : '—'}</dd></div>
                      <div><dt className="text-slate-500">Cost of one lot</dt><dd className="font-medium text-slate-900">{money(ipo.costOfOneLot)}</dd></div>
                      <div><dt className="text-slate-500">Issue size</dt><dd className="font-medium text-slate-900">{ipo.issueSizeCr != null ? `₹${ipo.issueSizeCr} Cr` : '—'}</dd></div>
                    </dl>

                    <div className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                      ipo.oneLotWithinYourLimit === true ? 'bg-green-50 text-green-800'
                      : ipo.oneLotWithinYourLimit === false ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'}`}>
                      {ipo.oneLotWithinYourLimit === true
                        ? `One lot is within your limit${ipo.maxLotsWithinYourLimit != null ? ` (up to ${ipo.maxLotsWithinYourLimit} lots)` : ''}.`
                        : ipo.oneLotWithinYourLimit === false
                        ? 'One lot is above your per-purchase limit.'
                        : 'Fit with your limit is not available.'}
                    </div>

                    {subRows.length > 0 && (
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer font-medium text-slate-700">Subscription</summary>
                        <dl className="mt-2 divide-y divide-slate-100">
                          {subRows.map(([k, v]) => (
                            <div key={k} className="flex justify-between py-1.5"><dt className="text-slate-600">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>
                          ))}
                        </dl>
                      </details>
                    )}

                    <div className="mt-4 flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">{ipo.asOf ? `As of ${formatDate(String(ipo.asOf).slice(0, 10))}` : ''}</span>
                      {ipo.id && (
                        <button onClick={() => onCheck({ kind: 'ipo', ipoId: ipo.id, ipoName: ipo.name })}
                          className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                          Check fit
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {(data.note || data.disclaimer) && (
            <p className="text-xs text-slate-500">{[data.note, data.disclaimer].filter(Boolean).join(' ')}</p>
          )}
        </>
      )}
    </div>
  )
}
