import { Card, Skeleton } from '../ui'
import { cn } from '../../utils/cn'

// Titled card shell used by every Home widget
export function CardShell({ title, subtitle, action, variant = 'panel', className, children }) {
  return (
    <Card variant={variant} className={cn('flex h-full flex-col p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </Card>
  )
}

export function CardError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <p className="text-muted">{message || 'We couldn’t load this right now.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold text-accent-text hover:underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function BlockSkeleton({ lines = 3, className }) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-1/3' : 'w-full')} />
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 260 }) {
  return <Skeleton className="w-full" style={{ height }} />
}
