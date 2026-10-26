import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TransactionForm from '../components/TransactionForm'
import { Alert, Field, Input, Select } from '../components/ui'
import { transactionsApi } from '../api/transactions'
import { formatDate, formatMoney, prettify } from '../utils/format'

const LIMIT = 10

export default function Transactions() {
  const [options, setOptions] = useState(null)
  const [filters, setFilters] = useState({ month: '', type: '' })
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ transactions: [], pagination: { page: 1, totalPages: 0, total: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    transactionsApi.categories().then((r) => setOptions(r.data)).catch((e) => setError(e.message))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await transactionsApi.list({ ...filters, page, limit: LIMIT })
      setData(res.data)
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

  const onCreated = () => (page === 1 ? load() : setPage(1))

  const onDelete = async (id) => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await transactionsApi.remove(id)
      // go back a page if we just deleted the last item on this page
      if (data.transactions.length === 1 && page > 1) setPage(page - 1)
      else load()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const { transactions, pagination } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Income & Expenses</h1>
        <p className="mt-1 text-sm text-slate-600">
          Record your entries here. Once you have some, see your <Link to="/analysis" className="font-semibold text-blue-700">budget analysis</Link>.
        </p>
      </div>

      <TransactionForm options={options} onCreated={onCreated} />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Your entries</h2>
          <div className="flex gap-3">
            <Field label="Month" htmlFor="f-month">
              <Input id="f-month" name="month" type="month" value={filters.month} onChange={onFilter} />
            </Field>
            <Field label="Type" htmlFor="f-type">
              <Select id="f-type" name="type" value={filters.type} onChange={onFilter}>
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Select>
            </Field>
          </div>
        </div>

        {error && <div className="p-5 pb-0"><Alert>{error}</Alert></div>}

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No entries found. Add your first one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700">{formatDate(t.date)}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{prettify(t.category)}</span>
                      {t.entryType === 'monthly' && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Monthly total</span>
                      )}
                      {t.description && <div className="text-xs text-slate-500">{t.description}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{t.paymentMethod ? prettify(t.paymentMethod) : '—'}</td>
                    <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-700' : 'text-slate-900'}`}>
                      {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount)}
                    </td>
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
