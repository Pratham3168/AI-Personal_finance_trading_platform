import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

/**
 * Slide-over panel (full-screen on phones). Put a <form> or content inside; use
 * <SheetBody> for the scrolling area and <SheetFooter> for pinned actions.
 */
export default function Sheet({ open, onOpenChange, title, description, wide = false, onOpenAutoFocus, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bw-fade fixed inset-0 z-50 bg-[rgba(3,10,30,0.45)] backdrop-blur-sm" />
        <Dialog.Content
          onOpenAutoFocus={onOpenAutoFocus}
          aria-describedby={description ? undefined : undefined}
          className={cn(
            'bw-sheet glass-hero fixed inset-0 z-50 flex flex-col rounded-none text-fg',
            'sm:left-auto sm:right-0 sm:w-full sm:rounded-l-3xl',
            wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold tracking-tight">{title}</Dialog.Title>
              <Dialog.Description className={cn('mt-1 text-sm text-muted', !description && 'sr-only')}>
                {description || title}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-accent/10 hover:text-fg"
            >
              <X className="h-5 w-5" aria-hidden />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetBody = ({ className, children }) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', className)}>{children}</div>
)

export const SheetFooter = ({ className, children }) => (
  <div className={cn('border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6', className)}>{children}</div>
)
