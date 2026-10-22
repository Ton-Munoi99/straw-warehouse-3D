import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import { Canvas } from '@react-three/fiber'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Check,
  CloudSun,
  FileSpreadsheet,
  FileText,
  Home,
  RefreshCw,
  Ruler,
  Tag,
  TrendingUp,
  Truck as TruckIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import Scene, { CameraController, SceneState, TimeOfDay } from './Scene'
import { ViewName, tourShots, views, zones } from './data'
import { DEFAULT_INPUTS, STORAGE, storageBales, storageCapacityT } from '../feasibility/model'

type View = ViewName

const VIEW_LABELS: Record<'front' | 'side' | 'top' | 'interior', string> = {
  front: 'Front',
  side: 'Side',
  top: 'Top',
  interior: 'Interior',
}

const BENEFITS = [
  'Keeps straw dry through the monsoon season',
  'Reduces post-harvest storage loss',
  'Supports fast truck loading & dispatch',
  'Improves collection-hub logistics efficiency',
  'Low-cost, durable build for rice-field areas',
]

const STATS = [
  { label: 'Footprint', value: '18 × 10 m', accent: false },
  { label: 'Clear height', value: '6.4 m eave · 9.0 m roof', accent: false },
  { label: 'Roof', value: 'Gable metal sheet', accent: false },
  {
    label: 'Straw capacity',
    value: `${storageBales().toLocaleString('en-US')} bales · ${Math.round(storageCapacityT(DEFAULT_INPUTS))} t`,
    accent: true,
  },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#9aa499]">
      {children}
    </div>
  )
}

