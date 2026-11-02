import { useId } from 'react'
import * as m from 'motion/react-m'
import { cn } from '../utils/cn'

/** Pill switch for 2–4 options. options: [[value, label], ...] */
export default function Segmented({ options, value, onChange, label, block = false, className }) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={label} className={cn('glass-flat inline-flex gap-1 rounded-xl p-1', block && 'flex w-full', className)}>
      {options.map(([val, text]) => {
        const active = value === val
        return (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(val)}
            className={cn(
              'relative whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              block && 'flex-1',
              active ? 'text-fg' : 'text-muted hover:text-fg'
            )}
          >
            {active && (
              <m.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg border border-accent/25 bg-accent/15"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
              />
            )}
            <span className="relative">{text}</span>
          </button>
        )
      })}
    </div>
  )
}
