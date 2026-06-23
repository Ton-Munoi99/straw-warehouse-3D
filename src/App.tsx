import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Warehouse3D = lazy(() => import('./warehouse3d/Warehouse3D'))
const BOQ = lazy(() => import('./boq/BOQPage'))

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
          <Route path="/" element={<Warehouse3D />} />
          <Route path="/boq" element={<BOQ />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
