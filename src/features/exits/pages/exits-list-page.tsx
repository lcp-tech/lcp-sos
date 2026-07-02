import { useState, useContext, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Drawer } from '@/shared/components/drawer'
import { ActionDialog } from '@/shared/components/action-dialog'
import { useActionDialog } from '@/shared/hooks/use-action-dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AddContext } from '@/shared/layouts/app-layout'
import { useArchiveExit, useCreateExit, useExits } from '@/features/exits/hooks'
import { toCreateExitDTO, type ExitFormValues } from '@/features/exits/schemas'
import { ExitDrawerForm } from '@/features/exits/components/exit-drawer-form'

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

export function ExitsListPage() {
  const { searchValue } = useOutletContext<OutletCtx>()
  const { data, loading, error, refetch, loadMore, hasMore, loadingMore } = useExits()
  useArchiveExit() // available for future use
  const { createExit, submitting } = useCreateExit()
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

  const filtered = searchValue
    ? data.filter(
        (e) =>
          e.item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          (e.recipient && `${e.recipient.names} ${e.recipient.surnames}`.toLowerCase().includes(searchValue.toLowerCase()))
      )
    : data

  async function handleSubmit(values: ExitFormValues) {
    setFormError('')
    setFormOpen(false)
    try {
      await runWithDialog({
        loading: 'Registrando salida…',
        success: 'Salida registrada',
        error: 'No se pudo registrar la salida',
        action: async () => {
          const exit = await createExit(toCreateExitDTO(values))
          if (!exit) throw new Error('fail')
        },
      })
      refetch()
    } catch {
      /* dialog shows error */
    }
  }

  return (
    <div style={{ animation: 'screenIn .32s ease' }}>
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
          {searchValue ? 'Sin resultados' : 'Aún no hay salidas registradas'}
        </div>
      ) : (
        <div>
          {filtered.map((exit) => (
            <button
              key={exit.id}
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
              {/* Red icon */}
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 13, background: '#fdeceb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#d0574d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V9"/><path d="m7 13 5-5 5 5"/><path d="M5 4h14"/>
                </svg>
              </div>

              {/* Item + person + date */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#122433', lineHeight: 1.25, marginBottom: 3 }}>
                  {exit.item.name}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8a99a8' }}>
                  {exit.recipient ? `${exit.recipient.names} ${exit.recipient.surnames}` : 'Sin beneficiario'} · {fmtDate(exit.createdAt)}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d0574d', letterSpacing: '-.3px' }}>
                  −{exit.quantity}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#a7b3bf', marginTop: 2 }}>
                  {unitShort(exit.item.unit)}
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

      {/* Create Exit Drawer */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)}>
        <ExitDrawerForm
          onSubmit={handleSubmit}
          submitting={submitting}
          formError={formError}
        />
      </Drawer>

      <ActionDialog {...dialogProps} onClose={closeDialog} />
    </div>
  )
}
