import { createContext, useCallback, useContext, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from './ui'

const ConfirmContext = createContext(null)

/**
 * const confirm = useConfirm()
 * if (!(await confirm({ title: 'Delete this entry?', description: '...', confirmLabel: 'Delete', destructive: true }))) return
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null) // { opts, resolve }

  const confirm = useCallback((opts) => new Promise((resolve) => setState({ opts, resolve })), [])

  const close = (answer) => {
    state?.resolve(answer)
    setState(null)
  }

  const o = state?.opts || {}
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog.Root open={!!state} onOpenChange={(open) => !open && close(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="bw-fade fixed inset-0 z-50 grid place-items-center bg-[rgba(3,10,30,0.45)] p-4 backdrop-blur-sm">
            <Dialog.Content className="bw-pop glass-hero w-full max-w-md rounded-3xl p-6 text-fg">
              <Dialog.Title className="text-lg font-semibold">{o.title || 'Are you sure?'}</Dialog.Title>
              {o.description && (
                <Dialog.Description className="mt-2 text-sm text-muted">{o.description}</Dialog.Description>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" block={false} onClick={() => close(false)}>
                  {o.cancelLabel || 'Cancel'}
                </Button>
                <Button variant={o.destructive ? 'danger' : 'primary'} block={false} onClick={() => close(true)}>
                  {o.confirmLabel || 'Confirm'}
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
