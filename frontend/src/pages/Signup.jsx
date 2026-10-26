import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { Alert, Button, Field, Input, PasswordInput } from '../components/ui'
import { authApi } from '../api/auth'

const rules = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['One lowercase letter', (p) => /[a-z]/.test(p)],
  ['One uppercase letter', (p) => /[A-Z]/.test(p)],
  ['One number', (p) => /\d/.test(p)],
]

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [existing, setExisting] = useState(false)
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    const e = {}
    const name = form.fullName.trim()
    if (name.length < 2 || name.length > 100) e.fullName = 'Enter your full name (2–100 characters).'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!/^\+?\d{10,15}$/.test(form.phone.trim())) e.phone = 'Enter a phone number with 10–15 digits.'
    if (!rules.every(([, test]) => test(form.password))) e.password = 'Password does not meet all requirements.'
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
        state: { email, message: 'Account created. We sent a 6-digit code to your email.' },
      })
    } catch (err) {
      if (err.status === 409) setExisting(true)
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute. We’ll verify your email next."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
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

        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <Input id="fullName" name="fullName" autoComplete="name" placeholder="Your full name"
            value={form.fullName} onChange={onChange} error={errors.fullName} />
        </Field>

        <Field label="Email address" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
            value={form.email} onChange={onChange} error={errors.email} />
        </Field>

        <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="10–15 digits, optional + prefix.">
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="9876543210"
            value={form.phone} onChange={onChange} error={errors.phone} />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Create a password"
            value={form.password} onChange={onChange} error={errors.password} />
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {rules.map(([label, test]) => {
              const ok = test(form.password)
              return (
                <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-700' : 'text-slate-500'}`}>
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                    {ok ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    )}
                  </svg>
                  {label}
                </li>
              )
            })}
          </ul>
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" placeholder="Re-enter your password"
            value={form.confirm} onChange={onChange} error={errors.confirm} />
        </Field>

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
