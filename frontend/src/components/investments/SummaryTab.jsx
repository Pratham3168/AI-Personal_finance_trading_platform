import { useEffect, useState } from 'react'
import { Alert, Field, Input } from '../ui'
import { investmentsApi } from '../../api/investments'
import { currentMonth, formatMoney, formatMonth } from '../../utils/format'
import { Group, Stat, fmtPct, gainTone, signedMoney } from './shared'

export default function SummaryTab({ profile }) {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!month) return
    let active = true
    setLoading(true)
    setError('')
    setData(null)
    investmentsApi
      .summary(month)
      .then((res) => active && setData(res.data.summary))
      .catch((err) => {
        if (!active) return
        // 422: month is before the opening month. 409: profile missing.
        setError(
          err.status === 422
            ? `Choose ${formatMonth(profile.openingCashMonth)} or later. Your opening cash starts in that month.`
            : err.message
        )
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [month, profile.openingCashMonth])

  const s = data
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-slate-600">{month ? formatMonth(month) : 'Select a month'}</p>
        <div className="w-48">
          <Field label="Month" htmlFor="sum-month">
            <Input id="sum-month" type="month" min={profile.openingCashMonth} max={currentMonth()}
              value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && <p className="py-10 text-center text-sm text-slate-500">Loading summary…</p>}

      {s && (
        <>
          {s.portfolio.concentrationWarning && s.portfolio.largestHolding && (
            <Alert type="info">
              <strong>Concentration notice:</strong> {s.portfolio.largestHolding.symbol} makes up{' '}
              {fmtPct(s.portfolio.largestHolding.pctOfPortfolioCost)} of your portfolio at cost, above the 40% guideline.
              This is for information only.
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Cash at month end" value={formatMoney(s.cash.cashAtMonthEnd)} />
            <Stat label="Emergency fund target" value={formatMoney(s.emergencyFund.target)}
              hint={`${s.emergencyFund.months} months of average expenses`} />
            <Stat label="Safe-to-invest room" value={formatMoney(s.emergencyFund.safeToInvestRoom)}
              tone={s.emergencyFund.safeToInvestRoom > 0 ? 'text-green-700' : 'text-slate-900'}
              hint="Cash above your emergency fund target" />
          </div>

          {s.emergencyFund.shortfall > 0 && (
            <Alert type="info">
              Your cash is {formatMoney(s.emergencyFund.shortfall)} below your emergency fund target, so there is no
              safe-to-invest room this month.
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Group title="Income & expenses" rows={[
              ['Total income', formatMoney(s.incomeAndExpenses.totalIncome)],
              ['Consumption expenses', formatMoney(s.incomeAndExpenses.consumptionExpenses)],
              ['Left from income', signedMoney(s.incomeAndExpenses.leftFromIncome), gainTone(s.incomeAndExpenses.leftFromIncome)],
              ['Savings rate', fmtPct(s.incomeAndExpenses.savingsRatePct)],
              ['Other savings outflow', formatMoney(s.incomeAndExpenses.otherSavingsOutflow)],
            ]} />
            <Group title="Investment activity" rows={[
              ['Bought', formatMoney(s.investments.boughtAmount)],
              ['Buy fees', formatMoney(s.investments.buyFees)],
              ['Sold (net proceeds)', formatMoney(s.investments.soldProceedsNet)],
              ['Sell fees', formatMoney(s.investments.sellFees)],
              ['Dividends received', formatMoney(s.investments.dividendsReceived)],
              ['Realized gain', signedMoney(s.investments.realizedGainInMonth), gainTone(s.investments.realizedGainInMonth)],
              ['Net cash to investments', formatMoney(s.investments.netCashToInvestments)],
            ]} />
            <Group title="Cash" rows={[
              ['Opening cash', formatMoney(s.cash.openingCash)],
              ['Opening month', formatMonth(s.cash.openingCashMonth)],
              ['Cash at month end', formatMoney(s.cash.cashAtMonthEnd)],
            ]} />
            <Group title="Portfolio (at cost)" rows={[
              ['Holdings', String(s.portfolio.holdingsCount)],
              ['Cost basis', formatMoney(s.portfolio.costBasisTotal)],
              ['Largest holding', s.portfolio.largestHolding ? `${s.portfolio.largestHolding.symbol} (${fmtPct(s.portfolio.largestHolding.pctOfPortfolioCost)})` : '—'],
              ['Net worth at cost', formatMoney(s.portfolio.netWorthAtCost)],
              ['Invested share of net worth', fmtPct(s.portfolio.investedPctOfNetWorth)],
            ]} />
          </div>

          <Group title="Emergency fund details" rows={[
            ['Average monthly expenses', formatMoney(s.emergencyFund.averageMonthlyExpenses)],
            ['Months of data used', s.emergencyFund.expenseMonthsUsed?.length ? s.emergencyFund.expenseMonthsUsed.map(formatMonth).join(', ') : '—'],
            ['Target', formatMoney(s.emergencyFund.target)],
            ['Shortfall', formatMoney(s.emergencyFund.shortfall)],
          ]} />

          {s.notes?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900">Notes</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {s.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
