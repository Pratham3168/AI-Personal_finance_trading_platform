import { ShieldCheck } from 'lucide-react'
import { APP_NAME } from '../config'

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-accent to-accent-2 text-accent-fg shadow-[0_6px_16px_-6px_var(--accent)]">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </div>
      <span className="text-lg font-semibold tracking-tight text-fg">{APP_NAME}</span>
    </div>
  )
}
