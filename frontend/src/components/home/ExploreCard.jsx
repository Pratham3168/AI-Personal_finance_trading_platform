import { Link } from 'react-router-dom'
import { ChartPie, ChevronRight, Compass, TrendingUp } from 'lucide-react'
import { CardShell } from './parts'

const ITEMS = [
  ['/analysis', ChartPie, 'Budget analysis', 'Monthly breakdown and AI guidance'],
  ['/investments', TrendingUp, 'Investments', 'Holdings, ledger and cash position'],
  ['/discover', Compass, 'Discover', 'Stocks and IPOs that fit your limits'],
]

export default function ExploreCard() {
  return (
    <CardShell title="Explore">
      <ul className="space-y-2">
        {ITEMS.map(([to, Icon, title, text]) => (
          <li key={to}>
            <Link to={to} className="glass-flat flex items-center gap-3 rounded-xl p-3 transition hover:bg-accent/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent-text">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{title}</span>
                <span className="block truncate text-xs text-subtle">{text}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </CardShell>
  )
}
