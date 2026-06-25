import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const HomePage = lazy(() => import('./home/HomePage'))
const Warehouse3D = lazy(() => import('./warehouse3d/Warehouse3D'))
const BOQ = lazy(() => import('./boq/BOQPage'))
const Feasibility = lazy(() => import('./feasibility/FeasibilityPage'))
const Deck = lazy(() => import('./deck/DeckPage'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-app-bg text-muted">
            Loading…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/3d" element={<Warehouse3D />} />
          <Route path="/boq" element={<BOQ />} />
          <Route path="/feasibility" element={<Feasibility />} />
          <Route path="/deck" element={<Deck />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
