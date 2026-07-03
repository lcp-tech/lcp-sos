import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useInventory } from '@/features/inventory/hooks'
import type { InventoryStatus } from '@/features/inventory/types'
import type { OutletCtxValue } from '@/shared/layouts/app-layout'

function getStockStatus(available: number) {
  if (available < 0) return { color: '#c8392f', badgeBg: '#fdeceb', badgeColor: '#c8392f', badgeText: 'Negativo' }
  if (available === 0) return { color: '#8a99a8', badgeBg: '#eef1f4', badgeColor: '#8593a1', badgeText: 'Agotado' }
  if (available <= 5) return { color: '#c07d1e', badgeBg: '#f8efdc', badgeColor: '#c07d1e', badgeText: 'Stock bajo' }
  return { color: '#165382', badgeBg: '#e6f5ee', badgeColor: '#2f9e6a', badgeText: 'Disponible' }
}

export function InventoryListPage() {
  const { searchValue, barcodeValue } = useOutletContext<OutletCtxValue>()
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | undefined>(undefined)

  const filters = {
    ...(barcodeValue ? { barcode: barcodeValue } : searchValue ? { name: searchValue } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }

  const { data, summary, loading, error, loadMore, hasMore, loadingMore } = useInventory(
    Object.keys(filters).length > 0 ? filters : undefined
  )

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

  function toggleFilter(s: InventoryStatus) {
    setStatusFilter((prev) => (prev === s ? undefined : s))
  }

  const activeCardBorder = '2px solid #165382'
  const defaultCardBorder = '1.5px solid #e9edf2'

  return (
    <div style={{ animation: 'screenIn .32s ease' }}>
      {/* Stat cards */}
      {!loading && (
        <div style={{ display: 'flex', gap: 8, margin: '6px 0 16px', flexWrap: 'wrap' }}>
          {/* Total artículos — clears all filters */}
          <button
            onClick={() => setStatusFilter(undefined)}
            style={{
              flex: '1 1 calc(50% - 4px)',
              minWidth: 0,
              background: '#fff',
              border: !statusFilter ? activeCardBorder : defaultCardBorder,
              borderRadius: 16,
              padding: '13px 15px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 23, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.5px' }}>
              {summary.available + summary.outOfStock + summary.negative}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8a99a8', marginTop: 1 }}>Artículos</div>
          </button>

          {/* Disponibles */}
          <button
            onClick={() => toggleFilter('available')}
            style={{
              flex: '1 1 calc(50% - 4px)',
              minWidth: 0,
              background: '#fff',
              border: statusFilter === 'available' ? activeCardBorder : defaultCardBorder,
              borderRadius: 16,
              padding: '13px 15px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 23, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.5px' }}>{summary.available}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8a99a8', marginTop: 1 }}>Disponibles</div>
            {statusFilter === 'available' && (
              <span style={{ position: 'absolute', top: 7, right: 9, fontSize: 13, color: '#165382', fontWeight: 700 }}>×</span>
            )}
          </button>

          {/* Stock bajo */}
          <button
            onClick={() => toggleFilter('low')}
            style={{
              flex: '1 1 calc(50% - 4px)',
              minWidth: 0,
              background: '#fff',
              border: statusFilter === 'low' ? activeCardBorder : '1.5px solid #f2e0c9',
              borderRadius: 16,
              padding: '13px 15px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 23, fontWeight: 800, color: '#c07d1e', letterSpacing: '-.5px' }}>{summary.low}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b58a4d', marginTop: 1 }}>Stock bajo</div>
            {statusFilter === 'low' && (
              <span style={{ position: 'absolute', top: 7, right: 9, fontSize: 13, color: '#165382', fontWeight: 700 }}>×</span>
            )}
          </button>

          {/* Agotados */}
          <button
            onClick={() => toggleFilter('out_of_stock')}
            style={{
              flex: '1 1 calc(50% - 4px)',
              minWidth: 0,
              background: '#fff',
              border: statusFilter === 'out_of_stock' ? activeCardBorder : '1.5px solid #efd4d1',
              borderRadius: 16,
              padding: '13px 15px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 23, fontWeight: 800, color: '#c8392f', letterSpacing: '-.5px' }}>{summary.outOfStock}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#c07971', marginTop: 1 }}>Agotados</div>
            {statusFilter === 'out_of_stock' && (
              <span style={{ position: 'absolute', top: 7, right: 9, fontSize: 13, color: '#165382', fontWeight: 700 }}>×</span>
            )}
          </button>

          {/* Negativos — always visible */}
          <button
            onClick={() => toggleFilter('negative')}
            style={{
              flex: '1 1 calc(50% - 4px)',
              minWidth: 0,
              background: '#fff',
              border: statusFilter === 'negative' ? activeCardBorder : '1.5px solid #f2d0cf',
              borderRadius: 16,
              padding: '13px 15px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 23, fontWeight: 800, color: '#9b1f1a', letterSpacing: '-.5px' }}>{summary.negative}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#b5524e', marginTop: 1 }}>Negativos</div>
            {statusFilter === 'negative' && (
              <span style={{ position: 'absolute', top: 7, right: 9, fontSize: 13, color: '#165382', fontWeight: 700 }}>×</span>
            )}
          </button>
        </div>
      )}

      {/* Loading skeletons for stat cards */}
      {loading && (
        <div style={{ display: 'flex', gap: 8, margin: '6px 0 16px', flexWrap: 'wrap' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, height: 60, borderRadius: 16 }} />
          ))}
        </div>
      )}

      {statusFilter && (
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#165382', marginBottom: 10, marginTop: -6 }}>
          Filtrando por: {statusFilter === 'available' ? 'Disponibles' : statusFilter === 'low' ? 'Stock bajo' : statusFilter === 'out_of_stock' ? 'Agotados' : 'Negativos'}
          {' '}<button onClick={() => setStatusFilter(undefined)} style={{ border: 'none', background: 'none', color: '#c8392f', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12.5, fontFamily: 'inherit' }}>× Quitar filtro</button>
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
