import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginPage } from '@/features/auth'
import { NotFoundPage } from '@/routes/not-found-page'
import { ProtectedRoute } from '@/routes/protected-route'
import { AppLayout } from '@/shared/layouts'

// Lazy-load feature pages to split the bundle — each tab loads on demand.
const InventoryListPage = lazy(() =>
  import('@/features/inventory').then((m) => ({ default: m.InventoryListPage }))
)
const EntriesListPage = lazy(() =>
  import('@/features/entries').then((m) => ({ default: m.EntriesListPage }))
)
const ExitsListPage = lazy(() =>
  import('@/features/exits').then((m) => ({ default: m.ExitsListPage }))
)
const ItemsListPage = lazy(() =>
  import('@/features/items').then((m) => ({ default: m.ItemsListPage }))
)
const PersonsListPage = lazy(() =>
  import('@/features/persons').then((m) => ({ default: m.PersonsListPage }))
)

/** Minimal loading fallback while a lazy page chunk loads. */
function PageFallback() {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9aa8b6', fontSize: 14, fontWeight: 500 }}>
      Cargando…
    </div>
  )
}

function lazyPage(element: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/inventory" replace /> },
          { path: 'inventory', element: lazyPage(<InventoryListPage />) },
          { path: 'entries', element: lazyPage(<EntriesListPage />) },
          { path: 'exits', element: lazyPage(<ExitsListPage />) },
          { path: 'items', element: lazyPage(<ItemsListPage />) },
          { path: 'persons', element: lazyPage(<PersonsListPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
