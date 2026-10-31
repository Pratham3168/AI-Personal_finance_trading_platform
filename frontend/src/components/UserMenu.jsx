import * as Menu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { menuContent, menuItem, menuLabel, menuSeparator } from './menuStyles'

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?'

export default function UserMenu() {
  const { user, logout } = useAuth()
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Account menu"
        className="glass-flat flex h-10 items-center gap-2 rounded-xl pl-1.5 pr-2.5 transition hover:bg-accent/10"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-accent to-accent-2 text-xs font-semibold text-accent-fg">
          {initials(user.fullName)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-fg sm:block">{user.fullName}</span>
        <ChevronDown className="h-4 w-4 text-subtle" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8} className={`${menuContent} min-w-[15rem]`}>
          <div className={menuLabel}>
            <p className="truncate font-medium text-fg">{user.fullName}</p>
            <p className="truncate text-xs text-subtle">{user.email}</p>
          </div>
          <Menu.Separator className={menuSeparator} />
          <Menu.Item onSelect={() => logout()} className={menuItem}>
            <LogOut className="h-4 w-4 text-muted" aria-hidden />
            Sign out
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
