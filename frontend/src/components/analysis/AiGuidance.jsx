import { CircleAlert, Lightbulb, ListChecks, PiggyBank, Sparkles } from 'lucide-react'
import * as m from 'motion/react-m'
import { Alert, Button, Card } from '../ui'
import { displayLabel } from './shared'
import { formatMonth, formatMoney, prettify } from '../../utils/format'
import { toList, toText } from '../../utils/text'
import { cn } from '../../utils/cn'

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

// rating -> [label, level 1-4, tone]
const RATINGS = {
  excellent: ['Excellent', 4, 'positive'],
  good: ['Good', 3, 'positive'],
  fair: ['Fair', 2, 'warning'],
  needs_attention: ['Needs attention', 1, 'negative'],
}
const toneBar = { positive: 'bg-positive', warning: 'bg-warning', negative: 'bg-negative' }
const toneText = { positive: 'text-positive', warning: 'text-warning', negative: 'text-negative' }

function Health({ health }) {
  if (!isObj(health)) return null
  const key = toText(health.rating).toLowerCase().replace(/[\s-]+/g, '_')
  const [label, level, tone] = RATINGS[key] || [prettify(toText(health.rating) || 'Unknown'), 0, 'positive']
  return (
    <div className="glass-flat rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Financial health</p>
          <p className={cn('text-2xl font-semibold tracking-tight', level ? toneText[tone] : 'text-fg')}>{label}</p>
        </div>
        {level > 0 && (
          <div className="flex w-40 gap-1.5" role="img" aria-label={`Rating level ${level} of 4`}>
            {[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-2 flex-1 rounded-full bg-line-strong', level >= i && toneBar[tone])} />)}
          </div>
        )}
      </div>
      {health.reason && <p className="mt-3 text-sm text-muted">{toText(health.reason)}</p>}
    </div>
  )
}

function areaParts(a) {
  if (!isObj(a)) return { title: null, text: toText(a), amount: null }
  const cat = a.category ?? a.name ?? a.area
  const text = a.observation ?? a.detail ?? a.reason ?? a.message ?? a.insight
  const rest = Object.fromEntries(Object.entries(a).filter(([k]) => !['category', 'name', 'area', 'amount', 'observation', 'detail', 'reason', 'message', 'insight'].includes(k)))
  const amount = a.amount != null && Number.isFinite(Number(a.amount)) ? Number(a.amount) : null
  return { title: cat ? displayLabel(String(cat)) : null, text: toText(text ?? rest), amount }
}

function Block({ title, icon: Icon, tone = 'text-accent-text', children }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-fg"><Icon className={cn('h-4 w-4', tone)} aria-hidden /> {title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export function AiResult({ data }) {
  const a = data?.analysis
  if (!a) return null
  if (a.raw) return <p className="whitespace-pre-wrap text-sm text-fg">{toText(a.raw)}</p>

  const insights = toList(a.keyInsights)
  const areas = Array.isArray(a.overspendingAreas) ? a.overspendingAreas : toList(a.overspendingAreas)
  const suggestions = toList(a.suggestions)
  return (
    <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
      <Health health={a.financialHealth} />
      {a.overview && <p className="text-base leading-relaxed text-fg">{toText(a.overview)}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {insights.length > 0 && (
          <Block title="Key insights" icon={Lightbulb}>
            <ul className="space-y-2 text-sm text-muted">{insights.map((t, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden /><span>{t}</span></li>)}</ul>
          </Block>
        )}
        {areas.length > 0 && (
          <Block title="Areas to watch" icon={CircleAlert} tone="text-warning">
            <ul className="space-y-3 text-sm">
              {areas.map((x, i) => {
                const p = areaParts(x)
                return (
                  <li key={i}>
                    {(p.title || p.amount != null) && (
                      <p className="flex items-baseline justify-between gap-3 font-medium text-fg">
                        <span>{p.title}</span>{p.amount != null && <span className="num text-muted">{formatMoney(p.amount)}</span>}
                      </p>
                    )}
                    <p className="text-muted">{p.text}</p>
                  </li>
                )
              })}
            </ul>
          </Block>
        )}
        {suggestions.length > 0 && (
          <Block title="Suggestions" icon={ListChecks}>
            <ol className="space-y-2 text-sm text-muted">
              {suggestions.map((t, i) => <li key={i} className="flex gap-3"><span className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-xs font-semibold text-accent-text">{i + 1}</span><span>{t}</span></li>)}
            </ol>
          </Block>
        )}
        {a.savingsTip && (
          <div className="rounded-2xl border border-positive/30 bg-positive/10 p-5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-fg"><PiggyBank className="h-4 w-4 text-positive" aria-hidden /> Savings tip</h4>
            <p className="mt-3 text-sm text-fg">{toText(a.savingsTip)}</p>
          </div>
        )}
      </div>
    </m.div>
  )
}

export default function AiGuidance({ month, entry, busy, error, onGenerate }) {
  const data = entry?.data
  const prev = data?.previousMonthCompared
  const model = isObj(data?.meta) ? data.meta.model : null
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-fg"><Sparkles className="h-4 w-4 text-accent-text" aria-hidden /> AI spending guidance</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Plain-language insights based on your {formatMonth(month)} figures{prev ? ` and ${formatMonth(String(prev))}` : ', compared with last month where available'}.
            It’s limited per hour, so it only runs when you ask.
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Button onClick={onGenerate} loading={busy}>{data ? 'Regenerate' : 'Generate insights'}</Button>
        </div>
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {busy && !data && (
        <div className="mt-6 space-y-3" aria-busy="true" aria-label="Generating insights">
          <div className="h-16 animate-pulse rounded-2xl bg-line-strong/50" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-line-strong/50" />
          <div className="grid gap-4 md:grid-cols-2"><div className="h-32 animate-pulse rounded-2xl bg-line-strong/50" /><div className="h-32 animate-pulse rounded-2xl bg-line-strong/50" /></div>
        </div>
      )}

      {data && (
        <div className="mt-6 border-t border-line pt-6">
          <AiResult data={data} />
          <p className="mt-6 text-xs text-subtle">
            Generated by AI from your recorded figures for general information only. It is not financial advice.
            {model ? ` Model: ${toText(model)}.` : ''}
          </p>
        </div>
      )}
    </Card>
  )
}
