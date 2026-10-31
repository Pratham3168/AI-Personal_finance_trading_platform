import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

/**
 * Six-box one-time-code input. `value` is a string of digits with no gaps.
 * Supports typing, backspace, arrow keys, paste, and one-time-code autofill.
 */
export default function OtpInput({ value, onChange, onComplete, length = 6, error, disabled, autoFocus }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  const focusBox = (i) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))]
    el?.focus()
    el?.select()
  }

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (value.length === length) onComplete?.(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Insert digits starting at box i (never leaves a gap)
  const insert = (i, text) => {
    const clean = text.replace(/\D/g, '')
    if (!clean) return
    const at = Math.min(i, value.length)
    const next = (value.slice(0, at) + clean + value.slice(at + clean.length)).slice(0, length)
    onChange(next)
    focusBox(Math.min(at + clean.length, length - 1))
  }

  const handleChange = (i, e) => {
    const raw = e.target.value
    const old = digits[i]
    const clean = raw.replace(/\D/g, '')
    if (!clean) {
      // cleared the box
      if (old) onChange(value.slice(0, i) + value.slice(i + 1))
      return
    }
    if (old && clean.length > 1) {
      // typed over a filled box: keep only the new character
      const typed = clean.replace(old, '').charAt(0) || old
      insert(i, typed)
    } else {
      insert(i, clean) // one digit, or a multi-digit autofill/paste into an empty box
    }
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1))
        focusBox(i)
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i))
        focusBox(i - 1)
      }
    } else if (e.key === 'Delete') {
      e.preventDefault()
      if (digits[i]) onChange(value.slice(0, i) + value.slice(i + 1))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    e.preventDefault()
    insert(i, e.clipboardData.getData('text'))
  }

  return (
    <div role="group" aria-label="Verification code" className="flex justify-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={!!error}
          className={cn(
            'num h-12 w-11 rounded-xl border bg-field text-center text-xl font-semibold text-fg transition-colors sm:h-14 sm:w-12',
            'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60',
            error ? 'border-negative' : d ? 'border-accent/50' : 'border-line-strong'
          )}
        />
      ))}
    </div>
  )
}
