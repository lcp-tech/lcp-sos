import { createContext, useCallback, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { BottomNav } from '@/shared/layouts/bottom-nav'
import { Drawer } from '@/shared/components/drawer'
import { BarcodeScanner } from '@/shared/components/barcode-scanner'
import { OfflineBanner } from '@/shared/components/offline-banner'
import { useOnline } from '@/shared/hooks/use-online'
import { useAuthStore } from '@/shared/stores/auth-store'

// ------------ Tab meta -------------------------------------------------------
const TAB_META: Record<string, { kicker: string; title: string; searchPlaceholder: string; showAdd: boolean; showScan: boolean }> = {
  '/inventory':  { kicker: 'Stock actual',  title: 'Inventario', searchPlaceholder: 'Buscar artículo…',  showAdd: false, showScan: true  },
  '/entries':    { kicker: 'Movimientos',   title: 'Entradas',   searchPlaceholder: 'Buscar entrada…',   showAdd: true,  showScan: false },
  '/exits':      { kicker: 'Movimientos',   title: 'Salidas',    searchPlaceholder: 'Buscar salida…',    showAdd: true,  showScan: false },
  '/items':      { kicker: 'Catálogo',      title: 'Artículos',  searchPlaceholder: 'Buscar artículo…',  showAdd: true,  showScan: true  },
  '/persons':    { kicker: 'Directorio',    title: 'Personas',   searchPlaceholder: 'Buscar persona…',   showAdd: true,  showScan: false },
}

// ------------ Add-button callback context -----------------------------------
// Pages register an "onAdd" handler; the header "+" button calls it.
type AddHandler = () => void

interface AddContextValue {
  registerAddHandler: (fn: AddHandler) => () => void
}

export const AddContext = createContext<AddContextValue>({
  registerAddHandler: () => () => {},
})

// ------------ Outlet context shared to pages ---------------------------------
export interface OutletCtxValue {
  searchValue: string
  barcodeValue: string
  clearFilters: () => void
  isOnline: boolean
}

/** App shell with the Acopio design: custom header, search bar, bottom nav, menu drawer, toast. */
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const tabMeta = TAB_META[location.pathname] ?? TAB_META['/inventory']
  const isOnline = useOnline()

  const [searchValue, setSearchValue] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function clearFilters() {
    setSearchValue('')
    setBarcodeValue('')
  }

  // Add-handler registry: pages register here, header "+" calls it
  const addHandlerRef = useRef<AddHandler | null>(null)

  const registerAddHandler = useCallback((fn: AddHandler) => {
    addHandlerRef.current = fn
    return () => {
      if (addHandlerRef.current === fn) addHandlerRef.current = null
    }
  }, [])

  function handleAdd() {
    if (addHandlerRef.current) {
      addHandlerRef.current()
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  // Clear search + barcode when tab changes
  const prevPath = useRef(location.pathname)
  if (prevPath.current !== location.pathname) {
    prevPath.current = location.pathname
    if (searchValue || barcodeValue) {
      // Schedule to avoid setState during render
      setTimeout(() => { setSearchValue(''); setBarcodeValue('') }, 0)
    }
  }

  const outletCtx: OutletCtxValue = { searchValue, barcodeValue, clearFilters, isOnline }

  return (
    <AddContext.Provider value={{ registerAddHandler }}>
      <div style={{ position: 'relative', minHeight: '100dvh', background: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>

        <OfflineBanner />

        {/* ---- HEADER ---- */}
        <header style={{ flexShrink: 0, padding: '20px 20px 14px', background: '#f5f7fa' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            {/* Title group */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8a99a8', letterSpacing: '.2px' }}>{tabMeta.kicker}</div>
              <div style={{ fontSize: 25, fontWeight: 800, color: '#0f2a40', letterSpacing: '-.6px', lineHeight: 1.1 }}>{tabMeta.title}</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {tabMeta.showAdd && isOnline && (
                <button
                  onClick={handleAdd}
                  aria-label={`Añadir en ${tabMeta.title}`}
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(180deg, #1d6299, #165382)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
              )}
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Cuenta y menú"
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: '#fff', border: '1.5px solid #e6ecf2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a4d5e" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="3.2"/>
                  <path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search bar + optional scan button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #e6ecf2', borderRadius: 15, padding: '0 14px', height: 48 }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9aa8b6" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                value={barcodeValue || searchValue}
                onChange={(e) => { setBarcodeValue(''); setSearchValue(e.target.value) }}
                placeholder={tabMeta.searchPlaceholder}
                aria-label="Buscar"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: 500, color: '#12212e', fontFamily: 'inherit' }}
                readOnly={!!barcodeValue}
              />
              {(searchValue || barcodeValue) && (
                <button
                  onClick={clearFilters}
                  aria-label="Limpiar búsqueda"
                  style={{ border: 'none', background: '#eef2f6', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7a8a98" strokeWidth="2.6" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {tabMeta.showScan && (
              <button
                onClick={() => setScannerOpen(true)}
                aria-label="Escanear código de barras"
                style={{
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(180deg, #1d6299, #165382)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <path d="M3 12h18"/>
                </svg>
              </button>
            )}
          </div>
        </header>

        {/* ---- SCROLLABLE CONTENT ---- */}
        <main className="scrollarea" style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 96px' }}>
          <Outlet context={outletCtx} />
        </main>

        {/* ---- BOTTOM NAV ---- */}
        <BottomNav />

        {/* ---- MENU DRAWER ---- */}
        <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
          <div style={{ padding: '8px 22px 30px' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0f2a40', margin: '6px 2px 16px' }}>Cuenta</div>
            <button
              onClick={() => { setMenuOpen(false); navigate('/inventory') }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, background: '#f5f7fa', border: '1.5px solid #eef2f6', borderRadius: 15, padding: '15px 16px', marginBottom: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eaf1f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2c6ea0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#122433' }}>Ir al inicio</span>
            </button>
            <button
              onClick={() => { setMenuOpen(false); handleLogout() }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, background: '#fdeceb', border: '1.5px solid #f6dcda', borderRadius: 15, padding: '15px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fadfdc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d0574d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#c8392f' }}>Cerrar sesión</span>
            </button>
          </div>
        </Drawer>

        {/* Barcode scanner for inventory/items search */}
        <BarcodeScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(code) => {
            setScannerOpen(false)
            setSearchValue('')
            setBarcodeValue(code)
          }}
        />

      </div>
    </AddContext.Provider>
  )
}
