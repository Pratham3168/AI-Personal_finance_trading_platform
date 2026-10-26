import { useState } from 'react'
import { Alert, Button, Field, Input, Select } from './ui'
import { transactionsApi } from '../api/transactions'
import { prettify, today } from '../utils/format'

const empty = () => ({ type: 'expense', entryType: 'daily', amount: '', category: '', date: today(), paymentMethod: '', description: '' })

export default function TransactionForm({ options, onCreated }) {
  const [form, setForm] = useState(empty())
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const categories = options?.categories?.[form.type] || []

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }))
  const onChange = (e) => set(e.target.name, e.target.value)
  const setType = (type) => setForm((f) => ({ ...f, type, category: '' })) // categories differ per type

  const validate = () => {
    const e = {}
    const amt = Number(form.amount)
    if (!form.amount || !(amt > 0) || amt > 999999999) e.amount = 'Enter an amount greater than 0.'
    if (!form.category) e.category = 'Choose a category.'
    if (!form.date) e.date = 'Choose a date.'
    if (form.description.length > 255) e.description = 'Maximum 255 characters.'
    return e
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setFormError('')
    setSuccess('')
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
    if (form.description.trim()) payload.description = form.description.trim()
    if (form.paymentMethod) payload.paymentMethod = form.paymentMethod

    setLoading(true)
    try {
      await transactionsApi.create(payload)
      setSuccess('Entry saved.')
      setForm((f) => ({ ...empty(), type: f.type, entryType: f.entryType, date: f.date }))
      onCreated?.()
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message) // includes the 409 "monthly total already exists" message
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add an entry</h2>

      <div className="mt-4 inline-flex rounded-lg border border-slate-300 p-1">
        {['expense', 'income'].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${form.type === t ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {prettify(t)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {formError && <Alert>{formError}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" htmlFor="amount" error={errors.amount}>
            <Input id="amount" name="amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
              value={form.amount} onChange={onChange} error={errors.amount} />
          </Field>
          <Field label="Category" htmlFor="category" error={errors.category}>
            <Select id="category" name="category" value={form.category} onChange={onChange} error={errors.category}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c} value={c}>{prettify(c)}</option>)}
            </Select>
          </Field>
          <Field label="Date" htmlFor="date" error={errors.date}>
            <Input id="date" name="date" type="date" max={today()} value={form.date} onChange={onChange} error={errors.date} />
          </Field>
          <Field label="Payment method (optional)" htmlFor="paymentMethod" error={errors.paymentMethod}>
            <Select id="paymentMethod" name="paymentMethod" value={form.paymentMethod} onChange={onChange}>
              <option value="">Not specified</option>
              {(options?.paymentMethods || []).map((m) => <option key={m} value={m}>{prettify(m)}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Entry type" htmlFor="entryType"
          hint={form.entryType === 'monthly'
            ? 'A monthly total for the month of the date above. Only one per category per month; it replaces daily entries of that category in analysis.'
            : 'A single day’s entry.'}>
          <Select id="entryType" name="entryType" value={form.entryType} onChange={onChange}>
            <option value="daily">Daily entry</option>
            <option value="monthly">Monthly total</option>
          </Select>
        </Field>

        <Field label="Description (optional)" htmlFor="description" error={errors.description}>
          <Input id="description" name="description" maxLength={255} placeholder="e.g. Groceries at the market"
            value={form.description} onChange={onChange} error={errors.description} />
        </Field>

        <div className="sm:max-w-[12rem]">
          <Button type="submit" loading={loading}>Save entry</Button>
        </div>
      </div>
    </form>
  )
}
