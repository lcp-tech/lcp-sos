import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/inventory',
    label: 'Inventario',
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5 12 4l8.5 4.5-8.5 4.5z"/>
        <path d="M3.5 8.5v7L12 20l8.5-4.5v-7"/>
      </svg>
    ),
  },
  {
    to: '/entries',
    label: 'Entradas',
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v11"/>
        <path d="m7 11 5 5 5-5"/>
        <path d="M5 20h14"/>
      </svg>
    ),
  },
  {
    to: '/exits',
    label: 'Salidas',
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V9"/>
        <path d="m7 13 5-5 5 5"/>
        <path d="M5 4h14"/>
      </svg>
    ),
  },
  {
    to: '/items',
    label: 'Artículos',
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 3 7v10l9 5 9-5V7z"/>
        <path d="M3.3 7 12 12l8.7-5"/>
        <path d="M12 22V12"/>
      </svg>
    ),
  },
  {
    to: '/persons',
    label: 'Personas',
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2"/>
        <path d="M2.5 19a6.5 6.5 0 0 1 13 0"/>
        <path d="M16 5.2a3.2 3.2 0 0 1 0 5.9"/>
        <path d="M18 19a6.5 6.5 0 0 0-3-5.5"/>
      </svg>
    ),
  },
]

/** Fixed 5-tab bottom navigation bar matching the Acopio design. */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid #e6ecf2',
        display: 'flex',
        paddingTop: 8,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
        zIndex: 40,
      }}
    >
      {NAV_ITEMS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: 4,
            padding: '6px 0',
            color: isActive ? '#165382' : '#9aabb8',
            textDecoration: 'none',
            cursor: 'pointer',
          })}
          aria-current={undefined}
        >
          {icon}
          <span style={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
