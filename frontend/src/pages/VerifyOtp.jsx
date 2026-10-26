import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { Alert, Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'

const COOLDOWN = 60 // seconds, matches the backend resend cooldown

export default function VerifyOtp() {
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState(state?.message || '')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(COOLDOWN)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Opened directly without an email -> back to signup
  if (!email) return <Navigate to="/signup" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(email, otp) // stores token + user
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await authApi.resendOtp(email)
      setInfo('If your account is awaiting verification, a new code has been sent.')
      setCooldown(COOLDOWN)
    } catch (err) {
      setError(err.message)
      if (err.status === 429) setCooldown(COOLDOWN)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to <span className="font-medium text-slate-900">{email}</span>. The code
          expires in 10 minutes.
        </>
      }
      footer={
        <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {info && <Alert type="info">{info}</Alert>}
        {error && <Alert>{error}</Alert>}

        <Field label="Verification code" htmlFor="otp">
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="text-center text-lg tracking-[0.5em]"
          />
        </Field>

        <Button type="submit" loading={loading}>
          Verify and continue
        </Button>

        <Button type="button" variant="secondary" onClick={onResend} loading={resending} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </Button>
      </form>
    </AuthLayout>
  )
}
