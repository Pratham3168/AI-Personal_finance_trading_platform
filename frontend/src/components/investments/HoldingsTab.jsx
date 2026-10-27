import { useEffect, useState } from 'react'
import { Alert } from '../ui'
import { investmentsApi } from '../../api/investments'
import { formatMoney } from '../../utils/format'
import { Empty, Stat, fmtPct, fmtQty, gainTone, signedMoney } from './shared'

const th = 'px-5 py-3 font-medium'

export default function HoldingsTab({ goToLedger }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    investmentsApi.holdings().then((r) => setData(r.data)).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Loading holdings…</p>
  if (error) return <Alert>{error}</Alert>
  if (!data) return null

  const { holdings = [], closedPositions = [], totals = {}, ledgerProblems = [] } = data

  return (
    <div className="space-y-6">
      {ledgerProblems.length > 0 && (
        <Alert>
          <p className="font-semibold">Some ledger entries need attention:</p>
          <ul className="mt-1 list-disc pl-5">{ledgerProblems.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cost basis" value={formatMoney(totals.costBasisTotal)} hint="Total paid for current holdings" />
        <Stat label="Realized gain" value={signedMoney(totals.realizedGainTotal || 0)} tone={gainTone(totals.realizedGainTotal)} />
        <Stat label="Dividends" value={formatMoney(totals.dividendsTotal)} />
        <Stat label="Fees paid" value={formatMoney(totals.feesTotal)} />
      </div>

      {holdings.length === 0 ? (
        <Empty title="No current holdings">
          Record a purchase in the{' '}
          <button onClick={goToLedger} className="font-semibold text-blue-700">ledger</button> to see it here.
        </Empty>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900">Current holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className={th}>Stock</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Avg cost</th>
                  <th className={`${th} text-right`}>Total cost</th>
                  <th className={`${th} text-right`}>% of portfolio</th>
                  <th className={`${th} text-right`}>Realized gain</th>
                  <th className={`${th} text-right`}>Dividends</th>
                  <th className={`${th} text-right`}>Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holdings.map((h) => (
                  <tr key={`${h.exchange}:${h.symbol}`}>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{h.symbol}</span>
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{h.exchange}</span>
                      {h.companyName && <div className="text-xs text-slate-500">{h.companyName}</div>}
                    </td>
                    <td className="px-5 py-3 text-right">{fmtQty(h.quantity)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(h.averageCost)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatMoney(h.totalCost)}</td>
                    <td className="px-5 py-3 text-right">{fmtPct(h.pctOfPortfolioCost)}</td>
                    <td className={`px-5 py-3 text-right ${gainTone(h.realizedGain)}`}>{signedMoney(h.realizedGain)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(h.dividends)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(h.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {closedPositions.length > 0 && (
        <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer px-5 py-3 font-semibold text-slate-900">
            Closed positions ({closedPositions.length})
          </summary>
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className={th}>Stock</th>
                  <th className={`${th} text-right`}>Realized gain</th>
                  <th className={`${th} text-right`}>Dividends</th>
                  <th className={`${th} text-right`}>Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closedPositions.map((h) => (
                  <tr key={`${h.exchange}:${h.symbol}`}>
                    <td className="px-5 py-3 font-medium text-slate-900">{h.symbol} <span className="text-xs text-slate-500">{h.exchange}</span></td>
                    <td className={`px-5 py-3 text-right ${gainTone(h.realizedGain)}`}>{signedMoney(h.realizedGain)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(h.dividends)}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(h.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p className="text-xs text-slate-500">
        Holdings are valued at the price you paid (average cost). Live market prices are not available.
      </p>
    </div>
  )
}
