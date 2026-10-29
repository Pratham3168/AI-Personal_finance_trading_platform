import { useEffect, useState } from 'react'
import { Alert, Field, Input } from '../ui'
import { discoverApi } from '../../api/discover'

// The backend returns a list of { symbol, name, exchange, sector }; find it whatever the wrapper key is
const findList = (d) => (Array.isArray(d) ? d : Object.values(d || {}).find(Array.isArray) || [])

export default function SearchTab({ onCheck }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults(null)
      setError('')
      return
    }
    let active = true
    const t = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await discoverApi.search(term.slice(0, 40))
        if (active) setResults(findList(res.data))
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }, 400)
    return () => { active = false; clearTimeout(t) }
  }, [q])

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <Field label="Search by company name or symbol" htmlFor="q" hint="Type at least 2 characters.">
          <Input id="q" maxLength={40} placeholder="e.g. Reliance or INFY" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && <p className="text-sm text-slate-500">Searching…</p>}

      {results && !loading && (
        results.length === 0 ? (
          <p className="text-sm text-slate-600">No matches found. Try a different spelling, or search again in a moment.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {results.map((r) => (
                <li key={`${r.exchange}:${r.symbol}`} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <span className="font-medium text-slate-900">{r.symbol}</span>
                    {r.exchange && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{r.exchange}</span>}
                    <div className="text-sm text-slate-600">{r.name}{r.sector ? ` · ${r.sector}` : ''}</div>
                  </div>
                  <button onClick={() => onCheck(r.symbol)} className="shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-900">
                    Check fit
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  )
}
