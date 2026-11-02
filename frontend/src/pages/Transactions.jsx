import { useState } from 'react'
import { toast } from 'sonner'
import { Inbox, Layers, Plus, SearchX } from 'lucide-react'
import { Alert, Card, EmptyState, PageHeader, Skeleton, Button } from '../components/ui'
import Sheet from '../components/Sheet'
import { useConfirm } from '../components/ConfirmProvider'
import { CardError } from '../components/home/parts'
import { readTotal } from '../components/home/data'
import EntryForm from '../components/transactions/EntryForm'
import BulkDialog from '../components/transactions/BulkDialog'
import EntryList from '../components/transactions/EntryList'
import FilterBar from '../components/transactions/FilterBar'
import SummaryStrip from '../components/transactions/SummaryStrip'
import { labelOf } from '../components/transactions/categoryMeta'
import { useAsync } from '../hooks/useAsync'
import { analysisApi } from '../api/analysis'
import { transactionsApi } from '../api/transactions'
import { currentMonth, formatDate, formatMoney, formatMonth } from '../utils/format'
import { cn } from '../utils/cn'

const LIMIT = 20
const defaults = () => ({ month: currentMonth(), type: '', category: '' })
const finite = (n) => (Number.isFinite(n) ? n : null)

function RowsSkeleton() {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="Loading entries">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}