export default function Warehouse3D() {
  const [view, setView] = useState<View>('iso')
  const [state, setState] = useState<SceneState>({
    rotate: false,
    labels: true,
    selected: null,
    doorsOpen: true,
    wallsOpen: true,
    weather: 'sunny',
    time: 'noon',
    activity: true,
    dims: false,
    layers: 10,
  })
  const controller = useRef<CameraController | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  // PNG of the current 3D view (labels are HTML overlays, so they aren't in the image)
  const snapshot = () => {
    const canvas = stageRef.current?.querySelector('canvas')
    canvas?.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `straw-warehouse-3d-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, 'image/png')
  }

  // ---- guided tour: step through tourShots, one every TOUR_MS ----
  const TOUR_MS = 6500
  const [tour, setTour] = useState<number | null>(null)
  useEffect(() => {
    if (tour == null) return
    const shot = tourShots[tour]
    controller.current?.setView(shot.view)
    setState((s) => ({ ...s, rotate: false, selected: shot.zone }))
    const id = setTimeout(() => setTour((t) => (t != null && t + 1 < tourShots.length ? t + 1 : null)), TOUR_MS)
    return () => clearTimeout(id)
  }, [tour])
  const startTour = () => {
    setView('iso')
    // open everything so the interior shots can see inside
    setState((s) => ({ ...s, doorsOpen: true, wallsOpen: true, labels: true }))
    setTour(0)
  }
  const stopTour = () => {
    setTour(null)
    setState((s) => ({ ...s, selected: null }))
  }
  const tourZone = tour != null ? zones.find((z) => z.key === tourShots[tour].zone) : undefined

  const selectView = (name: View) => {
    setTour(null)
    setView(name)
    setState((s) => ({ ...s, rotate: false }))
    controller.current?.setView(views[name])
  }
  const toggleRotate = () => {
    setTour(null)
    setView('iso')
    setState((s) => ({ ...s, rotate: !s.rotate }))
  }
  const zoom = (f: number) => controller.current?.zoom(f)
  const selectZone = (key: string) =>
    setState((s) => ({ ...s, selected: s.selected === key ? null : key }))

  const sel = zones.find((z) => z.key === state.selected)
  const cardColor = sel?.color ?? '#2f6b3f'
  const cardKicker = sel ? 'Selected zone' : 'Overview'
  const cardTitle = sel ? sel.label : 'Open-sided straw store'
  const cardDesc = sel
    ? sel.desc
    : 'A practical, low-cost warehouse that collects and protects baled rice straw beside the field. Open sides keep it dry, a raised slab beats flooding, and wide access keeps trucks moving. Tap a zone above or a tag in the scene.'

  return (
    <div className="fixed inset-0 flex flex-col bg-app-bg text-ink">
      {/* HEADER */}
      <header className="z-[5] flex flex-none flex-wrap items-center gap-x-5 gap-y-2 border-b border-hairline bg-white px-4 py-3 sm:px-[22px]">
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-forest">
            <Home size={22} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-[-0.01em]">Rice Straw Storage Warehouse</div>
            <div className="text-xs font-medium text-muted">
              Open-sided collection hub · Rural rice-field site, Thailand
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`hidden rounded-[9px] border px-3.5 py-[7px] xl:block ${
                s.accent ? 'border-hairline bg-pale-green' : 'border-hairline bg-[#fafaf6]'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-[0.05em] ${
                  s.accent ? 'text-[#7ba07f]' : 'text-[#9aa499]'
                }`}
              >
                {s.label}
              </div>
              <div className={`text-sm font-bold ${s.accent ? 'text-forest' : ''}`}>{s.value}</div>
            </div>
          ))}
          <Link
            to="/feasibility"
            className="flex items-center gap-2 rounded-[9px] border border-straw bg-straw px-4 py-[9px] text-[13px] font-bold text-white no-underline transition-opacity hover:opacity-90"
          >
            <TrendingUp size={16} strokeWidth={1.9} />
            ROI
          </Link>
          <Link
            to="/boq"
            className="flex items-center gap-2 rounded-[9px] border border-forest bg-forest px-4 py-[9px] text-[13px] font-bold text-white no-underline transition-opacity hover:opacity-90"
          >
            <FileSpreadsheet size={16} strokeWidth={1.9} />
            BOQ
          </Link>
          <a
            href="/3d-concept.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[9px] border border-forest bg-white px-4 py-[9px] text-[13px] font-bold text-forest no-underline transition-opacity hover:opacity-90"
          >
            <FileText size={16} strokeWidth={1.9} />
            PDF
          </a>
        </div>
      </header>

      {/* MAIN ROW */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* 3D STAGE */}
        <div
          ref={stageRef}
          className="relative min-h-[48vh] min-w-0 flex-1 overflow-hidden md:min-h-0"
          style={{ background: 'linear-gradient(#cfe6f1,#dfeede)' }}
        >
          <div className="pointer-events-none absolute left-5 top-5 z-[3] rounded-xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7c806e]">FIELD / 01 · WAREHOUSE STUDY</div>
            <div className="mt-1 text-sm font-bold text-[#344536]">Rice straw collection hub</div>
          </div>
          <Canvas
            shadows={{ type: PCFSoftShadowMap }}
            dpr={[1, 2]}
            // preserveDrawingBuffer: keeps the last frame readable for the PNG snapshot button
            gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, preserveDrawingBuffer: true }}
            camera={{ fov: 42, near: 0.1, far: 1000, position: [30, 22, 32] }}
          >
            <Scene state={state} controllerRef={controller} onSelectZone={selectZone} />
          </Canvas>

          <button
            onClick={snapshot}
            title="บันทึกภาพ 3D เป็น PNG / Save 3D view as PNG"
            className="absolute right-3 top-3 z-[3] flex items-center gap-1.5 rounded-[10px] border border-hairline bg-white/[0.9] px-3 py-2 text-[12px] font-bold text-forest shadow-sm backdrop-blur hover:bg-white sm:right-5 sm:top-5"
          >
            <Camera size={15} strokeWidth={1.9} />
            <span>ถ่ายภาพ / PNG</span>
          </button>

          {tour != null && (
            <div className="absolute inset-x-3 bottom-3 z-[4] rounded-[12px] border border-hairline bg-white/[0.94] px-4 py-3 shadow-md backdrop-blur sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(560px,calc(100%-40px))] sm:-translate-x-1/2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: tourZone?.color ?? '#2f6b3f' }} />
                <span className="text-[13px] font-extrabold text-ink">{tourZone?.label ?? (tour === 0 ? 'Overview' : 'Tour complete')}</span>
                <span className="ml-auto text-[11px] font-semibold text-[#9aa499]">
                  {tour + 1} / {tourShots.length}
                </span>
              </div>
              <div className="mt-1 text-[12px] leading-[1.5] text-[#54625a]">
                {tourZone?.desc ??
                  (tour === 0
                    ? `An open-sided rice-straw collection hub — 18 × 10 m, 9 m to the ridge, ${storageBales().toLocaleString('en-US')} bales (≈${Math.round(storageCapacityT(DEFAULT_INPUTS))} t) when fully stacked. Follow a load of straw from the road to the stack.`
                    : 'That is the full loop: road → loading apron → aisle → stacks, with open sides, a deep roof and perimeter drains keeping the straw dry.')}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1 flex-1 overflow-hidden rounded bg-[#ece8dc]">
                  <div className="h-full rounded bg-forest transition-all" style={{ width: `${((tour + 1) / tourShots.length) * 100}%` }} />
                </div>
                <button aria-label="Previous stop" disabled={tour === 0} onClick={() => setTour((t) => Math.max(0, (t ?? 0) - 1))} className="rounded-md border border-hairline p-1 text-[#54625a] disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button aria-label="Next stop" onClick={() => setTour((t) => (t != null && t + 1 < tourShots.length ? t + 1 : null))} className="rounded-md border border-hairline p-1 text-[#54625a]">
                  <ChevronRight size={15} />
                </button>
                <button onClick={stopTour} className="rounded-md border border-hairline px-2 py-1 text-[11px] font-bold text-[#c25b46]">
                  Stop
                </button>
              </div>
            </div>
          )}

          <div className={`absolute bottom-3 left-3 z-[3] ${tour != null ? 'hidden' : 'flex'} items-center gap-2 rounded-[10px] border border-hairline bg-white/[0.86] px-[11px] py-1.5 text-[11px] font-medium text-[#5a6b5f] backdrop-blur sm:bottom-4 sm:left-[18px] sm:px-[13px] sm:py-2 sm:text-xs`}>
            <RefreshCw size={15} color="#2f6b3f" strokeWidth={1.8} />
            <span className="sm:hidden">Drag · zoom · tap a tag</span>
            <span className="hidden sm:inline">Drag to orbit · Scroll to zoom · Select a numbered zone</span>
          </div>

          <div className="absolute bottom-3 right-3 z-[3] hidden sm:block text-[10px] font-medium text-[#5a6b5f] sm:bottom-4 sm:right-4 sm:text-[11px]">
            Design by <span className="font-bold text-forest">Sponlapat / BD</span>
          </div>
        </div>

        {/* CONTROL PANEL */}
        <aside className="scrl flex w-full flex-none flex-col gap-[18px] overflow-y-auto border-t border-hairline bg-white p-[18px] md:w-[310px] md:border-l md:border-t-0">
          {/* Camera Views */}
          <section>
            <SectionTitle>Camera Views</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(VIEW_LABELS) as (keyof typeof VIEW_LABELS)[]).map((k) => {
                const active = view === k && !state.rotate
                return (
                  <button
                    key={k}
                    onClick={() => selectView(k)}
                    className="flex items-center justify-center rounded-[10px] border px-2 py-[11px] text-[13px] font-semibold"
                    style={{
                      borderColor: active ? '#2f6b3f' : '#e1ddd0',
                      background: active ? '#2f6b3f' : '#fff',
                      color: active ? '#fff' : '#33403a',
                    }}
                  >
                    {VIEW_LABELS[k]}
                  </button>
                )
              })}
            </div>
            <button
              onClick={toggleRotate}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border px-2 py-[11px] text-[13px] font-bold"
              style={{
                borderColor: state.rotate ? '#c8902f' : '#e1ddd0',
                background: state.rotate ? '#c8902f' : '#fff',
                color: state.rotate ? '#fff' : '#33403a',
              }}
            >
              <RefreshCw size={16} strokeWidth={1.9} />
              {state.rotate ? 'Stop rotation' : 'Rotate 360°'}
            </button>
            <button
              onClick={tour == null ? startTour : stopTour}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border px-2 py-[11px] text-[13px] font-bold"
              style={{
                borderColor: tour != null ? '#2f6b3f' : '#e1ddd0',
                background: tour != null ? '#2f6b3f' : '#fff',
                color: tour != null ? '#fff' : '#33403a',
              }}
            >
              <Footprints size={16} strokeWidth={1.9} />
              {tour != null ? 'Stop guided tour' : 'Guided tour'}
            </button>
          </section>

          {/* Controls */}
          <section>
            <SectionTitle>Controls</SectionTitle>
            <div className="flex gap-2">
              <button
                onClick={() => zoom(1.25)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#e1ddd0] bg-white px-2 py-[11px] text-[13px] font-semibold text-[#33403a]"
              >
                <ZoomOut size={16} strokeWidth={2} />
                Zoom out
              </button>
              <button
                onClick={() => zoom(0.8)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#e1ddd0] bg-white px-2 py-[11px] text-[13px] font-semibold text-[#33403a]"
              >
                <ZoomIn size={16} strokeWidth={2} />
                Zoom in
              </button>
            </div>
            <button
              onClick={() => setState((s) => ({ ...s, labels: !s.labels }))}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border px-2 py-[11px] text-[13px] font-bold"
              style={{
                borderColor: state.labels ? '#2f6b3f' : '#e1ddd0',
                background: state.labels ? '#eef5ee' : '#fff',
                color: state.labels ? '#2f6b3f' : '#33403a',
              }}
            >
              <Tag size={16} strokeWidth={1.9} />
              {state.labels ? 'Hide labels' : 'Show labels'}
            </button>
          </section>

          {/* Doors & Walls */}
          <section>
            <SectionTitle>Doors &amp; Walls</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <CloseBtn
                on={state.doorsOpen}
                color="#2f6b3f"
                icon={<TagDoorIcon />}
                label={state.doorsOpen ? 'Doors: Open' : 'Doors: Closed'}
                onClick={() => setState((s) => ({ ...s, doorsOpen: !s.doorsOpen }))}
              />
              <CloseBtn
                on={state.wallsOpen}
                color="#3f7fae"
                icon={<WallIcon />}
                label={state.wallsOpen ? 'Sides: Open' : 'Sides: Closed'}
                onClick={() => setState((s) => ({ ...s, wallsOpen: !s.wallsOpen }))}
              />
            </div>
            <div className="mt-[7px] text-[11px] leading-[1.45] text-[#9aa499]">
              Close the sides &amp; doors for rain &amp; security; open them for natural cross-ventilation.
            </div>
          </section>

          {/* Scene */}
          <section>
            <SectionTitle>Scene</SectionTitle>
            <div className="flex flex-col gap-2">
              <CloseBtn
                on={state.weather === 'rainy'}
                color="#5a6b7a"
                full
                icon={<CloudSun size={15} strokeWidth={1.8} />}
                label={state.weather === 'rainy' ? 'Weather: Rainy' : 'Weather: Sunny'}
                onClick={() =>
                  setState((s) => ({ ...s, weather: s.weather === 'rainy' ? 'sunny' : 'rainy' }))
                }
              />
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Time of day">
                {(['morning', 'noon', 'evening'] as TimeOfDay[]).map((t) => {
                  const on = state.time === t
                  return (
                    <button
                      key={t}
                      onClick={() => setState((s) => ({ ...s, time: t }))}
                      aria-pressed={on}
                      title={state.weather === 'rainy' ? 'Switch weather to Sunny to see the light change' : undefined}
                      className="rounded-[9px] border px-1 py-[9px] text-[12px] font-semibold capitalize"
                      style={{
                        borderColor: on ? '#c8902f' : '#e1ddd0',
                        background: on ? '#fbf2e0' : '#fff',
                        color: on ? '#a9772a' : '#33403a',
                      }}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <CloseBtn
                on={state.activity}
                color="#c8902f"
                full
                icon={<TruckIcon size={15} strokeWidth={1.8} />}
                label={state.activity ? 'Activity: On' : 'Activity: Off'}
                onClick={() => setState((s) => ({ ...s, activity: !s.activity }))}
              />
              <CloseBtn
                on={state.dims}
                color="#33403a"
                full
                icon={<Ruler size={15} strokeWidth={1.8} />}
                label={state.dims ? 'Dimensions: On' : 'Dimensions: Off'}
                onClick={() => setState((s) => ({ ...s, dims: !s.dims }))}
              />
            </div>
          </section>

          {/* Storage fill — same STORAGE numbers the ROI page uses for its capacity check */}
          <section>
            <SectionTitle>Storage Fill</SectionTitle>
            {(() => {
              const perLayer = STORAGE.cols * STORAGE.rows
              const bales = perLayer * state.layers
              const t = (bales * DEFAULT_INPUTS.baleKg) / 1000
              const pct = Math.round((state.layers / STORAGE.maxLayers) * 100)
              return (
                <>
                  <input
                    type="range"
                    min={0}
                    max={STORAGE.maxLayers}
                    step={1}
                    value={state.layers}
                    onChange={(e) => setState((s) => ({ ...s, layers: Number(e.target.value) }))}
                    aria-label="Bale layers stacked"
                    className="w-full accent-[#c8902f]"
                  />
                  <div className="mt-1 flex items-baseline justify-between text-[12px]">
                    <span className="font-bold text-ink">
                      {bales.toLocaleString('en-US')} bales · {t.toFixed(1)} t
                    </span>
                    <span className="font-bold text-straw">{pct}%</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-[1.45] text-[#9aa499]">
                    {state.layers} of {STORAGE.maxLayers} layers ({(state.layers * STORAGE.layerM).toFixed(1)} m high) ·
                    full = {storageBales().toLocaleString('en-US')} bales ≈ {Math.round(storageCapacityT(DEFAULT_INPUTS))} t at{' '}
                    {DEFAULT_INPUTS.baleKg} kg/bale
                  </div>
                </>
              )
            })()}
          </section>

          {/* Key Zones */}
          <section>
            <SectionTitle>Key Zones</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {zones.map((z, index) => {
                const active = state.selected === z.key
                return (
                  <button
                    key={z.key}
                    onClick={() => selectZone(z.key)}
                    className="flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left"
                    style={{
                      borderColor: active ? z.color : '#ece8dc',
                      background: active ? '#faf7ef' : '#fff',
                    }}
                  >
                    <span
                      className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: z.color }}
                    >{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-[13px] font-semibold">{z.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Info card */}
          <section className="overflow-hidden rounded-[14px] border border-[#e8e4d8]">
            <div className="px-3.5 py-[13px] text-white" style={{ background: cardColor }}>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-85">
                {cardKicker}
              </div>
              <div className="mt-0.5 text-base font-extrabold tracking-[-0.01em]">{cardTitle}</div>
            </div>
            <div className="px-3.5 py-3.5 text-[13px] leading-[1.55] text-[#54625a]">{cardDesc}</div>
          </section>

          {/* Project Benefits */}
          <section>
            <SectionTitle>Project Benefits</SectionTitle>
            <div className="flex flex-col gap-[9px]">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-start gap-2.5">
                  <span className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-md bg-[#e7f1e8]">
                    <Check size={11} color="#2f6b3f" strokeWidth={3} />
                  </span>
                  <span className="text-[13px] leading-[1.4] text-[#3a473f]">{b}</span>
                </div>
              ))}
            </div>
          </section>

        </aside>
      </div>
    </div>
  )
}

function CloseBtn({
  on,
  color,
  icon,
  label,
  onClick,
  full,
}: {
  on: boolean
  color: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  full?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-[7px] rounded-[10px] border px-2 py-[11px] text-[12.5px] font-semibold ${
        full ? 'w-full' : ''
      }`}
      style={{
        borderColor: on ? color : '#e1ddd0',
        background: on ? color : '#fff',
        color: on ? '#fff' : '#33403a',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// door icon (rectangle + center line) matching the source SVG
function TagDoorIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M12 3v18" />
    </svg>
  )
}
// wall icon (courses of blocks) matching the source SVG
function WallIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18" />
      <rect x="5" y="8" width="14" height="11" rx="1" />
      <path d="M5 12h14M5 15.5h14" />
    </svg>
  )
}
