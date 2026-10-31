// // import { useState } from 'react'

// // export function Field({ label, error, hint, children, htmlFor }) {
// //   return (
// //     <div>
// //       <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
// //         {label}
// //       </label>
// //       {children}
// //       {error ? (
// //         <p className="mt-1.5 text-sm text-red-600">{error}</p>
// //       ) : hint ? (
// //         <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
// //       ) : null}
// //     </div>
// //   )
// // }

// // const inputBase =
// //   'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600'

// // export function Input({ error, className = '', ...props }) {
// //   return (
// //     <input
// //       {...props}
// //       aria-invalid={!!error}
// //       className={`${inputBase} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
// //     />
// //   )
// // }

// // export function PasswordInput({ error, ...props }) {
// //   const [show, setShow] = useState(false)
// //   return (
// //     <div className="relative">
// //       <Input {...props} error={error} type={show ? 'text' : 'password'} className="pr-16" />
// //       <button
// //         type="button"
// //         onClick={() => setShow((s) => !s)}
// //         className="absolute inset-y-0 right-0 px-3.5 text-xs font-medium text-slate-500 hover:text-slate-800"
// //         aria-label={show ? 'Hide password' : 'Show password'}
// //       >
// //         {show ? 'Hide' : 'Show'}
// //       </button>
// //     </div>
// //   )
// // }

// // export function Button({ loading, children, variant = 'primary', className = '', ...props }) {
// //   const styles =
// //     variant === 'primary'
// //       ? 'bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-400'
// //       : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400'
// //   return (
// //     <button
// //       {...props}
// //       disabled={loading || props.disabled}
// //       className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed ${styles} ${className}`}
// //     >
// //       {loading && (
// //         <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
// //           <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
// //           <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
// //         </svg>
// //       )}
// //       {children}
// //     </button>
// //   )
// // }

// // export function Alert({ type = 'error', children }) {
// //   const styles = {
// //     error: 'border-red-200 bg-red-50 text-red-800',
// //     success: 'border-green-200 bg-green-50 text-green-800',
// //     info: 'border-blue-200 bg-blue-50 text-blue-900',
// //   }[type]
// //   return (
// //     <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
// //       {children}
// //     </div>
// //   )
// // }

// // export function Spinner() {
// //   return (
// //     <div className="flex min-h-screen items-center justify-center">
// //       <svg className="h-8 w-8 animate-spin text-blue-700" viewBox="0 0 24 24" fill="none">
// //         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
// //         <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
// //       </svg>
// //     </div>
// //   )
// // }

// // export function Select({ error, children, className = '', ...props }) {
// //   return (
// //     <select
// //       {...props}
// //       aria-invalid={!!error}
// //       className={`${inputBase} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
// //     >
// //       {children}
// //     </select>
// //   )
// // }


// import { useId, useState } from 'react'
// import * as m from 'motion/react-m'
// import { CircleAlert, CircleCheck, ChevronDown, Eye, EyeOff, Info, LoaderCircle, TriangleAlert } from 'lucide-react'
// import { cn } from '../utils/cn'

// /* ======================= Form controls ======================= */

// export function Field({ label, error, hint, children, htmlFor }) {
//   return (
//     <div>
//       <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
//         {label}
//       </label>
//       {children}
//       {error ? (
//         <p className="mt-1.5 text-sm text-negative">{error}</p>
//       ) : hint ? (
//         <p className="mt-1.5 text-sm text-subtle">{hint}</p>
//       ) : null}
//     </div>
//   )
// }

// const fieldBase =
//   'block w-full rounded-xl border bg-field px-3.5 py-2.5 text-sm text-fg placeholder:text-subtle transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60'

// export function Input({ error, className, ...props }) {
//   return (
//     <input
//       {...props}
//       aria-invalid={!!error}
//       className={cn(fieldBase, error ? 'border-negative' : 'border-line-strong', className)}
//     />
//   )
// }

// export function PasswordInput({ error, ...props }) {
//   const [show, setShow] = useState(false)
//   const Icon = show ? EyeOff : Eye
//   return (
//     <div className="relative">
//       <Input {...props} error={error} type={show ? 'text' : 'password'} className="pr-11" />
//       <button
//         type="button"
//         onClick={() => setShow((s) => !s)}
//         className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-subtle hover:text-fg"
//         aria-label={show ? 'Hide password' : 'Show password'}
//       >
//         <Icon className="h-4 w-4" aria-hidden />
//       </button>
//     </div>
//   )
// }

// export function Select({ error, children, className, ...props }) {
//   return (
//     <div className="relative">
//       <select
//         {...props}
//         aria-invalid={!!error}
//         className={cn(fieldBase, 'appearance-none pr-9', error ? 'border-negative' : 'border-line-strong', className)}
//       >
//         {children}
//       </select>
//       <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
//     </div>
//   )
// }

// /* ======================= Buttons ======================= */

