import { Check, Circle } from 'lucide-react'
import { cn } from '../../utils/cn'

// Same rules the backend enforces (8+ chars, lower, upper, digit).
export const PASSWORD_RULES = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['One lowercase letter', (p) => /[a-z]/.test(p)],
  ['One uppercase letter', (p) => /[A-Z]/.test(p)],
  ['One number', (p) => /\d/.test(p)],
]

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['', 'bg-negative', 'bg-warning', 'bg-accent', 'bg-positive']

export default function PasswordStrength({ password }) {
  const met = PASSWORD_RULES.map(([, test]) => test(password))
  const count = met.filter(Boolean).length
  // none / weak / fair / good (meets every rule) / strong (meets every rule and 12+ characters)
  const level = !password ? 0 : count === PASSWORD_RULES.length ? (password.length >= 12 ? 4 : 3) : count >= 3 ? 2 : 1

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full bg-line-strong transition-colors', level >= i && COLORS[level])} />
          ))}
        </div>
        <span className="w-12 text-right text-xs font-medium text-muted" aria-live="polite">
          {LABELS[level]}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map(([label], i) => (
          <li key={label} className={cn('flex items-center gap-1.5 text-xs', met[i] ? 'text-positive' : 'text-subtle')}>
            {met[i] ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Circle className="h-3.5 w-3.5" aria-hidden />}
            {label}
            <span className="sr-only">{met[i] ? ' (met)' : ' (not met)'}</span>
          </li>
        ))}
      </ul>
      {level === 3 && <p className="mt-2 text-xs text-subtle">Tip: 12 or more characters makes it stronger.</p>}
    </div>
  )
}
