import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { Alert, Button, Field, Input, PasswordInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [noAccountHint, setNoAccountHint] = useState(false)
  const [loading, setLoading] = useState(false)

  const justVerified = location.state?.message

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setNoAccountHint(false)

    const next = {}
    if (!form.email.trim()) next.email = 'Enter your email address.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err.status === 403 && err.body.requiresVerification) {
        // Account exists but email isn't verified yet
        navigate('/verify-otp', {
          state: { email: form.email.trim(), message: 'Please verify your email to continue.' },
        })
        return
      }
      if (err.status === 401) {
        setFormError('Incorrect email or password.')
        setNoAccountHint(true) // suggest signup in case they have no account
      } else {
        setErrors(err.fieldErrors || {})
        setFormError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-800">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {justVerified && <Alert type="info">{justVerified}</Alert>}
        {formError && <Alert>{formError}</Alert>}

        {noAccountHint && (
          <Alert type="info">
            New here? If you haven’t created an account yet,{' '}
            <Link to="/signup" className="font-semibold underline">
              sign up in under a minute
            </Link>
            .
          </Alert>
        )}

        <Field label="Email address" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com"
            value={form.email} onChange={onChange} error={errors.email} />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="Your password"
            value={form.password} onChange={onChange} error={errors.password} />
        </Field>

        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
