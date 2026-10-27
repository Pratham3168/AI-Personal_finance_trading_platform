import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Field, Input } from '../components/ui'
import { analysisApi } from '../api/analysis'
import { currentMonth, formatMonth, formatMoney, prettify } from '../utils/format'

/* ---------- generic, defensive rendering of the backend summary ---------- */

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v)
const isPercentKey = (k) => /pct|percent|rate|share/i.test(k)
const isCountKey = (k) => /count/i.test(k)

const fmtValue = (k, v) =>
  typeof v === 'number'
    ? isPercentKey(k)
      ? `${Math.round(v * 100) / 100}%`
      : isCountKey(k)
        ? String(v)
        : formatMoney(v)
    : String(v ?? '—')

// Turn an array/object value into table rows: [{ name, ...scalars }]
function toRows(value) {
  const rows = Array.isArray(value)
    ? value
    : Object.entries(value).map(([name, v]) => (isPlainObject(v) ? { name, ...v } : { name, value: v }))
  return rows.filter(isPlainObject)
}

function DataTable({ title, value }) {
  const rows = toRows(value)
  if (!rows.length) return null
  const cols = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object')
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 px-5 py-3 font-semibold text-slate-900">{prettify(title)}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{cols.map((c) => <th key={c} className="px-5 py-2.5 font-medium">{prettify(c)}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c, j) => (
                  <td key={c} className={`px-5 py-2.5 ${j === 0 ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
                    {j === 0 && typeof r[c] === 'string'
                      ? prettify(r[c])
                      : fmtValue(title === 'entryCounts' ? title : c, r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone || 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function SummaryView({ summary }) {
  const { totalIncome, totalExpenses } = summary
  const hasTotals = typeof totalIncome === 'number' && typeof totalExpenses === 'number'
  const net = hasTotals ? totalIncome - totalExpenses : null
  const skip = ['month', 'totalIncome', 'totalExpenses']

  const rest = Object.entries(summary).filter(([k]) => !skip.includes(k))
  const scalars = rest.filter(([, v]) => typeof v === 'number' || typeof v === 'string')
  const nested = rest.filter(([, v]) => v && typeof v === 'object')

  return (
    <div className="space-y-4">
      {hasTotals && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Total income" value={formatMoney(totalIncome)} tone="text-green-700" />
          <Stat label="Total expenses" value={formatMoney(totalExpenses)} />
          <Stat label={net >= 0 ? 'Left over' : 'Overspent by'} value={formatMoney(Math.abs(net))}
            tone={net >= 0 ? 'text-slate-900' : 'text-red-700'} />
        </div>
      )}
      {scalars.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {scalars.map(([k, v]) => <Stat key={k} label={prettify(k)} value={fmtValue(k, v)} />)}
        </div>
      )}
      {nested.map(([k, v]) => <DataTable key={k} title={k} value={v} />)}
    </div>
  )
}

/* ---------- AI analysis ---------- */

const ratingStyle = {
  excellent: 'bg-green-50 text-green-800 border-green-200',
  good: 'bg-blue-50 text-blue-800 border-blue-200',
  fair: 'bg-amber-50 text-amber-800 border-amber-200',
  needs_attention: 'bg-red-50 text-red-800 border-red-200',
}

function Bullets({ title, items }) {
  if (!Array.isArray(items) || !items.length) return null
  return (
    <div>
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        {items.map((t, i) => <li key={i}>{typeof t === 'string' ? t : JSON.stringify(t)}</li>)}
      </ul>
    </div>
  )
}

function AiView({ analysis }) {
  if (analysis?.raw) {
    // Backend couldn't parse the model's JSON, so show the text as-is
    return <p className="whitespace-pre-wrap text-sm text-slate-700">{analysis.raw}</p>
  }
  const h = analysis?.financialHealth
  const over = Array.isArray(analysis?.overspendingAreas) ? analysis.overspendingAreas : []
  return (
    <div className="space-y-6">
      {analysis?.overview && <p className="text-slate-700">{analysis.overview}</p>}

      {h && (
        <div className={`rounded-lg border p-4 ${ratingStyle[h.rating] || 'border-slate-200 bg-slate-50 text-slate-800'}`}>
          <p className="text-sm font-semibold">Financial health: {prettify(h.rating || 'unknown')}</p>
          {h.reason && <p className="mt-1 text-sm">{h.reason}</p>}
        </div>
      )}

      <Bullets title="Key insights" items={analysis?.keyInsights} />

      {over.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900">Areas to watch</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {over.map((o, i) => (
              <li key={i} className="rounded-lg border border-slate-200 p-3">
                <span className="font-medium text-slate-900">{prettify(o.category || 'Category')}</span>
                {o.observation && <span> — {o.observation}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Bullets title="Suggestions" items={analysis?.suggestions} />

      {analysis?.savingsTip && (
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Savings tip: </span>{analysis.savingsTip}
        </div>
      )}
    </div>
  )
}

/* ---------- page ---------- */

export default function Analysis() {
  const [month, setMonth] = useState(currentMonth())
  const [summary, setSummary] = useState(null)
  const [empty, setEmpty] = useState(false) // 404: no transactions that month
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    if (!month) return
    let active = true
    setLoading(true)
    setError('')
    setEmpty(false)
    setSummary(null)
    setAi(null)
    setAiError('')
    analysisApi
      .summary(month)
      .then((res) => active && setSummary(res.data.summary ?? res.data))
      .catch((err) => {
        if (!active) return
        if (err.status === 404) setEmpty(true)
        else setError(err.message)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [month])

  const generate = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await analysisApi.spending(month)
      setAi(res.data)
    } catch (err) {
      setAiError(
        err.status === 429
          ? 'You’ve reached the hourly limit for AI analysis. Please try again later.'
          : err.status === 404
          ? 'There are no entries for this month yet.'
          : err.status >= 500
          ? 'The AI service is temporarily unavailable. Please try again in a moment.'
          : err.message
      )
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Budget analysis</h1>
          <p className="mt-1 text-sm text-slate-600">{month ? formatMonth(month) : 'Select a month'}</p>
        </div>
        <div className="w-48">
          <Field label="Month" htmlFor="month">
            <Input id="month" type="month" max={currentMonth()} value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading summary…</p>
      ) : empty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-900">No entries for this month</p>
          <p className="mt-1 text-sm text-slate-600">Add some income and expenses to see your analysis.</p>
          <Link to="/transactions" className="mt-4 inline-block text-sm font-semibold text-blue-700">
            Add entries →
          </Link>
        </div>
      ) : summary ? (
        <>
          <SummaryView summary={summary} />

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI spending guidance</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Based on your totals and categories for this month, compared with the previous month where available.
                </p>
              </div>
              <div className="w-full sm:w-48">
                <Button onClick={generate} loading={aiLoading}>
                  {ai ? 'Regenerate' : 'Generate insights'}
                </Button>
              </div>
            </div>

            {aiError && <div className="mt-4"><Alert>{aiError}</Alert></div>}

            {ai && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <AiView analysis={ai.analysis} />
                <p className="mt-6 text-xs text-slate-500">
                  Generated by AI from your recorded figures for general information only. It is not financial advice.
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
