import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { menuContent, menuItem } from './menuStyles'

const OPTIONS = [
  ['light', 'Light', Sun],
  ['dark', 'Dark', Moon],
  ['system', 'System', Monitor],
]

export default function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme()
  const Current = resolved === 'dark' ? Moon : Sun
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Change theme"
        className="glass-flat flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:text-fg"
      >
        <Current className="h-[18px] w-[18px]" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8} className={menuContent}>
          <Menu.RadioGroup value={theme} onValueChange={setTheme}>
            {OPTIONS.map(([value, label, Icon]) => (
              <Menu.RadioItem key={value} value={value} className={menuItem}>
                <Icon className="h-4 w-4 text-muted" aria-hidden />
                <span className="flex-1">{label}</span>
                <Menu.ItemIndicator>
                  <Check className="h-4 w-4 text-accent-text" aria-hidden />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
