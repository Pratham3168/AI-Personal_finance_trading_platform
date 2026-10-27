import { useRef, useState } from 'react'
import { Alert, Button, Input, Select } from './ui'
import { transactionsApi } from '../api/transactions'
import { prettify, today } from '../utils/format'

const MAX_ROWS = 50
const START_ROWS = 3

function Label({ children }) {
  return <span className="mb-1 block text-xs font-medium text-slate-600">{children}</span>
}

export default function BulkEntryForm({ options, onSaved }) {
  const nextId = useRef(0)
  const blank = (date = today()) => ({
    _id: nextId.current++, type: 'expense', entryType: 'daily', amount: '', category: '', date, paymentMethod: '', description: '',
  })

  const [rows, setRows] = useState(() => Array.from({ length: START_ROWS }, () => blank()))
  const [rowErrors, setRowErrors] = useState({}) // { [_id]: message }
  const [formError, setFormError] = useState('')
  const [serverErrors, setServerErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (id, name, value) =>
    setRows((rs) => rs.map((r) => (r._id === id ? { ...r, [name]: value, ...(name === 'type' ? { category: '' } : {}) } : r)))

  const addRow = () => setRows((rs) => (rs.length >= MAX_ROWS ? rs : [...rs, blank(rs[rs.length - 1]?.date)]))
  const removeRow = (id) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r._id !== id) : rs))

  // A row counts as "in use" once amount or category is filled; fully blank rows are ignored
  const isBlank = (r) => !r.amount && !r.category && !r.description.trim()

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setServerErrors([])
    setSuccess('')

    const used = rows.filter((r) => !isBlank(r))
    if (!used.length) {
      setFormError('Fill in at least one row.')
      return
    }

    const errs = {}
    used.forEach((r) => {
      const amt = Number(r.amount)
      if (!r.amount || !(amt > 0) || amt > 999999999) errs[r._id] = 'Enter an amount greater than 0.'
      else if (!r.category) errs[r._id] = 'Choose a category.'
      else if (!r.date) errs[r._id] = 'Choose a date.'
    })
    setRowErrors(errs)
    if (Object.keys(errs).length) {
      setFormError('Please fix the highlighted rows.')
      return
    }

    const payload = used.map((r) => {
      const t = { type: r.type, entryType: r.entryType, amount: Number(r.amount), category: r.category, date: r.date, description: r.description.trim() }
      if (r.paymentMethod) t.paymentMethod = r.paymentMethod
      return t
    })

    setLoading(true)
    try {
      await transactionsApi.bulk(payload)
      setSuccess(`${payload.length} ${payload.length === 1 ? 'entry' : 'entries'} saved.`)
      setRows(Array.from({ length: START_ROWS }, () => blank()))
      setRowErrors({})
      onSaved?.()
    } catch (err) {
      setFormError(err.message)
      setServerErrors(Array.isArray(err.body?.errors) ? err.body.errors : [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add multiple entries</h2>
      <p className="mt-1 text-sm text-slate-600">
        Add up to {MAX_ROWS} entries in one go. Blank rows are ignored. Entries are saved together, so fix any
        error and submit again.
      </p>

      <div className="mt-5 space-y-4">
        {formError && (
          <Alert>
            {formError}
            {serverErrors.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {serverErrors.map((e, i) => <li key={i}>{e.field ? `${e.field}: ` : ''}{e.message}</li>)}
              </ul>
            )}
          </Alert>
        )}
        {success && <Alert type="success">{success}</Alert>}

        {rows.map((r, i) => {
          const cats = options?.categories?.[r.type] || []
          const err = rowErrors[r._id]
          return (
            <div key={r._id} className={`rounded-lg border p-4 ${err ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Entry {i + 1}</span>
                <button type="button" onClick={() => removeRow(r._id)} disabled={rows.length === 1}
                  className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-40">
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                <label><Label>Type</Label>
                  <Select value={r.type} onChange={(e) => update(r._id, 'type', e.target.value)}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </Select>
                </label>
                <label className="md:col-span-2"><Label>Category</Label>
                  <Select value={r.category} onChange={(e) => update(r._id, 'category', e.target.value)}>
                    <option value="">Select</option>
                    {cats.map((c) => <option key={c} value={c}>{prettify(c)}</option>)}
                  </Select>
                </label>
                <label><Label>Amount</Label>
                  <Input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                    value={r.amount} onChange={(e) => update(r._id, 'amount', e.target.value)} />
                </label>
                <label><Label>Date</Label>
                  <Input type="date" max={today()} value={r.date} onChange={(e) => update(r._id, 'date', e.target.value)} />
                </label>
                <label><Label>Entry type</Label>
                  <Select value={r.entryType} onChange={(e) => update(r._id, 'entryType', e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly total</option>
                  </Select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label><Label>Payment method</Label>
                  <Select value={r.paymentMethod} onChange={(e) => update(r._id, 'paymentMethod', e.target.value)}>
                    <option value="">Not specified</option>
                    {(options?.paymentMethods || []).map((m) => <option key={m} value={m}>{prettify(m)}</option>)}
                  </Select>
                </label>
                <label className="sm:col-span-2"><Label>Description</Label>
                  <Input maxLength={255} placeholder="Optional" value={r.description}
                    onChange={(e) => update(r._id, 'description', e.target.value)} />
                </label>
              </div>

              {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            </div>
          )
        })}

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-44">
            <Button type="button" variant="secondary" onClick={addRow} disabled={rows.length >= MAX_ROWS}>+ Add another row</Button>
          </div>
          <div className="w-full sm:w-44">
            <Button type="submit" loading={loading}>Save all</Button>
          </div>
          <span className="text-sm text-slate-500">{rows.length} / {MAX_ROWS} rows</span>
        </div>
      </div>
    </form>
  )
}
