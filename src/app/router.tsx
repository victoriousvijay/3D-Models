import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router'

// Each screen is its own chunk: the landing page does not download the lab
// hub, and no page downloads a simulation until it is opened.
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LabHubPage = lazy(() => import('@/pages/LabHubPage'))
const DivisionPage = lazy(() => import('@/pages/DivisionPage'))
const SimulationPage = lazy(() => import('@/pages/SimulationPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PageFallback() {
  return (
    <div className="grid h-dvh place-items-center bg-lab-bg" role="status" aria-live="polite">
      <span className="text-xs tracking-[0.2em] text-lab-muted uppercase">Loading lab…</span>
    </div>
  )
}

function RootLayout() {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <ScrollRestoration />
    </>
  )
}

/**
 * Navigation: Landing → Lab Hub → Division lab → Lab.
 * See LAB_NAVIGATION_ARCHITECTURE.md.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'lab', element: <LabHubPage /> },
      { path: 'lab/:division', element: <DivisionPage /> },
      { path: 'lab/:division/:labId', element: <SimulationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
