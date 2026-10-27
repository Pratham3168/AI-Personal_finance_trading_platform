import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Field, Input, Select } from '../ui'
import { investmentsApi } from '../../api/investments'
import { formatDate, formatMoney, prettify, today } from '../../utils/format'
import { fmtQty } from './shared'

const LIMIT = 10
const emptyForm = () => ({
  type: 'buy', symbol: '', exchange: 'NSE', companyName: '', quantity: '', pricePerUnit: '', amount: '', fees: '', date: today(), note: '',
})
const typeStyle = {
  buy: 'bg-blue-50 text-blue-800',
  sell: 'bg-amber-50 text-amber-800',
  dividend: 'bg-green-50 text-green-800',
}

/* ---------------- add form ---------------- */
function EntryForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [duplicate, setDuplicate] = useState(false)
  const [loading, setLoading] = useState(false)

  const isDividend = form.type === 'dividend'
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    const e = {}
    const sym = form.symbol.trim()
    if (sym.length < 1 || sym.length > 20) e.symbol = 'Enter the stock symbol (up to 20 characters).'
    if (!form.date) e.date = 'Choose a date.'
    if (form.companyName.length > 100) e.companyName = 'Maximum 100 characters.'
    if (form.note.length > 255) e.note = 'Maximum 255 characters.'
    if (isDividend) {
      if (!(Number(form.amount) > 0)) e.amount = 'Enter the dividend amount.'
    } else {
      const q = Number(form.quantity)
      if (!Number.isInteger(q) || q < 1) e.quantity = 'Enter a whole number of shares (1 or more).'
      if (!(Number(form.pricePerUnit) > 0)) e.pricePerUnit = 'Enter a price greater than 0.'
      if (form.fees !== '' && !(Number(form.fees) >= 0)) e.fees = 'Fees cannot be negative.'
    }
    return e
  }

  const submit = async (allowDuplicate = false) => {
    setFormError('')
    setSuccess('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    const payload = { type: form.type, symbol: form.symbol.trim().toUpperCase(), exchange: form.exchange, date: form.date }
    if (form.companyName.trim()) payload.companyName = form.companyName.trim()
    if (form.note.trim()) payload.note = form.note.trim()
    if (isDividend) {
      payload.amount = Number(form.amount)
    } else {
      payload.quantity = Number(form.quantity)
      payload.pricePerUnit = Number(form.pricePerUnit)
      payload.fees = Number(form.fees || 0)
    }
    if (allowDuplicate) payload.allowDuplicate = true

    setLoading(true)
    try {
      await investmentsApi.addEntry(payload)
      setSuccess('Entry saved.')
      setDuplicate(false)
      setForm((f) => ({ ...emptyForm(), type: f.type, exchange: f.exchange, date: f.date }))
      onSaved?.()
    } catch (err) {
      if (err.status === 409) setDuplicate(true) // looks like an existing entry
      else setDuplicate(false)
      setErrors(err.fieldErrors || {})
      setFormError(err.message) // e.g. 422 "selling more than held"
    } finally {
      setLoading(false)
    }
  }

  const est =
    !isDividend && Number(form.quantity) > 0 && Number(form.pricePerUnit) > 0
      ? Number(form.quantity) * Number(form.pricePerUnit) + (form.type === 'buy' ? 1 : -1) * Number(form.fees || 0)
      : null

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false) }} noValidate
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Record an entry</h2>
      <p className="mt-1 text-sm text-slate-600">
        Only record transactions that have actually happened. Entries change your holdings and cash.
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-slate-300 p-1">
        {['buy', 'sell', 'dividend'].map((t) => (
          <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${form.type === t ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {prettify(t)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {formError && (
          <Alert type={duplicate ? 'info' : 'error'}>
            {formError}
            {duplicate && (
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => submit(true)} disabled={loading}
                  className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                  Add anyway
                </button>
                <button type="button" onClick={() => { setDuplicate(false); setFormError('') }}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-900">
                  Cancel
                </button>
              </div>
            )}
          </Alert>
        )}
        {success && <Alert type="success">{success}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Stock symbol" htmlFor="symbol" error={errors.symbol}>
            <Input id="symbol" name="symbol" placeholder="e.g. INFY" maxLength={20} className="uppercase"
              value={form.symbol} onChange={onChange} error={errors.symbol} />
          </Field>
          <Field label="Exchange" htmlFor="exchange" error={errors.exchange}>
            <Select id="exchange" name="exchange" value={form.exchange} onChange={onChange}>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </Select>
          </Field>
          <Field label="Company name (optional)" htmlFor="companyName" error={errors.companyName}>
            <Input id="companyName" name="companyName" maxLength={100} value={form.companyName} onChange={onChange} error={errors.companyName} />
          </Field>
          <Field label="Date" htmlFor="date" error={errors.date}>
            <Input id="date" name="date" type="date" max={today()} value={form.date} onChange={onChange} error={errors.date} />
          </Field>

          {isDividend ? (
            <Field label="Dividend amount" htmlFor="amount" error={errors.amount}>
              <Input id="amount" name="amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                value={form.amount} onChange={onChange} error={errors.amount} />
            </Field>
          ) : (
            <>
              <Field label="Quantity (shares)" htmlFor="quantity" error={errors.quantity}>
                <Input id="quantity" name="quantity" type="number" inputMode="numeric" min="1" step="1" placeholder="0"
                  value={form.quantity} onChange={onChange} error={errors.quantity} />
              </Field>
              <Field label="Price per share" htmlFor="pricePerUnit" error={errors.pricePerUnit}>
                <Input id="pricePerUnit" name="pricePerUnit" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                  value={form.pricePerUnit} onChange={onChange} error={errors.pricePerUnit} />
              </Field>
              <Field label="Fees & charges (optional)" htmlFor="fees" error={errors.fees}>
                <Input id="fees" name="fees" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                  value={form.fees} onChange={onChange} error={errors.fees} />
              </Field>
            </>
          )}
        </div>

        {est !== null && (
          <p className="text-sm text-slate-600">
            {form.type === 'buy' ? 'Total cost' : 'Net proceeds'} (including fees):{' '}
            <span className="font-semibold text-slate-900">{formatMoney(est)}</span>
          </p>
        )}

        <Field label="Note (optional)" htmlFor="note" error={errors.note}>
          <Input id="note" name="note" maxLength={255} value={form.note} onChange={onChange} error={errors.note} />
        </Field>

        <div className="sm:max-w-[12rem]">
          <Button type="submit" loading={loading}>Save entry</Button>
        </div>
      </div>
    </form>
  )
}

/* ---------------- list ---------------- */
export default function LedgerTab() {
  const [filters, setFilters] = useState({ symbol: '', type: '', month: '' })
  const [symbolInput, setSymbolInput] = useState('')
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  // debounce the symbol filter
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      setFilters((f) => ({ ...f, symbol: symbolInput.trim().toUpperCase() }))
    }, 400)
    return () => clearTimeout(t)
  }, [symbolInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await investmentsApi.listEntries({ ...filters, page, limit: LIMIT })
      const d = res.data
      const list = d.entries ?? d.transactions ?? []
      setEntries(list)
      setPagination(d.pagination ?? { page, totalPages: 1, total: list.length })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const onFilter = (e) => {
    setPage(1)
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const onSaved = () => (page === 1 ? load() : setPage(1))

  const onDelete = async (id) => {
    if (!window.confirm('Delete this entry? This will change your holdings and cash.')) return
    setDeletingId(id)
    setError('')
    try {
      await investmentsApi.deleteEntry(id)
      if (entries.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (err) {
      // 409: later entries depend on this one (e.g. a later sell needs these shares)
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const th = 'px-5 py-3 font-medium'
  return (
    <div className="space-y-6">
      <EntryForm onSaved={onSaved} />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Your ledger</h2>
          <div className="flex flex-wrap gap-3">
            <Field label="Symbol" htmlFor="f-symbol">
              <Input id="f-symbol" placeholder="All" className="w-28 uppercase" value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)} />
            </Field>
            <Field label="Type" htmlFor="f-type">
              <Select id="f-type" name="type" value={filters.type} onChange={onFilter}>
                <option value="">All</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="dividend">Dividend</option>
              </Select>
            </Field>
            <Field label="Month" htmlFor="f-month">
              <Input id="f-month" name="month" type="month" value={filters.month} onChange={onFilter} />
            </Field>
          </div>
        </div>

        {error && <div className="p-5 pb-0"><Alert>{error}</Alert></div>}

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Type</th>
                  <th className={th}>Stock</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Price</th>
                  <th className={`${th} text-right`}>Fees</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700">{formatDate(t.date)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeStyle[t.type]}`}>{prettify(t.type)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{t.symbol}</span>
                      <span className="ml-2 text-xs text-slate-500">{t.exchange}</span>
                      {t.note && <div className="text-xs text-slate-500">{t.note}</div>}
                    </td>
                    <td className="px-5 py-3 text-right">{t.quantity != null ? fmtQty(t.quantity) : '—'}</td>
                    <td className="px-5 py-3 text-right">{t.pricePerUnit != null ? formatMoney(t.pricePerUnit) : '—'}</td>
                    <td className="px-5 py-3 text-right">{t.fees ? formatMoney(t.fees) : '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">{formatMoney(t.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => onDelete(t.id)} disabled={deletingId === t.id}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">
                        {deletingId === t.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
            <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
