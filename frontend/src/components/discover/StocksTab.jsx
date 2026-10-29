import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Field, Input, Select } from '../ui'
import { discoverApi } from '../../api/discover'
import { formatDate, formatMoney, prettify } from '../../utils/format'
import { Empty, Stat, fmtQty } from '../investments/shared'

const LIMIT = 20
const initial = { sector: '', size: '', maxVolatility: '', excludeHeld: true, affordableOnly: true, sort: 'name', order: 'asc' }
const dash = (v, fn) => (v == null ? '—' : fn(v))

export default function StocksTab({ onCheck }) {
  const [draft, setDraft] = useState(initial)
  const [filters, setFilters] = useState(initial)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // { message, status }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await discoverApi.stocks({
        sector: filters.sector.trim(),
        size: filters.size,
        maxVolatility: filters.maxVolatility,
        excludeHeld: String(filters.excludeHeld),
        affordableOnly: String(filters.affordableOnly),
        sort: filters.sort,
        order: filters.order,
        page,
        limit: LIMIT,
      })
      setData(res.data)
    } catch (err) {
      setError({ message: err.message, status: err.status })
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const set = (e) => {
    const { name, type, checked, value } = e.target
    setDraft((d) => ({ ...d, [name]: type === 'checkbox' ? checked : value }))
  }
  const apply = (e) => {
    e.preventDefault()
    setPage(1)
    setFilters(draft)
  }
  const reset = () => { setDraft(initial); setFilters(initial); setPage(1) }

  const stocks = data?.stocks || []
  const totalPages = Math.max(1, Math.ceil((data?.totalMatches || 0) / LIMIT))

  return (
    <div className="space-y-6">
      <form onSubmit={apply} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Sector" htmlFor="sector">
            <Input id="sector" name="sector" maxLength={40} placeholder="e.g. Energy" value={draft.sector} onChange={set} />
          </Field>
          <Field label="Company size" htmlFor="size">
            <Select id="size" name="size" value={draft.size} onChange={set}>
              <option value="">Any</option>
              <option value="small">Small</option>
              <option value="mid">Mid</option>
              <option value="large">Large</option>
            </Select>
          </Field>
          <Field label="Max volatility (%)" htmlFor="maxVolatility" hint="Blank uses your risk level.">
            <Input id="maxVolatility" name="maxVolatility" type="number" min="1" max="200" step="1"
              value={draft.maxVolatility} onChange={set} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sort by" htmlFor="sort">
              <Select id="sort" name="sort" value={draft.sort} onChange={set}>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="volatility">Volatility</option>
                <option value="size">Size</option>
              </Select>
            </Field>
            <Field label="Order" htmlFor="order">
              <Select id="order" name="order" value={draft.order} onChange={set}>
                <option value="asc">Low → High</option>
                <option value="desc">High → Low</option>
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="affordableOnly" checked={draft.affordableOnly} onChange={set} className="h-4 w-4 rounded border-slate-300" />
            Only stocks I can afford
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="excludeHeld" checked={draft.excludeHeld} onChange={set} className="h-4 w-4 rounded border-slate-300" />
            Hide stocks I already hold
          </label>
          <div className="ml-auto flex gap-3">
            <div className="w-28"><Button type="button" variant="secondary" onClick={reset}>Reset</Button></div>
            <div className="w-28"><Button type="submit">Apply</Button></div>
          </div>
        </div>
      </form>

      {error && (
        <Alert>
          {error.message}
          {(error.status === 409 || error.status === 404) && (
            <> <Link to="/investments" className="font-semibold underline">Set up your investor profile</Link> and try again.</>
          )}
        </Alert>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading stocks…</p>
      ) : data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Per-purchase limit" value={data.perPurchaseLimit != null ? formatMoney(data.perPurchaseLimit) : '—'}
              hint="Most you should put into one purchase" />
            <Stat label="Matches" value={fmtQty(data.totalMatches)} hint={data.universeSize ? `of ${fmtQty(data.universeSize)} stocks screened` : undefined} />
            <Stat label="Data source" value={data.dataSource ? prettify(data.dataSource) : '—'} />
          </div>

          {stocks.length === 0 ? (
            <Empty title="No stocks match these filters">Try turning off “Only stocks I can afford” or raising the volatility limit.</Empty>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Stock</th>
                      <th className="px-5 py-3 font-medium">Sector</th>
                      <th className="px-5 py-3 font-medium">Size</th>
                      <th className="px-5 py-3 text-right font-medium">Price</th>
                      <th className="px-5 py-3 text-right font-medium">Volatility</th>
                      <th className="px-5 py-3 text-right font-medium">5-day</th>
                      <th className="px-5 py-3 text-right font-medium">Max shares</th>
                      <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stocks.map((s) => (
                      <tr key={`${s.exchange}:${s.symbol}`}>
                        <td className="px-5 py-3">
                          <span className="font-medium text-slate-900">{s.symbol}</span>
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{s.exchange}</span>
                          <div className="text-xs text-slate-500">{s.name}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-700">{s.sector || '—'}</td>
                        <td className="px-5 py-3 text-slate-700">{s.size && s.size !== 'unknown' ? prettify(s.size) : '—'}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          {dash(s.price, formatMoney)}
                          {s.priceAsOf && <div className="text-xs text-slate-500">{formatDate(s.priceAsOf)}</div>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {dash(s.volatilityPct, (v) => `${v}%`)}
                          {s.volatilityWithinRiskSetting === false && <div className="text-xs text-amber-700">Above your risk level</div>}
                        </td>
                        <td className={`px-5 py-3 text-right ${s.change5dPct > 0 ? 'text-green-700' : s.change5dPct < 0 ? 'text-red-700' : ''}`}>
                          {dash(s.change5dPct, (v) => `${v > 0 ? '+' : ''}${v}%`)}
                        </td>
                        <td className="px-5 py-3 text-right">{dash(s.maxSharesWithinLimit, fmtQty)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => onCheck(s.symbol)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                            Check fit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40">Previous</button>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
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
