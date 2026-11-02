import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { Plus, Trash2, X } from 'lucide-react'
import { Alert, Button, Input, Select } from '../ui'
import { useConfirm } from '../ConfirmProvider'
import { transactionsApi } from '../../api/transactions'
import { categoriesFor, labelOf } from './categoryMeta'
import { formatMoney, today } from '../../utils/format'
import { cn } from '../../utils/cn'

const MAX_ROWS = 50
const START_ROWS = 3
const GRID = 'lg:grid lg:grid-cols-[7.5rem_minmax(0,1.3fr)_7.5rem_9.5rem_7.5rem_7.5rem_minmax(0,1.4fr)_2.5rem] lg:items-start lg:gap-2'
const compact = 'py-2 text-sm'

function Cell({ label, className, children }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-muted lg:sr-only">{label}</span>
      {children}
    </label>
  )
}

export default function BulkDialog({ open, onOpenChange, options, onSaved }) {
  const confirm = useConfirm()
  const nextId = useRef(0)
  const makeRow = (date = today()) => ({ _id: nextId.current++, type: 'expense', entryType: 'daily', amount: '', category: '', date, paymentMethod: '', description: '' })

  const [rows, setRows] = useState(() => Array.from({ length: START_ROWS }, () => makeRow()))
  const [rowErrors, setRowErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [serverErrors, setServerErrors] = useState([])
  const [loading, setLoading] = useState(false)

  const isBlank = (r) => !r.amount && !r.category && !r.description.trim()
  const used = rows.filter((r) => !isBlank(r))
  const methods = options?.paymentMethods || []

  const update = (id, name, value) => {
    setRows((rs) => rs.map((r) => (r._id === id ? { ...r, [name]: value, ...(name === 'type' ? { category: '' } : {}) } : r)))
    const next = { ...rowErrors, [id]: undefined }
    setRowErrors(next)
    if (!Object.values(next).some(Boolean)) setFormError((f) => (f === 'Please fix the highlighted rows.' ? '' : f))
  }
  const addRow = () => setRows((rs) => (rs.length >= MAX_ROWS ? rs : [...rs, makeRow(rs[rs.length - 1]?.date)]))
  const removeRow = (id) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r._id !== id) : rs))

  const income = used.filter((r) => r.type === 'income').reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const expense = used.filter((r) => r.type === 'expense').reduce((s, r) => s + (Number(r.amount) || 0), 0)

  const requestClose = async () => {
    if (used.length && !(await confirm({ title: 'Discard these entries?', description: 'Nothing has been saved yet.', confirmLabel: 'Discard', destructive: true }))) return
    onOpenChange(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setServerErrors([])
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
      toast.success(`${payload.length} ${payload.length === 1 ? 'entry' : 'entries'} added`)
      setRows(Array.from({ length: START_ROWS }, () => makeRow()))
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setFormError(err.message)
      setServerErrors(Array.isArray(err.body?.errors) ? err.body.errors : [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="bw-fade fixed inset-0 z-50 grid place-items-center bg-[rgba(3,10,30,0.45)] backdrop-blur-sm sm:p-4">
          <Dialog.Content className="bw-pop glass-hero flex h-full w-full max-w-6xl flex-col rounded-none text-fg sm:h-auto sm:max-h-[90vh] sm:rounded-3xl">
            <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
                <div>
                  <Dialog.Title className="text-lg font-semibold tracking-tight">Add several entries</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted">
                    Up to {MAX_ROWS} at once. Blank rows are ignored. Entries are saved together, so fix any error and save again.
                  </Dialog.Description>
                </div>
                <button type="button" aria-label="Close" onClick={requestClose}
                  className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-accent/10 hover:text-fg">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
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

                <div className={cn('hidden text-xs font-semibold uppercase tracking-wider text-subtle', GRID, 'lg:grid')} aria-hidden>
                  <span>Type</span><span>Category</span><span>Amount</span><span>Date</span><span>Entry</span><span>Payment</span><span>Description</span><span />
                </div>

                {rows.map((r, i) => {
                  const err = rowErrors[r._id]
                  return (
                    <div key={r._id} className={cn('rounded-xl border p-3 lg:border-0 lg:p-0', err ? 'border-negative/40 bg-negative/5' : 'border-line')}>
                      <div className="mb-2 flex items-center justify-between lg:hidden">
                        <span className="text-sm font-semibold text-fg">Entry {i + 1}</span>
                        <button type="button" onClick={() => removeRow(r._id)} disabled={rows.length === 1} className="text-sm font-medium text-negative disabled:opacity-40">Remove</button>
                      </div>
                      <div className={cn('grid grid-cols-2 gap-2', GRID)}>
                        <Cell label="Type">
                          <Select className={compact} value={r.type} onChange={(e) => update(r._id, 'type', e.target.value)}>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </Select>
                        </Cell>
                        <Cell label="Category">
                          <Select className={compact} value={r.category} onChange={(e) => update(r._id, 'category', e.target.value)}>
                            <option value="">Select</option>
                            {categoriesFor(options, r.type).map((c) => <option key={c} value={c}>{labelOf(c)}</option>)}
                          </Select>
                        </Cell>
                        <Cell label="Amount">
                          <Input className={cn(compact, 'num')} type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                            value={r.amount} onChange={(e) => update(r._id, 'amount', e.target.value)} />
                        </Cell>
                        <Cell label="Date">
                          <Input className={compact} type="date" max={today()} value={r.date} onChange={(e) => update(r._id, 'date', e.target.value)} />
                        </Cell>
                        <Cell label="Entry type">
                          <Select className={compact} value={r.entryType} onChange={(e) => update(r._id, 'entryType', e.target.value)}>
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly total</option>
                          </Select>
                        </Cell>
                        <Cell label="Payment method">
                          <Select className={compact} value={r.paymentMethod} onChange={(e) => update(r._id, 'paymentMethod', e.target.value)}>
                            <option value="">None</option>
                            {methods.map((m) => <option key={m} value={m}>{labelOf(m)}</option>)}
                          </Select>
                        </Cell>
                        <Cell label="Description" className="col-span-2 lg:col-span-1">
                          <Input className={compact} maxLength={255} placeholder="Optional" value={r.description} onChange={(e) => update(r._id, 'description', e.target.value)} />
                        </Cell>
                        <button type="button" onClick={() => removeRow(r._id)} disabled={rows.length === 1} aria-label={`Remove row ${i + 1}`}
                          className="hidden h-[2.375rem] items-center justify-center rounded-lg text-subtle transition hover:bg-negative/10 hover:text-negative disabled:opacity-30 lg:flex">
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      {err && <p className="mt-1.5 text-sm text-negative">{err}</p>}
                    </div>
                  )
                })}

                <Button type="button" variant="secondary" block={false} onClick={addRow} disabled={rows.length >= MAX_ROWS}>
                  <Plus className="h-4 w-4" aria-hidden /> Add row
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
                <p className="text-sm text-muted" aria-live="polite">
                  <span className="font-medium text-fg">{used.length}</span> {used.length === 1 ? 'entry' : 'entries'}
                  {used.length > 0 && (
                    <> · <span className="num text-positive">+{formatMoney(income)}</span> · <span className="num text-fg">−{formatMoney(expense)}</span></>
                  )}
                  <span className="text-subtle"> · {rows.length}/{MAX_ROWS} rows</span>
                </p>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" block={false} onClick={requestClose}>Cancel</Button>
                  <Button type="submit" block={false} loading={loading}>Save all</Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
