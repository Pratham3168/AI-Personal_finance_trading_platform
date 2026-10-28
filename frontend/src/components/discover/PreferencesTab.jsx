import { useEffect, useState } from 'react'
import { Alert, Button, Field, Input } from '../ui'
import { discoverApi } from '../../api/discover'

const DEFAULTS = { reservedAmount: 0, perPurchaseCapPct: 50, horizonYears: 3 }

export default function PreferencesTab() {
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    discoverApi
      .getPreferences()
      .then((res) => {
        const p = res.data.preferences ?? res.data
        setForm({
          reservedAmount: String(p.reservedAmount ?? DEFAULTS.reservedAmount),
          perPurchaseCapPct: String(p.perPurchaseCapPct ?? DEFAULTS.perPurchaseCapPct),
          horizonYears: String(p.horizonYears ?? DEFAULTS.horizonYears),
        })
      })
      .catch((err) => {
        if (err.status === 404) {
          setForm({ reservedAmount: '0', perPurchaseCapPct: '50', horizonYears: '3' }) // nothing saved yet
        } else setFormError(err.message)
      })
  }, [])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    const e = {}
    const r = Number(form.reservedAmount), c = Number(form.perPurchaseCapPct), h = Number(form.horizonYears)
    if (form.reservedAmount === '' || !(r >= 0) || r > 10000000000) e.reservedAmount = 'Enter an amount between 0 and 10,000,000,000.'
    if (!Number.isInteger(c) || c < 1 || c > 100) e.perPurchaseCapPct = 'Enter a whole number from 1 to 100.'
    if (!Number.isInteger(h) || h < 1 || h > 50) e.horizonYears = 'Enter a whole number from 1 to 50.'
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
      await discoverApi.savePreferences({
        reservedAmount: Number(form.reservedAmount),
        perPurchaseCapPct: Number(form.perPurchaseCapPct),
        horizonYears: Number(form.horizonYears),
      })
      setSuccess('Preferences saved. Stock results and checks now use these limits.')
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!form && !formError) return <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
  if (!form) return <Alert>{formError}</Alert>

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Purchase preferences</h2>
        <p className="mt-1 text-sm text-slate-600">These limits decide how much of your available cash is treated as investable.</p>
      </div>

      {formError && <Alert>{formError}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Reserved amount" htmlFor="reservedAmount" error={errors.reservedAmount}
          hint="Cash you want to keep aside and not invest.">
          <Input id="reservedAmount" name="reservedAmount" type="number" inputMode="decimal" min="0" step="0.01"
            value={form.reservedAmount} onChange={onChange} error={errors.reservedAmount} />
        </Field>
        <Field label="Per-purchase cap (%)" htmlFor="perPurchaseCapPct" error={errors.perPurchaseCapPct}
          hint="Largest share of your investable cash for one purchase.">
          <Input id="perPurchaseCapPct" name="perPurchaseCapPct" type="number" min="1" max="100" step="1"
            value={form.perPurchaseCapPct} onChange={onChange} error={errors.perPurchaseCapPct} />
        </Field>
        <Field label="Horizon (years)" htmlFor="horizonYears" error={errors.horizonYears}
          hint="How long you plan to hold an investment.">
          <Input id="horizonYears" name="horizonYears" type="number" min="1" max="50" step="1"
            value={form.horizonYears} onChange={onChange} error={errors.horizonYears} />
        </Field>
      </div>

      <div className="sm:max-w-[12rem]">
        <Button type="submit" loading={loading}>Save preferences</Button>
      </div>
    </form>
  )
}