// const buttonVariants = {
//   primary:
//     'bg-linear-to-br from-accent to-accent-2 text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)] hover:brightness-110 active:brightness-95',
//   secondary: 'glass-flat text-fg hover:bg-accent/10',
//   ghost: 'text-muted hover:bg-accent/10 hover:text-fg',
//   danger: 'bg-negative text-accent-fg hover:brightness-110 active:brightness-95',
// }

// // Full width by default (existing pages rely on this). Pass block={false} for an auto-width button.
// export function Button({ loading, children, variant = 'primary', block = true, className, ...props }) {
//   return (
//     <button
//       {...props}
//       disabled={loading || props.disabled}
//       className={cn(
//         'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
//         block && 'w-full',
//         buttonVariants[variant],
//         className
//       )}
//     >
//       {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
//       {children}
//     </button>
//   )
// }

// /* ======================= Feedback ======================= */

// const alertTones = {
//   error: [CircleAlert, 'border-negative/30 bg-negative/10', 'text-negative'],
//   success: [CircleCheck, 'border-positive/30 bg-positive/10', 'text-positive'],
//   info: [Info, 'border-info/30 bg-info/10', 'text-info'],
//   warning: [TriangleAlert, 'border-warning/30 bg-warning/10', 'text-warning'],
// }

// export function Alert({ type = 'error', children }) {
//   const [Icon, box, icon] = alertTones[type] || alertTones.error
//   return (
//     <div role={type === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm text-fg', box)}>
//       <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} aria-hidden />
//       <div className="min-w-0 flex-1">{children}</div>
//     </div>
//   )
// }

// // Full-screen loader used while a session is being restored
// export function Spinner() {
//   return (
//     <div className="flex min-h-screen items-center justify-center">
//       <LoaderCircle className="h-8 w-8 animate-spin text-accent-text" aria-label="Loading" />
//     </div>
//   )
// }

// export function Skeleton({ className }) {
//   return <div aria-hidden className={cn('animate-pulse rounded-lg bg-line-strong/60', className)} />
// }

// export function EmptyState({ icon: Icon, title, children, action }) {
//   return (
//     <div className="glass-flat rounded-2xl border-dashed px-6 py-12 text-center">
//       {Icon && (
//         <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent-text">
//           <Icon className="h-5 w-5" aria-hidden />
//         </div>
//       )}
//       <p className="font-medium text-fg">{title}</p>
//       {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</div>}
//       {action && <div className="mt-5">{action}</div>}
//     </div>
//   )
// }

// /* ======================= Surfaces & hierarchy ======================= */

// // variant: 'hero' (headline numbers) | 'panel' (default) | 'flat' (nested rows, tables)
// export function Card({ variant = 'panel', as: Tag = 'div', className, children, ...props }) {
//   return (
//     <Tag {...props} className={cn(`glass-${variant}`, variant === 'hero' ? 'rounded-3xl' : 'rounded-2xl', className)}>
//       {children}
//     </Tag>
//   )
// }

// const metricSizes = {
//   hero: 'text-4xl font-bold tracking-tight sm:text-5xl',
//   lg: 'text-3xl font-semibold tracking-tight',
//   md: 'text-xl font-semibold',
//   sm: 'text-base font-semibold',
// }
// const metricTones = { positive: 'text-positive', negative: 'text-negative', default: 'text-fg' }

// // A labelled number. Size sets how much attention it asks for.
// export function Metric({ label, value, hint, tone = 'default', size = 'md', className }) {
//   return (
//     <div className={className}>
//       <p className="text-sm font-medium text-muted">{label}</p>
//       <p className={cn('num mt-1', metricSizes[size], metricTones[tone])}>{value}</p>
//       {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
//     </div>
//   )
// }

// const badgeTones = {
//   neutral: 'bg-line text-muted',
//   accent: 'bg-accent/12 text-accent-text',
//   positive: 'bg-positive/12 text-positive',
//   negative: 'bg-negative/12 text-negative',
//   warning: 'bg-warning/12 text-warning',
// }

// export function Badge({ tone = 'neutral', children, className }) {
//   return (
//     <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', badgeTones[tone], className)}>
//       {children}
//     </span>
//   )
// }

// export function PageHeader({ title, description, actions }) {
//   return (
//     <div className="flex flex-wrap items-end justify-between gap-4">
//       <div className="min-w-0">
//         <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
//         {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
//       </div>
//       {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
//     </div>
//   )
// }

// // tabs: [[key, label], ...]
// export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
//   const id = useId()
//   return (
//     <div role="tablist" aria-label={label} className="glass-flat flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1">
//       {tabs.map(([key, text]) => {
//         const active = value === key
//         return (
//           <button
//             key={key}
//             role="tab"
//             aria-selected={active}
//             onClick={() => onChange(key)}
//             className={cn(
//               'relative whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors',
//               active ? 'text-fg' : 'text-muted hover:text-fg'
//             )}
//           >
//             {active && (
//               <m.span
//                 layoutId={`tab-pill-${id}`}
//                 className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/15"
//                 transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
//               />
//             )}
//             <span className="relative">{text}</span>
//           </button>
//         )
//       })}
//     </div>
//   )
// }


