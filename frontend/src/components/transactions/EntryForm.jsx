import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Alert, Button, Field, Input, Skeleton } from '../ui'
import Segmented from '../Segmented'
import { SheetBody, SheetFooter } from '../Sheet'
import { transactionsApi } from '../../api/transactions'
import { CURRENCY_SYMBOL, categoriesFor, categoryIcon, labelOf, shiftDate } from './categoryMeta'
import { formatMonth, today } from '../../utils/format'
import { cn } from '../../utils/cn'

const blank = (over = {}) => ({ type: 'expense', entryType: 'daily', amount: '', category: '', date: today(), paymentMethod: '', description: '', ...over })
const fromTx = (t) => ({
  type: t.type,
  entryType: t.entryType || 'daily',
  amount: String(t.amount),
  category: t.category,
  date: t.date,
  paymentMethod: t.paymentMethod || '',
  description: t.description || '',
})

function Chip({ active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        active ? 'border-accent bg-accent/12 text-fg' : 'border-line-strong text-muted hover:bg-accent/10 hover:text-fg'
      )}
    >
      {children}
    </button>
  )
}

/**
 * Add mode:  <EntryForm options onSaved onCancel onDirtyChange />
 * Edit mode: <EntryForm initial={transaction} ... />
 */
export default function EntryForm({ options, initial, onSaved, onCancel, onDirtyChange }) {
  const editing = !!initial
  const [baseline, setBaseline] = useState(() => (editing ? fromTx(initial) : blank()))
  const [form, setForm] = useState(baseline)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState('') // '' | 'close' | 'again'

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline])
  useEffect(() => onDirtyChange?.(dirty), [dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const cats = categoriesFor(options, form.type)
  const methods = options?.paymentMethods || []
  const lockedMethod = editing && !!initial.paymentMethod // the API can't clear a saved method, only change it

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }
  const setType = (type) => {
    setForm((f) => ({ ...f, type, category: categoriesFor(options, type).includes(f.category) ? f.category : '' }))
    setErrors((e) => ({ ...e, category: undefined }))
  }
  const onAmount = (e) => {
    let v = e.target.value.replace(/[^\d.]/g, '')
    const [whole, ...rest] = v.split('.')
    v = rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
    set('amount', v)
  }

  const validate = () => {
    const e = {}
    const amt = Number(form.amount)
    if (!form.amount || !(amt > 0) || amt > 999999999) e.amount = 'Enter an amount greater than 0.'
    if (!form.category) e.category = 'Choose a category.'
    if (!form.date) e.date = 'Choose a date.'
    if (form.description.length > 255) e.description = 'Maximum 255 characters.'
    return e
  }

  const submit = async (intent) => {
    setFormError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    const payload = {
      type: form.type,
      entryType: form.entryType,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    }
    const desc = form.description.trim()
    if (editing || desc) payload.description = desc
    if (form.paymentMethod) payload.paymentMethod = form.paymentMethod

    setSaving(intent)
    try {
      if (editing) {
        await transactionsApi.update(initial.id, payload)
        toast.success('Entry updated')
        onSaved({ intent: 'close' })
      } else {
        await transactionsApi.create(payload)
        toast.success('Entry added')
        if (intent === 'again') {
          const next = blank({ type: form.type, entryType: form.entryType, date: form.date })
          setBaseline(next)
          setForm(next)
          setErrors({})
          setTimeout(() => document.getElementById('entry-amount')?.focus(), 0)
        }
        onSaved({ intent })
      }
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message) // includes the 409 "monthly total already exists" message
    } finally {
      setSaving('')
    }
  }

  return (
    <form onSubmit={(ev) => { ev.preventDefault(); submit('close') }} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetBody className="space-y-6">
        {formError && <Alert>{formError}</Alert>}

        <Segmented block label="Entry kind" value={form.type} onChange={setType} options={[['expense', 'Expense'], ['income', 'Income']]} />

        <Field label="Amount" htmlFor="entry-amount" error={errors.amount}>
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-subtle">{CURRENCY_SYMBOL}</span>
            <Input
              id="entry-amount" name="amount" type="text" inputMode="decimal" autoComplete="off" placeholder="0.00"
              value={form.amount} onChange={onAmount} error={errors.amount}
              className="num py-3 pl-10 text-2xl font-semibold"
            />
          </div>
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-fg">Category</p>
          {!options ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[4.25rem]" />)}</div>
          ) : (
            <div role="group" aria-label="Category" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {cats.map((c) => {
                const Icon = categoryIcon(c)
                const sel = form.category === c
                return (
                  <button
                    key={c} type="button" aria-pressed={sel} onClick={() => set('category', c)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition',
                      sel ? 'border-accent bg-accent/12 text-fg' : 'border-line-strong text-muted hover:bg-accent/10 hover:text-fg'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', sel && 'text-accent-text')} aria-hidden />
                    <span className="leading-tight">{labelOf(c)}</span>
                  </button>
                )
              })}
            </div>
          )}
          {errors.category && <p className="mt-2 text-sm text-negative">{errors.category}</p>}
        </div>

        <Field label="Date" htmlFor="entry-date" error={errors.date}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Input id="entry-date" name="date" type="date" max={today()} value={form.date} onChange={(e) => set('date', e.target.value)} error={errors.date} />
            </div>
            <Chip active={form.date === today()} onClick={() => set('date', today())}>Today</Chip>
            <Chip active={form.date === shiftDate(today(), -1)} onClick={() => set('date', shiftDate(today(), -1))}>Yesterday</Chip>
          </div>
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-fg">Entry type</p>
          <Segmented block label="Entry type" value={form.entryType} onChange={(v) => set('entryType', v)} options={[['daily', 'Daily entry'], ['monthly', 'Monthly total']]} />
          <p className="mt-2 text-sm text-subtle">
            {form.entryType === 'monthly'
              ? `One total for all of ${form.date ? formatMonth(form.date.slice(0, 7)) : 'the month'}. Only one is allowed per category per month, and it replaces daily entries of that category in your analysis.`
              : 'A single day’s entry.'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-fg">Payment method <span className="font-normal text-subtle">(optional)</span></p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <Chip key={m} active={form.paymentMethod === m} disabled={lockedMethod && form.paymentMethod === m}
                onClick={() => set('paymentMethod', form.paymentMethod === m ? '' : m)}>
                {labelOf(m)}
              </Chip>
            ))}
          </div>
        </div>

        <Field label="Description (optional)" htmlFor="entry-desc" error={errors.description}
          hint={form.description.length > 200 ? `${form.description.length}/255` : undefined}>
          <Input id="entry-desc" name="description" maxLength={255} placeholder="e.g. Weekly groceries"
            value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />
        </Field>
      </SheetBody>

      <SheetFooter>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" block={false} onClick={onCancel}>Cancel</Button>
          {!editing && (
            <Button type="button" variant="secondary" block={false} loading={saving === 'again'} disabled={!!saving} onClick={() => submit('again')}>
              Save &amp; add another
            </Button>
          )}
          <Button type="submit" block={false} loading={saving === 'close'} disabled={!!saving}>
            {editing ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
