import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import OtpInput from '../components/auth/OtpInput'
import { Alert, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'

const COOLDOWN = 60 // seconds, matches the backend resend cooldown

export default function VerifyOtp() {
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const email = state?.email
  const verifyRef = useRef(null)

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
      setOtp('')
    } catch (err) {
      setError(err.message)
      if (err.status === 429) setCooldown(COOLDOWN)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <span className="font-medium text-fg">{email}</span>. It expires in 10 minutes.
        </>
      }
      footer={
        <>
          Wrong email?{' '}
          <Link to="/signup" className="font-semibold text-accent-text hover:underline">
            Start over
          </Link>
          <span className="mx-2 text-subtle" aria-hidden>·</span>
          <Link to="/login" className="font-semibold text-accent-text hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {info && <Alert type="info">{info}</Alert>}
        {error && <Alert>{error}</Alert>}

        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v)
            if (error) setError('')
          }}
          onComplete={() => verifyRef.current?.focus()}
          error={!!error}
          disabled={loading}
          autoFocus
        />

        <div className="space-y-3">
          <Button ref={verifyRef} type="submit" loading={loading}>
            Verify and continue
          </Button>
          <Button type="button" variant="secondary" onClick={onResend} loading={resending} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Button>
        </div>

        <p className="text-center text-xs text-subtle">Can’t find it? Check your spam or junk folder.</p>
      </form>
    </AuthLayout>
  )
}
