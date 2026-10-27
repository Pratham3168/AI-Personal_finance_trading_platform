import { useState } from 'react'
import { Alert, Button, Field, Input, Select } from '../ui'
import { investmentsApi } from '../../api/investments'
import { currentMonth } from '../../utils/format'

export default function ProfileForm({ initial, onSaved }) {
  const [form, setForm] = useState({
    openingCash: initial ? String(initial.openingCash) : '',
    openingCashMonth: initial?.openingCashMonth || currentMonth(),
    emergencyFundMonths: String(initial?.emergencyFundMonths ?? 3),
    riskLevel: initial?.riskLevel || 'medium',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    const e = {}
    const cash = Number(form.openingCash)
    const months = Number(form.emergencyFundMonths)
    if (form.openingCash === '' || !(cash >= 0) || cash > 10000000000) e.openingCash = 'Enter an amount between 0 and 10,000,000,000.'
    if (!/^\d{4}-\d{2}$/.test(form.openingCashMonth)) e.openingCashMonth = 'Choose a month.'
    if (!Number.isInteger(months) || months < 0 || months > 24) e.emergencyFundMonths = 'Enter a whole number from 0 to 24.'
    return e
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setFormError('')
    setSuccess('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    try {
      const res = await investmentsApi.saveProfile({
        openingCash: Number(form.openingCash),
        openingCashMonth: form.openingCashMonth,
        emergencyFundMonths: Number(form.emergencyFundMonths),
        riskLevel: form.riskLevel,
      })
      setSuccess('Profile saved.')
      onSaved?.(res.data.profile)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {formError && <Alert>{formError}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Opening cash" htmlFor="openingCash" error={errors.openingCash}
          hint="Cash you had available at the start of the month below.">
          <Input id="openingCash" name="openingCash" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
            value={form.openingCash} onChange={onChange} error={errors.openingCash} />
        </Field>
        <Field label="Opening month" htmlFor="openingCashMonth" error={errors.openingCashMonth}
          hint="Cash and investments are calculated from this month onward.">
          <Input id="openingCashMonth" name="openingCashMonth" type="month" max={currentMonth()}
            value={form.openingCashMonth} onChange={onChange} error={errors.openingCashMonth} />
        </Field>
        <Field label="Emergency fund (months of expenses)" htmlFor="emergencyFundMonths" error={errors.emergencyFundMonths}
          hint="How many months of expenses you want kept aside before investing.">
          <Input id="emergencyFundMonths" name="emergencyFundMonths" type="number" min="0" max="24" step="1"
            value={form.emergencyFundMonths} onChange={onChange} error={errors.emergencyFundMonths} />
        </Field>
        <Field label="Risk level" htmlFor="riskLevel" error={errors.riskLevel}
          hint="Saved on your profile for reference. It is not used to generate recommendations.">
          <Select id="riskLevel" name="riskLevel" value={form.riskLevel} onChange={onChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>
      </div>

      <div className="sm:max-w-[12rem]">
        <Button type="submit" loading={loading}>{initial ? 'Save changes' : 'Save profile'}</Button>
      </div>
    </form>
  )
}
