import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import PasswordStrength, { PASSWORD_RULES } from '../components/auth/PasswordStrength'
import { Alert, Button, Field, Input, PasswordInput } from '../components/ui'
import { authApi } from '../api/auth'

const sectionLabel = 'mb-4 text-xs font-semibold uppercase tracking-wider text-subtle'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    // an error is stale as soon as the user edits that field
    setErrors((prev) => ({ ...prev, [name]: undefined, ...(name === 'password' ? { confirm: undefined } : {}) }))
  }

  const validate = () => {
    const e = {}
    const name = form.fullName.trim()
    if (name.length < 2 || name.length > 100) e.fullName = 'Enter your full name (2–100 characters).'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!/^\+?\d{10,15}$/.test(form.phone.trim())) e.phone = 'Enter a phone number with 10–15 digits.'
    if (!PASSWORD_RULES.every(([, test]) => test(form.password))) e.password = 'Password does not meet all requirements.'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    return e
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    setFormError('')
    setExisting(false)
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    try {
      const email = form.email.trim()
      await authApi.signup({
        fullName: form.fullName.trim(),
        email,
        phone: form.phone.trim(),
        password: form.password,
      })
      navigate('/verify-otp', {
        state: { email, message: 'Account created successfully.' },
      })
    } catch (err) {
      if (err.status === 409) setExisting(true)
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = form.confirm.length > 0 && form.confirm === form.password

  return (
    <AuthLayout
      wide
      title="Create your account"
      subtitle="It takes less than a minute. We’ll verify your email next."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent-text hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-7">
        {formError && (
          <Alert>
            {formError}
            {existing && (
              <>
                {' '}
                <Link to="/login" className="font-semibold underline">
                  Go to sign in
                </Link>
              </>
            )}
          </Alert>
        )}

        <fieldset className="min-w-0 space-y-5">
          <legend className={sectionLabel}>Your details</legend>
          <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
            <Input id="fullName" name="fullName" autoComplete="name" placeholder="Your full name"
              value={form.fullName} onChange={onChange} error={errors.fullName} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email address" htmlFor="email" error={errors.email}>
              <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={onChange} error={errors.email} />
            </Field>
            <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="10–15 digits, optional + prefix.">
              <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="9876543210"
                value={form.phone} onChange={onChange} error={errors.phone} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-5">
          <legend className={sectionLabel}>Secure your account</legend>
          <Field label="Password" htmlFor="password" error={errors.password}>
            <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Create a password"
              value={form.password} onChange={onChange} error={errors.password} />
            <PasswordStrength password={form.password} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
            <PasswordInput id="confirm" name="confirm" autoComplete="new-password" placeholder="Re-enter your password"
              value={form.confirm} onChange={onChange} error={errors.confirm} />
            {passwordsMatch && !errors.confirm && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-positive">
                <CircleCheck className="h-4 w-4" aria-hidden /> Passwords match
              </p>
            )}
          </Field>
        </fieldset>

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
