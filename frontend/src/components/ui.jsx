import { useState } from 'react'

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

const inputBase =
  'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600'

export function Input({ error, className = '', ...props }) {
  return (
    <input
      {...props}
      aria-invalid={!!error}
      className={`${inputBase} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
    />
  )
}

export function PasswordInput({ error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} error={error} type={show ? 'text' : 'password'} className="pr-16" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 px-3.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

export function Button({ loading, children, variant = 'primary', className = '', ...props }) {
  const styles =
    variant === 'primary'
      ? 'bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-400'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400'
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  )
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  }[type]
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-blue-700" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function Select({ error, children, className = '', ...props }) {
  return (
    <select
      {...props}
      aria-invalid={!!error}
      className={`${inputBase} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
    >
      {children}
    </select>
  )
}
