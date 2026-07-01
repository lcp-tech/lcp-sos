import { useCallback, useEffect, useRef, useState } from 'react'
import { Drawer } from '@/shared/components/drawer'
import { BarcodeScanner } from '@/shared/components/barcode-scanner'

export interface SelectorRow {
  id: number
  title: string
  sub: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  data: unknown
}

interface SelectorDrawerProps {
  open: boolean
  title: string
  placeholder: string
  showScan?: boolean
  onBack: () => void
  fetchRows: (query: string) => Promise<SelectorRow[]>
  onSelect: (row: SelectorRow) => void
  /** Called when the barcode scanner detects a code. */
  onScanBarcode?: (code: string) => void
}

/**
 * Bottom-sheet drawer for selecting an item or person.
 * Shows search input, optional barcode scan button, and rows.
 */
export function SelectorDrawer({
  open,
  title,
  placeholder,
  showScan = false,
  onBack,
  fetchRows,
  onSelect,
  onScanBarcode,
}: SelectorDrawerProps) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<SelectorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Stable ref to fetchRows to avoid infinite re-fetches from inline arrow fns
  const fetchRef = useRef(fetchRows)
  fetchRef.current = fetchRows

  const stableFetch = useCallback((q: string) => fetchRef.current(q), [])

  // Fetch immediately on open, then debounce on query change
  const prevOpen = useRef(false)
  const isInitialFetch = useRef(false)

  useEffect(() => {
    if (open && !prevOpen.current) {
      // Just opened — reset and fetch immediately
      setQuery('')
      setRows([])
      setLoading(true)
      isInitialFetch.current = true
      stableFetch('').then((result) => {
        setRows(result)
        setLoading(false)
      }).catch(() => {
        setRows([])
        setLoading(false)
      })
    }
    prevOpen.current = open
  }, [open, stableFetch])

  // Debounce subsequent searches (skip initial, that's handled above)
  useEffect(() => {
    if (!open || isInitialFetch.current) {
      isInitialFetch.current = false
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const result = await stableFetch(query)
        setRows(result)
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [query, open, stableFetch])

  return (
    <>
    <Drawer open={open} onClose={onBack} maxHeight="90%" zLayer={60} skipBodyLock>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '2px 22px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#165382',
                fontSize: 14.5,
                fontWeight: 700,
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#165382" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Atrás
            </button>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f2a40' }}>{title}</div>
            <div style={{ width: 52 }} aria-hidden="true" />
          </div>

          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f5f7fa',
            border: '1.5px solid #e6ebf1',
            borderRadius: 14,
            padding: '0 14px',
            height: 48,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 15,
                fontWeight: 500,
                color: '#12212e',
                fontFamily: 'inherit',
              }}
              autoFocus={open}
            />
          </div>

          {showScan && (
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              style={{
                marginTop: 12,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                background: '#eaf1f7',
                border: '1.5px dashed #b9cee0',
                borderRadius: 14,
                padding: 13,
                cursor: 'pointer',
                color: '#165382',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'inherit',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#165382" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <path d="M3 12h18"/>
              </svg>
              Escanear código de barras
            </button>
          )}
        </div>

        {/* Rows */}
        <div className="scrollarea" style={{ flex: 1, overflowY: 'auto', padding: '2px 22px 30px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: '#f5f7fa',
                    border: '1.5px solid #eef2f6',
                    borderRadius: 14,
                    padding: '13px 15px',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#e9edf2', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: '60%', height: 14, borderRadius: 6, background: '#e9edf2', marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#eef2f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#9aa8b6', fontWeight: 500 }}>
              Sin resultados
            </div>
          ) : (
            rows.map((row) => (
              <button
                key={row.id}
                onClick={() => onSelect(row)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#f5f7fa',
                  border: '1.5px solid #eef2f6',
                  borderRadius: 14,
                  padding: '13px 15px',
                  marginBottom: 9,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: 'inherit',
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.99)'; e.currentTarget.style.borderColor = '#cfdae4' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#eef2f6' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#eef2f6' }}
              >
                <div style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: row.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: row.iconColor,
                }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#122433' }}>{row.title}</div>
                  {row.sub && (
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#8a99a8', marginTop: 1 }}>{row.sub}</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Drawer>

    {/* Barcode scanner */}
    {showScan && (
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setScannerOpen(false)
          if (onScanBarcode) {
            onScanBarcode(code)
          } else {
            // Default: use the scanned code as search query
            setQuery(code)
          }
        }}
      />
    )}
    </>
  )
}
