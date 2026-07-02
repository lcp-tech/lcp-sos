import { useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useInventory } from '@/features/inventory/hooks'
import type { OutletCtxValue } from '@/shared/layouts/app-layout'

function getStockStatus(available: number) {
  if (available < 0) return { color: '#c8392f', badgeBg: '#fdeceb', badgeColor: '#c8392f', badgeText: 'Negativo' }
  if (available === 0) return { color: '#8a99a8', badgeBg: '#eef1f4', badgeColor: '#8593a1', badgeText: 'Agotado' }
  if (available <= 5) return { color: '#c07d1e', badgeBg: '#f8efdc', badgeColor: '#c07d1e', badgeText: 'Stock bajo' }
  return { color: '#165382', badgeBg: '#e6f5ee', badgeColor: '#2f9e6a', badgeText: 'Disponible' }
}

export function InventoryListPage() {
  const { searchValue, barcodeValue } = useOutletContext<OutletCtxValue>()
  const filters = barcodeValue
    ? { barcode: barcodeValue }
    : searchValue
      ? { name: searchValue }
      : undefined
  const { data, totalCount, loading, error, loadMore, hasMore, loadingMore } = useInventory(filters)

  const lowStockCount = data.filter((e) => e.available > 0 && e.available <= 5).length
  const outCount = data.filter((e) => e.available <= 0).length

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

  return (
    <div style={{ animation: 'screenIn .32s ease' }}>
      {/* Stat cards */}
      {!loading && (
        <div style={{ display: 'flex', gap: 11, margin: '6px 0 16px' }}>
          <div style={{ flex: 1, background: '#fff', border: '1.5px solid #e9edf2', borderRadius: 16, padding: '13px 15px' }}>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.5px' }}>{totalCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8a99a8', marginTop: 1 }}>Artículos</div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: '1.5px solid #f2e0c9', borderRadius: 16, padding: '13px 15px' }}>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#c07d1e', letterSpacing: '-.5px' }}>{lowStockCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b58a4d', marginTop: 1 }}>Stock bajo</div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: '1.5px solid #efd4d1', borderRadius: 16, padding: '13px 15px' }}>
            <div style={{ fontSize: 23, fontWeight: 800, color: '#c8392f', letterSpacing: '-.5px' }}>{outCount}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#c07971', marginTop: 1 }}>Agotados</div>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: '#c8392f', fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>{error}</p>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[18px]" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#9aa8b6', fontWeight: 500 }}>
          Sin resultados
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {data.map((entry) => {
            const status = getStockStatus(entry.available)
            return (
              <button
                key={entry.item.id}
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
                  gap: 14,
                  fontFamily: 'inherit',
                }}
                onMouseDown={(e) => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(.985)'
                  el.style.borderColor = '#cfdae4'
                }}
                onMouseUp={(e) => {
                  const el = e.currentTarget
                  el.style.transform = ''
                  el.style.borderColor = '#e9edf2'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.transform = ''
                  el.style.borderColor = '#e9edf2'
                }}
              >
                {/* Left: name, unit, entry/exit counters */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#122433', lineHeight: 1.25, marginBottom: 5 }}>
                    {entry.item.name}
                  </div>
                  {entry.item.unit && (
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8a99a8', marginBottom: 8 }}>
                      {entry.item.unit}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2f9e6a' }}>↓ {entry.totalEntries}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#d0716a' }}>↑ {entry.totalExits}</span>
                  </div>
                </div>

                {/* Right: available number + status badge */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: status.color }}>
                    {entry.available}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      marginTop: 9,
                      padding: '4px 10px',
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 700,
                      background: status.badgeBg,
                      color: status.badgeColor,
                    }}
                  >
                    <span
                      style={{ width: 6, height: 6, borderRadius: '50%', background: status.badgeColor }}
                      aria-hidden="true"
                    />
                    {status.badgeText}
                  </div>
                </div>
              </button>
            )
          })}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#9aa8b6', fontSize: 13, fontWeight: 500 }}>
              Cargando más…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