export default function Transactions() {
  const confirm = useConfirm()
  const [filters, setFilters] = useState(defaults())
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sheet, setSheet] = useState(null) // null | { mode: 'add' } | { mode: 'edit', tx }
  const [dirty, setDirty] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const options = useAsync(() => transactionsApi.categories().then((r) => r.data), [])
  const list = useAsync(
    () => transactionsApi.list({ month: filters.month, type: filters.type, category: filters.category, page, limit: LIMIT }).then((r) => r.data),
    [filters.month, filters.type, filters.category, page, refreshKey]
  )
  const summary = useAsync(async () => {
    if (!filters.month) return null
    try {
      const r = await analysisApi.summary(filters.month)
      const s = r.data?.summary ?? r.data ?? {}
      return { income: finite(readTotal(s, ['totalIncome', 'income'])), expenses: finite(readTotal(s, ['totalExpenses', 'expenses'])) }
    } catch (err) {
      if (err.status === 404) return { income: 0, expenses: 0 } // no entries that month
      throw err
    }
  }, [filters.month, refreshKey])

  const items = list.data?.transactions ?? []
  const pagination = list.data?.pagination ?? { page: 1, totalPages: 1, total: 0 }
  const isDefault = filters.month === currentMonth() && !filters.type && !filters.category
  const hasFilter = !!(filters.type || filters.category)

  const refresh = () => setRefreshKey((k) => k + 1)
  const changeFilters = (patch) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }
  const resetFilters = () => {
    setFilters(defaults())
    setPage(1)
  }

  const openAdd = () => { setDirty(false); setSheet({ mode: 'add' }) }
  const openEdit = (tx) => { setDirty(false); setSheet({ mode: 'edit', tx }) }
  const closeSheet = () => { setSheet(null); setDirty(false) }
  const requestCloseSheet = async () => {
    if (dirty && !(await confirm({ title: 'Discard changes?', description: 'Your changes to this entry haven’t been saved.', confirmLabel: 'Discard', destructive: true }))) return
    closeSheet()
  }

  const onSaved = ({ intent }) => {
    if (page !== 1 && sheet?.mode === 'add') setPage(1)
    refresh()
    if (intent !== 'again') closeSheet()
  }

  const onDelete = async (t) => {
    const ok = await confirm({
      title: 'Delete this entry?',
      description: `${labelOf(t.category)} · ${formatMoney(t.amount)} on ${formatDate(t.date)}. This can’t be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setDeletingId(t.id)
    try {
      await transactionsApi.remove(t.id)
      toast.success('Entry deleted')
      if (items.length === 1 && page > 1) setPage((p) => p - 1)
      else refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const from = pagination.total ? (pagination.page - 1) * LIMIT + 1 : 0
  const to = Math.min(pagination.page * LIMIT, pagination.total)
  const showSkeleton = list.loading && !list.data

  return (
    <div className="space-y-5">
      <PageHeader
        title="Income & Expenses"
        description="Record what you earn and spend, and keep track of where your money goes."
        actions={
          <>
            <Button block={false} onClick={openAdd}><Plus className="h-4 w-4" aria-hidden /> Add entry</Button>
            <Button block={false} variant="secondary" onClick={() => setBulkOpen(true)}><Layers className="h-4 w-4" aria-hidden /> Add several</Button>
          </>
        }
      />

      <FilterBar filters={filters} onChange={changeFilters} options={options.data} onReset={resetFilters} isDefault={isDefault} />

      {filters.month && <SummaryStrip month={filters.month} data={summary.data} loading={summary.loading} error={summary.error} onRetry={summary.reload} />}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-6">
          <h2 className="text-base font-semibold text-fg">{filters.month ? formatMonth(filters.month) : 'All entries'}</h2>
          {list.data && <p className="num text-sm text-muted">{pagination.total} {pagination.total === 1 ? 'entry' : 'entries'}</p>}
        </div>

        {showSkeleton ? (
          <RowsSkeleton />
        ) : list.error && !list.data ? (
          <div className="p-6"><CardError message={list.error.message} onRetry={list.reload} /></div>
        ) : items.length === 0 ? (
          <div className="p-5 sm:p-8">
            {hasFilter ? (
              <EmptyState icon={SearchX} title="No entries match these filters" action={<Button block={false} variant="secondary" onClick={resetFilters}>Reset filters</Button>}>
                Try a different month, type or category.
              </EmptyState>
            ) : (
              <EmptyState icon={Inbox} title={filters.month ? `No entries in ${formatMonth(filters.month)}` : 'No entries yet'} action={<Button block={false} onClick={openAdd}><Plus className="h-4 w-4" aria-hidden /> Add entry</Button>}>
                Add your income and expenses to start building your picture.
              </EmptyState>
            )}
          </div>
        ) : (
          <>
            {list.error && <div className="p-4"><Alert>{list.error.message}</Alert></div>}
            <EntryList items={items} onEdit={openEdit} onDelete={onDelete} deletingId={deletingId} busy={list.loading} />
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:px-6">
            <span className="num">Showing {from}–{to} of {pagination.total}</span>
            <div className="flex gap-2">
              <Button block={false} variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</Button>
              <Button block={false} variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add / edit panel */}
      <Sheet
        open={!!sheet}
        onOpenChange={(o) => !o && requestCloseSheet()}
        title={sheet?.mode === 'edit' ? 'Edit entry' : 'Add entry'}
        description={sheet?.mode === 'edit' ? `${labelOf(sheet.tx.category)} · ${formatDate(sheet.tx.date)}` : 'Record income or an expense.'}
        onOpenAutoFocus={(e) => {
          // focus the amount on desktop; on touch screens it would pop the keyboard over the category chips
          if (sheet?.mode === 'add' && !window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault()
            document.getElementById('entry-amount')?.focus()
          }
        }}
      >
        {sheet && (
          <EntryForm
            key={sheet.mode === 'edit' ? sheet.tx.id : 'new'}
            initial={sheet.mode === 'edit' ? sheet.tx : undefined}
            options={options.data}
            onSaved={onSaved}
            onCancel={requestCloseSheet}
            onDirtyChange={setDirty}
          />
        )}
      </Sheet>

      <BulkDialog open={bulkOpen} onOpenChange={setBulkOpen} options={options.data} onSaved={() => { if (page !== 1) setPage(1); refresh() }} />

      {/* Quick add on phones, where the header button scrolls out of view */}
      <button
        type="button"
        onClick={openAdd}
        aria-label="Add entry"
        className={cn(
          'fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full lg:hidden',
          'bg-linear-to-br from-accent to-accent-2 text-accent-fg shadow-[0_10px_25px_-8px_var(--accent)]'
        )}
      >
        <Plus className="h-6 w-6" aria-hidden />
      </button>
    </div>
  )
}
