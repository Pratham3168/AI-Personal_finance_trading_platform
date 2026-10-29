import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../ui'
import { discoverApi } from '../../api/discover'
import { formatMoney, prettify } from '../../utils/format'
import { Group, Stat } from '../investments/shared'
import { isObj, pick } from './helpers'

const money = (v) => (v == null ? '—' : formatMoney(v))

export default function CapacityTab({ goPreferences }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    discoverApi.capacity()
      .then((r) => setData(r.data))
      .catch((e) => setError({ message: e.message, status: e.status }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
  if (error) {
    return (
      <Alert>
        {error.message}
        {(error.status === 409 || error.status === 404) && (
          <> <Link to="/investments" className="font-semibold underline">Set up your investor profile</Link> and try again.</>
        )}
      </Alert>
    )
  }

  const c = data?.capacity || {}
  const how = Array.isArray(data?.howCalculated) ? data.howCalculated : []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Investable capacity" value={money(c.investableCapacity)} tone="text-green-700"
          hint="Cash you could invest after your emergency fund and reserved amount" />
        <Stat label="Per-purchase limit" value={money(c.perPurchaseLimit)}
          hint={c.perPurchaseCapPct != null ? `${c.perPurchaseCapPct}% of investable capacity` : undefined} />
        <Stat label="Cash now" value={money(c.cashNow)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Group title="Breakdown" rows={[
          ['Cash now', money(c.cashNow)],
          ['Emergency fund target', money(c.emergencyTarget)],
          ['Safe room before reserved', money(c.safeRoomBeforeReserved)],
          ['Reserved amount', money(c.reservedAmount)],
          ['Investable capacity', money(c.investableCapacity)],
        ]} />
        <Group title="Your settings & portfolio" rows={[
          ['Risk level', c.riskLevel ? prettify(c.riskLevel) : '—'],
          ['Volatility limit', c.volatilityLimitPct != null ? `${c.volatilityLimitPct}%` : '—'],
          ['Horizon', c.horizonYears != null ? `${c.horizonYears} years` : '—'],
          ['Portfolio cost basis', money(c.portfolioCostBasis)],
          ['Net worth at cost', money(c.netWorthAtCost)],
        ]} />
      </div>

      {how.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">How this is calculated</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {how.map((h, i) => (
              <li key={i}>{isObj(h) ? String(pick(h, ['description', 'text', 'label', 'step', 'message']) ?? JSON.stringify(h)) : String(h)}</li>
            ))}
          </ul>
        </div>
      )}

      {data?.notIncluded && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{data.notIncluded}</p>}

      <p className="text-sm text-slate-600">
        Reserved amount and cap come from your{' '}
        <button onClick={goPreferences} className="font-semibold text-blue-700 hover:text-blue-900">preferences</button>.
      </p>
    </div>
  )
}