import { useId, useState } from 'react'
import * as m from 'motion/react-m'
import { CircleAlert, CircleCheck, ChevronDown, Eye, EyeOff, Info, LoaderCircle, TriangleAlert } from 'lucide-react'
import { cn } from '../utils/cn'

/* ======================= Form controls ======================= */

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-negative">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

const fieldBase =
  'block w-full rounded-xl border bg-field px-3.5 py-2.5 text-sm text-fg placeholder:text-subtle transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60'

export function Input({ error, className, ...props }) {
  return (
    <input
      {...props}
      aria-invalid={!!error}
      className={cn(fieldBase, error ? 'border-negative' : 'border-line-strong', className)}
    />
  )
}

export function PasswordInput({ error, ...props }) {
  const [show, setShow] = useState(false)
  const Icon = show ? EyeOff : Eye
  return (
    <div className="relative">
      <Input {...props} error={error} type={show ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-subtle hover:text-fg"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

export function Select({ error, children, className, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        aria-invalid={!!error}
        className={cn(fieldBase, 'appearance-none pr-9', error ? 'border-negative' : 'border-line-strong', className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  )
}

/* ======================= Buttons ======================= */

const buttonVariants = {
  primary:
    'bg-linear-to-br from-accent to-accent-2 text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)] hover:brightness-110 active:brightness-95',
  secondary: 'glass-flat text-fg hover:bg-accent/10',
  ghost: 'text-muted hover:bg-accent/10 hover:text-fg',
  danger: 'bg-negative text-accent-fg hover:brightness-110 active:brightness-95',
}

// Full width by default (existing pages rely on this). Pass block={false} for an auto-width button.
// Class names for a button look, so links (<Link>) can be styled like buttons.
export const buttonClass = ({ variant = 'primary', block = false, className } = {}) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    block && 'w-full',
    buttonVariants[variant],
    className
  )

export function Button({ loading, children, variant = 'primary', block = true, className, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={buttonClass({ variant, block, className })}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/* ======================= Feedback ======================= */

const alertTones = {
  error: [CircleAlert, 'border-negative/30 bg-negative/10', 'text-negative'],
  success: [CircleCheck, 'border-positive/30 bg-positive/10', 'text-positive'],
  info: [Info, 'border-info/30 bg-info/10', 'text-info'],
  warning: [TriangleAlert, 'border-warning/30 bg-warning/10', 'text-warning'],
}

export function Alert({ type = 'error', children }) {
  const [Icon, box, icon] = alertTones[type] || alertTones.error
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm text-fg', box)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// Full-screen loader used while a session is being restored
export function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-accent-text" aria-label="Loading" />
    </div>
  )
}

export function Skeleton({ className, style }) {
  return <div aria-hidden style={style} className={cn('animate-pulse rounded-lg bg-line-strong/60', className)} />
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="glass-flat rounded-2xl border-dashed px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent-text">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      )}
      <p className="font-medium text-fg">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ======================= Surfaces & hierarchy ======================= */

// variant: 'hero' (headline numbers) | 'panel' (default) | 'flat' (nested rows, tables)
export function Card({ variant = 'panel', as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag {...props} className={cn(`glass-${variant}`, variant === 'hero' ? 'rounded-3xl' : 'rounded-2xl', className)}>
      {children}
    </Tag>
  )
}

const metricSizes = {
  hero: 'text-4xl font-bold tracking-tight sm:text-5xl',
  lg: 'text-3xl font-semibold tracking-tight',
  md: 'text-xl font-semibold',
  sm: 'text-base font-semibold',
}
const metricTones = { positive: 'text-positive', negative: 'text-negative', default: 'text-fg' }

// A labelled number. Size sets how much attention it asks for.
export function Metric({ label, value, hint, tone = 'default', size = 'md', className }) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={cn('num mt-1', metricSizes[size], metricTones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  )
}

const badgeTones = {
  neutral: 'bg-line text-muted',
  accent: 'bg-accent/12 text-accent-text',
  positive: 'bg-positive/12 text-positive',
  negative: 'bg-negative/12 text-negative',
  warning: 'bg-warning/12 text-warning',
}

export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}

// tabs: [[key, label], ...]
export function Tabs({ tabs, value, onChange, label = 'Sections' }) {
  const id = useId()
  return (
    <div role="tablist" aria-label={label} className="glass-flat flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1">
      {tabs.map(([key, text]) => {
        const active = value === key
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              'relative whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              active ? 'text-fg' : 'text-muted hover:text-fg'
            )}
          >
            {active && (
              <m.span
                layoutId={`tab-pill-${id}`}
                className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/15"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative">{text}</span>
          </button>
        )
      })}
    </div>
  )
}
