import { Toaster } from 'sonner'
import { useTheme } from '../context/ThemeContext'

export default function AppToaster() {
  const { resolved } = useTheme()
  return (
    <Toaster
      theme={resolved}
      position="top-right"
      style={{
        '--normal-bg': 'var(--surface-solid)',
        '--normal-text': 'var(--fg)',
        '--normal-border': 'var(--border-strong)',
        fontFamily: 'var(--font-sans)',
      }}
    />
  )
}
