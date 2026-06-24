import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import {
  Check,
  CloudSun,
  FileSpreadsheet,
  Home,
  RefreshCw,
  Ruler,
  Tag,
  Truck as TruckIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import Scene, { CameraController, SceneState } from './Scene'
import { ViewName, views, zones } from './data'

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
  { label: 'Footprint', value: '20 × 10 m', accent: false },
  { label: 'Clear height', value: '5.0 m eave', accent: false },
  { label: 'Roof', value: 'Gable metal sheet', accent: false },
  { label: 'Straw capacity', value: '~1,500 bales · ~30 t', accent: true },
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
    activity: true,
    dims: false,
  })
  const controller = useRef<CameraController | null>(null)

  const selectView = (name: View) => {
    setView(name)
    setState((s) => ({ ...s, rotate: false }))
    controller.current?.setView(views[name])
  }
  const toggleRotate = () => {
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
      <header className="z-[5] flex flex-none items-center gap-5 border-b border-hairline bg-white px-[22px] py-3.5">
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
        <div className="ml-auto flex gap-2.5">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`rounded-[9px] border px-3.5 py-[7px] ${
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
            to="/boq"
            className="flex items-center gap-2 rounded-[9px] border border-forest bg-forest px-4 py-[9px] text-[13px] font-bold text-white no-underline transition-opacity hover:opacity-90"
          >
            <FileSpreadsheet size={16} strokeWidth={1.9} />
            BOQ
          </Link>
        </div>
      </header>

      {/* MAIN ROW */}
      <div className="flex min-h-0 flex-1">
        {/* 3D STAGE */}
        <div
          className="relative min-w-0 flex-1 overflow-hidden"
          style={{ background: 'linear-gradient(#cfe6f1,#dfeede)' }}
        >
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
            camera={{ fov: 45, near: 0.1, far: 1000, position: [26, 15, 24] }}
          >
            <Scene state={state} controllerRef={controller} onSelectZone={selectZone} />
          </Canvas>

          <div className="absolute bottom-4 left-[18px] z-[3] flex items-center gap-2 rounded-[10px] border border-hairline bg-white/[0.86] px-[13px] py-2 text-xs font-medium text-[#5a6b5f] backdrop-blur">
            <RefreshCw size={15} color="#2f6b3f" strokeWidth={1.8} />
            Drag to orbit · Scroll to zoom · Click a tag for details
          </div>
        </div>

        {/* CONTROL PANEL */}
        <aside className="scrl flex w-[336px] flex-none flex-col gap-[18px] overflow-y-auto border-l border-hairline bg-white p-[18px]">
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

          {/* Key Zones */}
          <section>
            <SectionTitle>Key Zones</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {zones.map((z) => {
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
                      className="flex-none rounded-full"
                      style={{ width: 11, height: 11, background: z.color }}
                    />
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
