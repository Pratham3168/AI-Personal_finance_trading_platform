// import { Link } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// const cards = [
//   ['/transactions', 'Income & Expenses', 'Record what you earn and spend, and review your entries.'],
//   ['/analysis', 'Budget analysis', 'See your monthly summary and get AI-generated spending guidance.'],
//   ['/investments', 'Investments', 'Track your holdings, record buys and sells, and see how much is safe to invest.'],
// ]

// export default function Home() {
//   const { user } = useAuth()
//   return (
//     <div>
//       <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
//         <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
//         <p className="mt-2 text-slate-600">You have successfully logged in.</p>
//       </div>
//       <div className="mt-6 grid gap-4 sm:grid-cols-2">
//         {cards.map(([to, title, desc]) => (
//           <Link key={to} to={to}
//             className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300">
//             <h2 className="font-semibold text-slate-900">{title}</h2>
//             <p className="mt-1 text-sm text-slate-600">{desc}</p>
//             <span className="mt-4 inline-block text-sm font-semibold text-blue-700">Open →</span>
//           </Link>
//         ))}
//       </div>
//     </div>
//   )
// }

import { Suspense, lazy, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Alert, PageHeader, buttonClass } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { investmentsApi } from '../api/investments'
import { transactionsApi } from '../api/transactions'
import { greeting, lastMonths, loadTrend } from '../components/home/data'
import { BlockSkeleton, CardError, CardShell, ChartSkeleton } from '../components/home/parts'
import HeroCard from '../components/home/HeroCard'
import EmergencyFundCard from '../components/home/EmergencyFundCard'
import RecentEntries from '../components/home/RecentEntries'
import ExploreCard from '../components/home/ExploreCard'
import { currentMonth, formatMoney, formatMonth } from '../utils/format'

// Recharts loads on demand, in its own file, so it never slows down the first screen.
const TrendChart = lazy(() => import('../components/home/charts').then((m) => ({ default: m.TrendChart })))
const AllocationDonut = lazy(() => import('../components/home/charts').then((m) => ({ default: m.AllocationDonut })))

export default function Home() {
  const { user } = useAuth()
  const month = currentMonth()
  const months = useMemo(() => lastMonths(6), [])

  // Each widget loads on its own, so one failure never blanks the page.
  const trend = useAsync(() => loadTrend(months), [])
  const inv = useAsync(() => investmentsApi.summary(month).then((r) => r.data.summary), [])
  const holdings = useAsync(() => investmentsApi.holdings().then((r) => r.data), [])
  const recent = useAsync(() => transactionsApi.list({ page: 1, limit: 5 }).then((r) => r.data), [])

  const rows = trend.data || []
  const current = rows[rows.length - 1]
  const previous = rows[rows.length - 2]

  // Only real conditions reported by the backend
  const alerts = []
  const summary = inv.data
  if (summary?.emergencyFund?.shortfall > 0) {
    alerts.push(['warning', `Your cash is ${formatMoney(summary.emergencyFund.shortfall)} below your emergency fund target, so there is no safe-to-invest room this month.`])
  }
  if (summary?.portfolio?.concentrationWarning && summary.portfolio.largestHolding) {
    alerts.push(['info', `${summary.portfolio.largestHolding.symbol} makes up a large share of your portfolio at cost, above the 40% guideline.`])
  }

  const first = user.fullName.split(' ')[0]
  const holdingsList = holdings.data?.holdings ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${first}`}
        description={`Here’s your money at a glance for ${formatMonth(month)}.`}
        actions={
          <>
            <Link to="/transactions" className={buttonClass()}>
              <Plus className="h-4 w-4" aria-hidden /> Add entry
            </Link>
            <Link to="/discover" className={buttonClass({ variant: 'secondary' })}>
              Check a stock
            </Link>
          </>
        }
      />

      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(([type, text]) => (
            <Alert key={text} type={type}>{text}</Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <HeroCard month={month} current={current} previous={previous} loading={trend.loading} error={trend.error} onRetry={trend.reload} />
        </div>
        <div className="lg:col-span-4">
          <EmergencyFundCard summary={inv.data} loading={inv.loading} error={inv.error} onRetry={inv.reload} />
        </div>

        <div className="lg:col-span-8">
          <CardShell title="Income vs expenses" subtitle="Last 6 months">
            {trend.loading ? (
              <ChartSkeleton height={290} />
            ) : trend.error ? (
              <CardError message={trend.error.message} onRetry={trend.reload} />
            ) : (
              <Suspense fallback={<ChartSkeleton height={290} />}>
                <TrendChart rows={rows} onRetry={trend.reload} />
              </Suspense>
            )}
          </CardShell>
        </div>
        <div className="lg:col-span-4">
          <CardShell title="Portfolio allocation" subtitle="Share of cost by holding">
            {holdings.loading ? (
              <BlockSkeleton lines={6} />
            ) : holdings.error ? (
              holdings.error.status === 409 ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-muted">Set up your investor profile to see how your portfolio is spread.</p>
                  <Link to="/investments" className={buttonClass({ variant: 'secondary' })}>Open investments</Link>
                </div>
              ) : (
                <CardError message={holdings.error.message} onRetry={holdings.reload} />
              )
            ) : (
              <Suspense fallback={<ChartSkeleton height={220} />}>
                <AllocationDonut holdings={holdingsList} />
              </Suspense>
            )}
          </CardShell>
        </div>

        <div className="lg:col-span-8">
          <RecentEntries data={recent.data} loading={recent.loading} error={recent.error} onRetry={recent.reload} />
        </div>
        <div className="lg:col-span-4">
          <ExploreCard />
        </div>
      </div>
    </div>
  )
}
