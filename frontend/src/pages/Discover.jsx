import { useState } from 'react'
import StocksTab from '../components/discover/StocksTab'
import IposTab from '../components/discover/IposTab'
import SearchTab from '../components/discover/SearchTab'
import CheckTab from '../components/discover/CheckTab'
import CapacityTab from '../components/discover/CapacityTab'
import HistoryTab from '../components/discover/HistoryTab'
import PreferencesTab from '../components/discover/PreferencesTab'

const TABS = [
  ['stocks', 'Stocks'],
  ['ipos', 'IPOs'],
  ['search', 'Search'],
  ['check', 'Check an investment'],
  ['capacity', 'Capacity'],
  ['history', 'History'],
  ['preferences', 'Preferences'],
]

export default function Discover() {
  const [tab, setTab] = useState('stocks')
  const [check, setCheck] = useState({ initial: {}, n: 0 }) // n resets the Check tab when a new item is chosen

  // Accepts a stock symbol string, or { kind: 'ipo', ipoId, ipoName }
  const goCheck = (target) => {
    const initial = typeof target === 'string' ? { kind: 'stock', symbol: target } : target
    setCheck((c) => ({ initial, n: c.n + 1 }))
    setTab('check')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Discover</h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore stocks and IPOs that fit your cash, emergency fund and risk level. Information only, not investment advice.
        </p>
      </div>

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

      {tab === 'stocks' && <StocksTab onCheck={goCheck} />}
      {tab === 'ipos' && <IposTab onCheck={goCheck} />}
      {tab === 'search' && <SearchTab onCheck={goCheck} />}
      {tab === 'check' && <CheckTab key={check.n} initial={check.initial} />}
      {tab === 'capacity' && <CapacityTab goPreferences={() => setTab('preferences')} />}
      {tab === 'history' && <HistoryTab goCheck={goCheck} />}
      {tab === 'preferences' && <PreferencesTab />}
    </div>
  )
}
