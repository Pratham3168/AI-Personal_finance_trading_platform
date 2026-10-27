import { useCallback, useEffect, useState } from 'react'
import { Alert } from '../components/ui'
import { investmentsApi } from '../api/investments'
import ProfileForm from '../components/investments/ProfileForm'
import SummaryTab from '../components/investments/SummaryTab'
import HoldingsTab from '../components/investments/HoldingsTab'
import LedgerTab from '../components/investments/LedgerTab'

const TABS = [
  ['summary', 'Summary'],
  ['holdings', 'Holdings'],
  ['ledger', 'Buy / Sell / Dividends'],
  ['profile', 'Profile'],
]

export default function Investments() {
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = not set up yet
  const [error, setError] = useState('')
  const [tab, setTab] = useState('summary')

  const loadProfile = useCallback(async () => {
    setError('')
    try {
      const res = await investmentsApi.getProfile()
      setProfile(res.data.profile)
    } catch (err) {
      if (err.status === 404) setProfile(null)
      else setError(err.message)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Investments</h1>
      <p className="mt-1 text-sm text-slate-600">
        A record of the investments you enter, valued at cost. This page does not show market prices or give investment advice.
      </p>
    </div>
  )

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Alert>{error}{' '}
          <button onClick={loadProfile} className="font-semibold underline">Try again</button>
        </Alert>
      </div>
    )
  }

  if (profile === undefined) return <p className="py-16 text-center text-sm text-slate-500">Loading…</p>

  // First-time setup: the backend needs a profile before it can calculate cash and the summary
  if (profile === null) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
          <p className="font-semibold">Set up your investor profile first</p>
          <p className="mt-1">
            We need your starting cash and emergency fund preference to work out how much is safe to invest.
            You can change these later.
          </p>
        </div>
        <ProfileForm onSaved={(p) => { setProfile(p); setTab('summary') }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === key ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tabs mount fresh each time, so they always load up-to-date numbers */}
      {tab === 'summary' && <SummaryTab profile={profile} />}
      {tab === 'holdings' && <HoldingsTab goToLedger={() => setTab('ledger')} />}
      {tab === 'ledger' && <LedgerTab />}
      {tab === 'profile' && <ProfileForm initial={profile} onSaved={setProfile} />}
    </div>
  )
}
