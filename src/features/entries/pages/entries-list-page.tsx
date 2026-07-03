import { useState, useContext, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Drawer } from '@/shared/components/drawer'
import { ActionDialog } from '@/shared/components/action-dialog'
import { useActionDialog } from '@/shared/hooks/use-action-dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AddContext } from '@/shared/layouts/app-layout'
import { useArchiveEntry, useCreateEntry, useEntries } from '@/features/entries/hooks'
import { toCreateEntryDTO, type EntryFormValues } from '@/features/entries/schemas'
import { EntryDrawerForm } from '@/features/entries/components/entry-drawer-form'

interface OutletCtx { searchValue: string }

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function unitShort(u: string | null | undefined) {
  const map: Record<string, string> = {
    'Kilogramos (kg)': 'kg', 'Unidades': 'u', 'Litros (L)': 'L',
    'Litros': 'L', 'Cajas': 'cajas', 'Blísters': 'blísters',
  }
  return u ? (map[u] ?? u) : ''
}

const DATE_INPUT_STYLE: React.CSSProperties = {
  background: '#f5f7fa',
  border: '1.5px solid #e6ebf1',
  borderRadius: 14,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 600,
  color: '#12212e',
  outline: 'none',
  fontFamily: 'inherit',
  flex: 1,
  minWidth: 0,
}

export function EntriesListPage() {
  const { searchValue } = useOutletContext<OutletCtx>()
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')

  const dateFilters = {
    ...(since ? { since } : {}),
    ...(until ? { until } : {}),
  }

  const { data, loading, error, refetch, loadMore, hasMore, loadingMore } = useEntries(
    Object.keys(dateFilters).length > 0 ? dateFilters : undefined
  )
  useArchiveEntry() // available for future use
  const { createEntry, submitting } = useCreateEntry()
  const { registerAddHandler } = useContext(AddContext)

  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const { dialogProps, closeDialog, runWithDialog } = useActionDialog()

  useEffect(() => {
    return registerAddHandler(() => { setFormError(''); setFormOpen(true) })
  }, [registerAddHandler])

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore || loadingMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loadMore])

  // Filter by search (client-side — backend doesn't support a generic search param for entries)
  const filtered = searchValue
    ? data.filter(
        (e) =>
          e.item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          (e.donor && `${e.donor.names} ${e.donor.surnames}`.toLowerCase().includes(searchValue.toLowerCase()))
      )
    : data

  async function handleSubmit(values: EntryFormValues) {
    setFormError('')
    setFormOpen(false)
    try {
      await runWithDialog({
        loading: 'Registrando entrada…',
        success: 'Entrada registrada',
        error: 'No se pudo registrar la entrada',
        action: async () => {
          const entry = await createEntry(toCreateEntryDTO(values))
          if (!entry) throw new Error('fail')
        },
      })
      refetch()
    } catch {
      /* dialog shows error */
    }
  }

  const hasDates = since || until

  return (
    <div style={{ animation: 'screenIn .32s ease' }}>
      {/* Date range filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a99a8', marginBottom: 5 }}>Desde</div>
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            style={DATE_INPUT_STYLE}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8a99a8', marginBottom: 5 }}>Hasta</div>
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            style={DATE_INPUT_STYLE}
          />
        </div>
        {hasDates && (
          <button
            onClick={() => { setSince(''); setUntil('') }}
            aria-label="Limpiar fechas"
            style={{
              alignSelf: 'flex-end',
              height: 42,
              width: 42,
              flexShrink: 0,
              border: '1.5px solid #e6ebf1',
              borderRadius: 14,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2.6" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: '#c8392f', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>{error}</p>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-[18px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#9aa8b6', fontWeight: 500 }}>
          {searchValue || hasDates ? 'Sin resultados' : 'Aún no hay entradas registradas'}
        </div>
      ) : (
        <div>
          {filtered.map((entry) => (
            <button
              key={entry.id}
              style={{
                width: '100%',
                textAlign: 'left',
                background: '#fff',
                border: '1.5px solid #e9edf2',
                borderRadius: 18,
                padding: '15px 16px',
                marginBottom: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                fontFamily: 'inherit',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.985)'; e.currentTarget.style.borderColor = '#cfdae4' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#e9edf2' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#e9edf2' }}
            >
              {/* Green icon */}
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 13, background: '#e6f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#2f9e6a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>
                </svg>
              </div>

              {/* Item + person + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#122433', lineHeight: 1.25, marginBottom: 3 }}>
                  {entry.item.name}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8a99a8' }}>
                  {entry.donor ? `${entry.donor.names} ${entry.donor.surnames}` : 'Sin donante'} · {fmtDate(entry.createdAt)}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2f9e6a', letterSpacing: '-.3px' }}>
                  +{entry.quantity}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#a7b3bf', marginTop: 2 }}>
                  {unitShort(entry.item.unit)}
                </div>
              </div>
            </button>
          ))}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#9aa8b6', fontSize: 13, fontWeight: 500 }}>
              Cargando más…
            </div>
          )}
        </div>
      )}

      {/* Create Entry Drawer */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)}>
        <EntryDrawerForm
          onSubmit={handleSubmit}
          submitting={submitting}
          formError={formError}
        />
      </Drawer>

      <ActionDialog {...dialogProps} onClose={closeDialog} />
    </div>
  )
}
