import * as Menu from '@radix-ui/react-dropdown-menu'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../ui'
import { menuContent, menuItem } from '../menuStyles'
import { categoryIcon, dayLabel, labelOf } from './categoryMeta'
import { formatMoney, today } from '../../utils/format'
import { toText } from '../../utils/text'
import { cn } from '../../utils/cn'

function EntryRow({ t, onEdit, onDelete, deleting }) {
  const Icon = categoryIcon(t.category)
  const income = t.type === 'income'
  const label = labelOf(t.category)
  const sub = [toText(t.description), t.paymentMethod ? labelOf(t.paymentMethod) : ''].filter(Boolean).join(' · ')
  const amount = `${income ? '+' : '−'}${formatMoney(t.amount)}`

  return (
    <li className={cn('flex items-center gap-2 px-2 transition-colors hover:bg-accent/5 sm:px-4', deleting && 'opacity-50')}>
      <button type="button" onClick={() => onEdit(t)} aria-label={`Edit ${label}, ${amount}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-3 pl-1 text-left">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', income ? 'bg-positive/12 text-positive' : 'bg-accent/12 text-accent-text')}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-sm font-medium text-fg">{label}</span>
            {t.entryType === 'monthly' && <Badge tone="accent">Monthly total</Badge>}
          </span>
          <span className="block truncate text-xs text-subtle">{sub || ' '}</span>
        </span>
      </button>

      <p className={cn('num shrink-0 text-sm font-semibold sm:text-base', income ? 'text-positive' : 'text-fg')}>{amount}</p>

      <Menu.Root>
        <Menu.Trigger aria-label={`Actions for ${label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-subtle transition hover:bg-accent/10 hover:text-fg">
          <EllipsisVertical className="h-[18px] w-[18px]" aria-hidden />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="end" sideOffset={6} className={menuContent}>
            <Menu.Item onSelect={() => onEdit(t)} className={menuItem}>
              <Pencil className="h-4 w-4 text-muted" aria-hidden /> Edit
            </Menu.Item>
            <Menu.Item onSelect={() => onDelete(t)} className={cn(menuItem, 'text-negative')}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </li>
  )
}

// Entries arrive newest first, so same-day entries are already adjacent.
export default function EntryList({ items, onEdit, onDelete, deletingId, busy }) {
  const todayIso = today()
  const groups = []
  for (const t of items) {
    const last = groups[groups.length - 1]
    if (last && last.date === t.date) last.items.push(t)
    else groups.push({ date: t.date, items: [t] })
  }
  return (
    <div className={cn('transition-opacity', busy && 'opacity-60')}>
      {groups.map((g) => (
        <section key={g.date} aria-label={dayLabel(g.date, todayIso)}>
          <h3 className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-subtle sm:px-6">{dayLabel(g.date, todayIso)}</h3>
          <ul className="divide-y divide-line">
            {g.items.map((t) => (
              <EntryRow key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} deleting={deletingId === t.id} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
