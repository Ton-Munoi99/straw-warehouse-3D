import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Home,
  MapPin,
  Printer,
  TrendingUp,
} from 'lucide-react'
import {
  CONT_RATE,
  FOOTPRINT_SQM,
  OH_RATE,
  VAT_RATE,
  divisions,
} from '../boq/data'
import {
  DEFAULT_INPUTS,
  SCENARIOS,
  Scenario,
  ScenarioResult,
  blendedSell,
  cogsPerTonne,
  runScenario,
  totalCapex,
} from '../feasibility/model'
import { zones } from '../warehouse3d/data'

const f = (n: number) => Math.round(n).toLocaleString('en-US')
const SLIDE_W = 1280
const SLIDE_H = 720

export default function DeckPage() {
  const [idx, setIdx] = useState(0)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)

  // shared numbers (kept consistent with the BOQ & Feasibility models)
  const stats = useMemo(() => {
    const base = runScenario(SCENARIOS.find((s) => s.key === 'base')!, DEFAULT_INPUTS)
    const boqDirect = divisions.reduce(
      (s, d) => s + d.items.reduce((a, it) => a + it.qty * it.rate, 0),
      0,
    )
    const boqTotal = boqDirect * (1 + OH_RATE + CONT_RATE) * (1 + VAT_RATE)
    const divs = divisions.map((d) => ({
      code: d.code,
      en: (d.title.split('/')[1] || d.title).trim(),
      sub: d.items.reduce((a, it) => a + it.qty * it.rate, 0),
    }))
    const maxDiv = Math.max(...divs.map((d) => d.sub))
    const sell = blendedSell(DEFAULT_INPUTS)
    const cogs = cogsPerTonne(DEFAULT_INPUTS)
    const outlay = totalCapex(DEFAULT_INPUTS) + DEFAULT_INPUTS.workingCapital
    return {
      base,
      boqTotal,
      boqDirect,
      perSqm: boqTotal / FOOTPRINT_SQM,
      divs,
      maxDiv,
      sell,
      cogs,
      gm: sell - cogs,
      outlay,
      refs: SCENARIOS.map((s) => ({ s, r: runScenario(s, DEFAULT_INPUTS) })),
    }
  }, [])

  const slides = useMemo(() => buildSlides(stats), [stats])
  const n = slides.length

  useEffect(() => {
    const fit = () => {
      const el = stageRef.current
      if (!el) return
      setScale(Math.min(el.clientWidth / SLIDE_W, el.clientHeight / SLIDE_H))
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (stageRef.current) ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') setIdx((i) => Math.min(n - 1, i + 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx((i) => Math.max(0, i - 1))
      if (e.key === 'Home') setIdx(0)
      if (e.key === 'End') setIdx(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n])

  const prev = () => setIdx((i) => Math.max(0, i - 1))
  const next = () => setIdx((i) => Math.min(n - 1, i + 1))

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0e1a12]">
      {/* top bar */}
      <div className="no-print flex flex-none items-center gap-3 border-b border-white/10 px-4 py-2 text-white">
        <div className="flex items-center gap-2 text-[13px] font-bold">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-forest">
            <Home size={15} color="#fff" strokeWidth={1.9} />
          </span>
          Pitch Deck · ฟางอัดก้อน
        </div>
        <div className="ml-auto flex items-center gap-2">
          <NavBtn to="/" icon={<Home size={14} />} label="Home" />
          <NavBtn to="/3d" icon={<Box size={14} />} label="3D" />
          <NavBtn to="/boq" icon={<FileSpreadsheet size={14} />} label="BOQ" />
          <NavBtn to="/feasibility" icon={<TrendingUp size={14} />} label="ROI" />
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[12px] font-bold hover:bg-white/20">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* stage */}
      <div ref={stageRef} className="relative flex flex-1 items-center justify-center overflow-hidden p-3">
        <div
          style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: 'center' }}
          className="relative overflow-hidden rounded-[6px] shadow-[0_18px_60px_rgba(0,0,0,0.5)]"
        >
          {slides[idx].render()}
        </div>

        {/* arrows */}
        <button onClick={prev} disabled={idx === 0} className="no-print absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 disabled:opacity-25">
          <ChevronLeft size={26} />
        </button>
        <button onClick={next} disabled={idx === n - 1} className="no-print absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 disabled:opacity-25">
          <ChevronRight size={26} />
        </button>
      </div>

      {/* bottom: dots + label */}
      <div className="no-print flex flex-none items-center gap-4 border-t border-white/10 px-5 py-2.5 text-white">
        <div className="text-[12px] font-semibold text-white/70">
          {idx + 1} / {n} · {slides[idx].label}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-straw' : 'w-2 bg-white/25 hover:bg-white/45'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function NavBtn({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white no-underline hover:bg-white/20">
      {icon} {label}
    </Link>
  )
}

// ============================ slides ============================
interface DeckStats {
  base: ScenarioResult
  boqTotal: number
  boqDirect: number
  perSqm: number
  divs: { code: string; en: string; sub: number }[]
  maxDiv: number
  sell: number
  cogs: number
  gm: number
  outlay: number
  refs: { s: Scenario; r: ScenarioResult }[]
}

function buildSlides(st: DeckStats): { label: string; render: () => React.ReactElement }[] {
  const irr = ((st.base.irr ?? 0) * 100).toFixed(1)
  const pay = st.base.paybackYears ? st.base.paybackYears.toFixed(1) : '>10'
  const npvM = `+฿${(st.base.npv / 1e6).toFixed(2)}M`
  return [
    // 1 — TITLE
    {
      label: 'Title',
      render: () => (
        <div className="flex h-full w-full bg-forest-dark text-white">
          <div className="flex flex-1 flex-col justify-center px-[90px]">
            <div className="text-[24px] font-bold uppercase tracking-[0.14em] text-[#9ccfa9]">Concept Feasibility · 2568</div>
            <div className="mt-7 text-[72px] font-extrabold leading-[1.05] tracking-[-0.02em]">
              ศูนย์รวบรวม-รับซื้อ<br />ขายต่อฟางข้าว
            </div>
            <div className="mt-5 text-[30px] font-semibold text-[#cfe6d4]">Rice Straw Aggregation Hub</div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Chip><MapPin size={20} className="-mt-0.5 inline" /> ฉะเชิงเทรา · Chachoengsao</Chip>
              <Chip gold>18 × 10 ม. · สูง 9 ม. · ~40 ตัน</Chip>
              <Chip gold>คืนทุน {pay} ปี · IRR {irr}%</Chip>
            </div>
          </div>
          <div className="flex w-[460px] flex-none items-center justify-center p-[60px]">
            <ImageSlot />
          </div>
        </div>
      ),
    },
    // 2 — PROBLEM & OPPORTUNITY
    {
      label: 'Problem & Opportunity',
      render: () => (
        <ContentSlide kicker="ปัญหา & โอกาส / Problem & Opportunity" title="ฟางข้าวมีค่า แต่สูญเปล่าถ้าไม่มีที่เก็บที่ดี">
          <div className="mt-12 flex flex-1 gap-9">
            <Card title="ปัญหาวันนี้ / Today" tone="red">
              <Bullet bad>ฟางถูก<b>เผาทิ้ง</b>ในนา ก่อ PM2.5 และเสียคุณค่า</Bullet>
              <Bullet bad>กองฟางกลางแจ้ง <b>เปียกฝน ขึ้นรา</b> เสียหาย 15–20%</Bullet>
              <Bullet bad>ขนส่งกระจัดกระจาย ไม่มี<b>จุดรวบรวม</b></Bullet>
            </Card>
            <Card title="โอกาส / Opportunity" tone="green">
              <Bullet>ความต้องการสูง: <b>โรงไฟฟ้าชีวมวล · อาหารสัตว์ · เพาะเห็ด</b></Bullet>
              <Bullet><b>เก็บแห้งข้ามฤดู</b> → ขายช่วงขาดแคลนได้ 30–35 ฿/ก้อน</Bullet>
              <Bullet>ฉะเชิงเทรา = ศูนย์กลางชีวมวล (นิคม 304) ระบายได้ตลอดปี</Bullet>
            </Card>
          </div>
        </ContentSlide>
      ),
    },
    // 3 — THE CONCEPT
    {
      label: 'The Concept',
      render: () => (
        <ContentSlide kicker="แนวคิด / The Concept" title="โกดังเหล็กกึ่งเปิด ยกพื้น กันฝน ระบายอากาศ">
          <div className="mt-10 flex flex-1 gap-9">
            <div className="grid flex-1 grid-cols-2 content-start gap-5">
              <Spec label="ขนาด / Footprint" value="18 × 10 ม. (180 ตร.ม.)" />
              <Spec label="ความสูง / Height" value="ใต้ชายคา 6.4 ม. · สันหลังคา 9.0 ม." />
              <Spec label="หลังคา / Roof" value="เมทัลชีททรงจั่ว + ฉนวน" />
              <Spec label="พื้น / Floor" value="ค.ส.ล. ยกระดับ กันน้ำท่วม" />
              <Spec label="ผนัง / Walls" value="ม้วนเปิด-ปิดได้ ระบายอากาศ" />
              <Spec label="ความจุ / Capacity" value="~2,000 ก้อน · ~40 ตัน" />
            </div>
            <div className="flex w-[420px] flex-none items-center">
              <ImageSlot dark />
            </div>
          </div>
        </ContentSlide>
      ),
    },
    // 4 — FUNCTIONAL ZONES
    {
      label: 'Functional Zones',
      render: () => (
        <ContentSlide kicker="โซนการใช้งาน / Functional Zones" title="ออกแบบครบทุกฟังก์ชันการรวบรวมฟาง">
          <div className="mt-7 grid flex-1 grid-cols-4 content-start gap-4">
            {zones.map((z) => (
              <div key={z.key} className="flex flex-col rounded-[14px] border border-[#e7e2d6] bg-white p-5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 flex-none rounded-full" style={{ background: z.color }} />
                  <div className="text-[18px] font-extrabold leading-tight text-ink">{z.label}</div>
                </div>
                <div className="mt-2 line-clamp-3 text-[14px] leading-[1.4] text-[#54625a]">{z.desc.split('.')[0]}.</div>
              </div>
            ))}
          </div>
        </ContentSlide>
      ),
    },
    // 5 — HOW IT WORKS
    {
      label: 'How It Works',
      render: () => (
        <ContentSlide kicker="โมเดลธุรกิจ / How It Works" title="รับซื้อ → เก็บแห้ง → ขายต่อ 3 ช่องทาง">
          <div className="mt-12 flex flex-1 items-center justify-between gap-3">
            {[
              ['🌾', 'รับซื้อฟางจากเกษตรกร', '~11 ฿/ก้อน · ช่วงเก็บเกี่ยว'],
              ['🚚', 'ขนเข้าโกดัง', 'รวมศูนย์ใกล้นา'],
              ['🏠', 'เก็บแห้งข้ามฤดู', 'ยกพื้น กันฝน'],
              ['💰', 'ขายต่อ 3 ช่องทาง', '25–35 ฿/ก้อน'],
              ['📦', 'ลูกค้ามารับเอง', 'ใกล้ๆ ส่งให้ + ค่าส่ง'],
            ].map(([icon, t, s], i, a) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex w-[200px] flex-col items-center text-center">
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-pale-green text-[40px]">{icon}</div>
                  <div className="mt-4 text-[20px] font-extrabold leading-tight text-ink">{t}</div>
                  <div className="mt-1.5 text-[15px] text-[#54625a]">{s}</div>
                </div>
                {i < a.length - 1 && <div className="text-[30px] font-bold text-straw">→</div>}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[12px] bg-forest px-7 py-4 text-[19px] font-semibold text-white">
            กำไรขั้นต้น ~{f(st.gm)} ฿/ตัน ({(st.gm / blendedSell(DEFAULT_INPUTS) * 100).toFixed(0)}%) — เก็บแห้งคือหัวใจ ทำให้ขายช่วงราคาพีคได้
          </div>
        </ContentSlide>
      ),
    },
    // 6 — CONSTRUCTION COST
    {
      label: 'Construction Cost',
      render: () => (
        <ContentSlide kicker="ต้นทุนก่อสร้าง / Construction Cost (BOQ)" title={`รวมทั้งสิ้น ฿${f(st.boqTotal)} · ฿${f(st.perSqm)}/ตร.ม.`}>
          <div className="mt-9 flex flex-1 gap-10">
            <div className="flex-1">
              <div className="text-[16px] font-bold uppercase tracking-wide text-[#9aa499]">สัดส่วนต้นทุนต่อหมวด / Cost by division</div>
              <div className="mt-4 flex flex-col gap-2.5">
                {st.divs.map((d) => (
                  <div key={d.code} className="flex items-center gap-3">
                    <div className="w-[200px] flex-none truncate text-[15px] font-semibold text-[#3a473f]">{d.code} · {d.en}</div>
                    <div className="h-3.5 flex-1 overflow-hidden rounded bg-[#ece8dc]">
                      <div className="h-full rounded bg-forest" style={{ width: `${(d.sub / st.maxDiv) * 100}%` }} />
                    </div>
                    <div className="w-[96px] flex-none text-right text-[15px] font-bold text-ink">฿{f(d.sub)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex w-[330px] flex-none flex-col justify-center gap-4">
              <BigStat label="ต้นทุนตรง / Direct" value={`฿${f(st.boqDirect)}`} />
              <BigStat label="รวม (+OH +Cont +VAT)" value={`฿${f(st.boqTotal)}`} accent />
              <BigStat label="ต่อ ตร.ม. / per m²" value={`฿${f(st.perSqm)}`} />
              <div className="text-[14px] leading-[1.5] text-[#7c8a80]">อยู่ในช่วงตลาดโกดังเหล็ก 5,500–9,000 ฿/ตร.ม. · within the steel-warehouse market range</div>
            </div>
          </div>
        </ContentSlide>
      ),
    },
    // 7 — FEASIBILITY & ROI
    {
      label: 'Feasibility & ROI',
      render: () => (
        <div className="flex h-full w-full flex-col bg-[#1f4a2c] px-[90px] py-[70px] text-white">
          <div className="text-[24px] font-bold uppercase tracking-[0.1em] text-[#9ccfa9]">ความเป็นไปได้ & ผลตอบแทน / Feasibility & ROI</div>
          <div className="mt-3 text-[54px] font-extrabold tracking-[-0.02em]">คืนทุนสมเหตุผล ความเสี่ยงคุมได้</div>
          <div className="mt-10 grid grid-cols-4 gap-5">
            <RoiCard label="ระยะคืนทุน / Payback" value={`~${pay}`} unit="ปี / years" />
            <RoiCard label="IRR (10 ปี)" value={`${irr}%`} unit="internal rate of return" />
            <RoiCard label="NPV @ 8%" value={npvM} unit="net present value" />
            <RoiCard label="EBITDA" value={`฿${(st.base.steadyEbitda / 1000).toFixed(0)}k`} unit="ต่อปี / per year" />
          </div>
          <div className="mt-9 flex flex-1 gap-8">
            <div className="flex-1 rounded-[16px] bg-white/[0.07] p-7">
              <div className="text-[17px] font-bold text-[#9ccfa9]">เปรียบเทียบ 3 กรณี / Scenarios</div>
              <div className="mt-4 flex flex-col gap-3">
                {st.refs.map(({ s, r }) => (
                  <div key={s.key} className="flex items-center gap-4 text-[18px]">
                    <div className="w-[150px] flex-none font-bold">{s.th} / {s.en}</div>
                    <div className="flex-1 text-[#cfe6d4]">{f(s.throughputT)} ต/ปี</div>
                    <div className="w-[110px] text-right font-extrabold text-[#f0c878]">{r.paybackYears ? `${r.paybackYears.toFixed(1)} ปี` : '>10 ปี'}</div>
                    <div className="w-[90px] text-right font-bold">{((r.irr ?? 0) * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex w-[360px] flex-none flex-col justify-center gap-3 rounded-[16px] bg-white/[0.07] p-7 text-[18px] leading-[1.5]">
              <div className="text-[17px] font-bold text-[#9ccfa9]">สมมติฐานหลัก / Key assumptions</div>
              <Row k="เงินลงทุนรวม / Outlay" v={`฿${(st.outlay / 1e6).toFixed(2)}M`} />
              <Row k="ปริมาณ / Throughput" v="2,000 ต/ปี" />
              <Row k="ราคาขายเฉลี่ย / Sell" v={`฿${f(st.sell)}/ต`} />
              <Row k="กำไรขั้นต้น / Margin" v={`฿${f(st.gm)}/ต`} />
            </div>
          </div>
          <div className="mt-5 text-[15px] text-[#9ccfa9]">* สมมติฐานเทียบเคียงตลาดปี 2568 · ฐาน 20 กก./ก้อน — ควรชั่งน้ำหนักจริงและทำสัญญารับซื้อก่อนลงทุน</div>
        </div>
      ),
    },
    // 8 — BENEFITS
    {
      label: 'Benefits',
      render: () => (
        <ContentSlide kicker="ประโยชน์ / Benefits" title="ทำไมโครงการนี้ถึงน่าลงทุน">
          <div className="mt-10 grid flex-1 grid-cols-5 gap-4">
            {[
              ['🌧️', 'กันฝนมรสุม', 'ฟางแห้งตลอดฤดู'],
              ['📉', 'ลดความเสียหาย', 'จากเดิม 15–20%'],
              ['🚚', 'โหลดรถเร็ว', 'ลานกว้าง ทางลาด'],
              ['⚙️', 'โลจิสติกส์ดี', 'รวมศูนย์เป็นระบบ'],
              ['💰', 'ต้นทุนต่ำ คุ้มค่า', 'สร้างง่าย ทนทาน'],
            ].map(([icon, t, s], i) => (
              <div key={i} className="flex flex-col rounded-[18px] border border-[#e7e2d6] bg-white p-6">
                <div className="text-[44px]">{icon}</div>
                <div className="mt-5 text-[22px] font-extrabold leading-tight text-ink">{t}</div>
                <div className="mt-2 text-[16px] leading-[1.4] text-[#54625a]">{s}</div>
              </div>
            ))}
          </div>
        </ContentSlide>
      ),
    },
    // 9 — NEXT STEPS
    {
      label: 'Next Steps',
      render: () => (
        <div className="flex h-full w-full flex-col justify-center bg-forest-dark px-[100px] text-white">
          <div className="text-[24px] font-bold uppercase tracking-[0.12em] text-[#9ccfa9]">ขั้นต่อไป / Next Steps</div>
          <div className="mt-4 text-[58px] font-extrabold tracking-[-0.02em]">พร้อมต่อยอดสู่การลงทุนจริง</div>
          <div className="mt-12 flex flex-col gap-5">
            {[
              'ขอใบเสนอราคาจริงจากผู้รับเหมาในพื้นที่ (ยืนยัน BOQ) · Get contractor quotes',
              'ทำสัญญารับซื้อกับโรงไฟฟ้าชีวมวล (baseload) + ดีลอาหารสัตว์/เห็ด · Secure offtake contracts',
              'สำรวจ-เช่าที่ดินฉะเชิงเทรา ใกล้แหล่งฟาง + นิคม 304 · Site & land in Chachoengsao',
              'ชั่งน้ำหนักฟางจริง & ทดสอบ sensitivity 15–30 กก./ก้อน · Weigh real bales',
              'จัดหาเงินทุน (ทุน/กู้) แล้วเริ่มก่อสร้าง · Finance & build',
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-5 text-[24px]">
                <span className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-straw text-[22px] font-extrabold text-[#3a2a08]">{i + 1}</span>
                <span className="text-[#e7f1e8]">{s}</span>
              </div>
            ))}
          </div>
          <div className="mt-14 text-[16px] text-[#9ccfa9]">Design by Sponlapat / BD · ฉะเชิงเทรา 2568 / 2025</div>
        </div>
      ),
    },
  ]
}

// ---------- slide building blocks ----------
function ContentSlide({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#f4f1ea] px-[90px] py-[64px] text-ink">
      <div className="text-[22px] font-bold uppercase tracking-[0.1em] text-[#9aa499]">{kicker}</div>
      <div className="mt-3 text-[46px] font-extrabold leading-[1.1] tracking-[-0.02em]">{title}</div>
      {children}
    </div>
  )
}
function Chip({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div className={`rounded-[12px] px-5 py-3 text-[22px] font-bold ${gold ? 'bg-straw text-white' : 'border border-white/25 text-white'}`}>{children}</div>
  )
}
function Card({ title, tone, children }: { title: string; tone: 'red' | 'green'; children: React.ReactNode }) {
  const green = tone === 'green'
  return (
    <div className={`flex flex-1 flex-col rounded-[20px] p-[42px] ${green ? 'bg-[#1f4a2c] text-white' : 'border border-[#e7e2d6] bg-white'}`}>
      <div className={`inline-flex self-start rounded-[20px] px-4 py-2 text-[18px] font-bold ${green ? 'bg-white/15 text-[#c9eccf]' : 'bg-[#fbe9e4] text-[#c25b46]'}`}>{title}</div>
      <div className="mt-8 flex flex-col gap-5">{children}</div>
    </div>
  )
}
function Bullet({ children, bad }: { children: React.ReactNode; bad?: boolean }) {
  return (
    <div className="flex gap-4 text-[24px] leading-[1.4]">
      <span className={`font-extrabold ${bad ? 'text-[#c25b46]' : 'text-straw'}`}>{bad ? '✕' : '✓'}</span>
      <span className={bad ? 'text-[#3a473f]' : 'text-[#e7f1e8]'}>{children}</span>
    </div>
  )
}
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#e7e2d6] bg-white p-6">
      <div className="text-[16px] font-bold uppercase tracking-wide text-[#9aa499]">{label}</div>
      <div className="mt-2 text-[26px] font-extrabold leading-tight text-ink">{value}</div>
    </div>
  )
}
function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-[16px] px-6 py-5 ${accent ? 'bg-forest text-white' : 'border border-[#e7e2d6] bg-white text-ink'}`}>
      <div className={`text-[15px] font-bold uppercase tracking-wide ${accent ? 'text-[#cfe6d4]' : 'text-[#9aa499]'}`}>{label}</div>
      <div className="mt-1 text-[34px] font-extrabold">{value}</div>
    </div>
  )
}
function RoiCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-[18px] bg-straw px-6 py-6 text-center text-[#3a2a08]">
      <div className="text-[17px] font-bold">{label}</div>
      <div className="mt-1.5 text-[52px] font-extrabold leading-none">{value}</div>
      <div className="mt-2 text-[15px] font-semibold opacity-80">{unit}</div>
    </div>
  )
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2">
      <span className="text-[#cfe6d4]">{k}</span>
      <span className="font-extrabold text-[#f0c878]">{v}</span>
    </div>
  )
}
function ImageSlot({ dark }: { dark?: boolean }) {
  return (
    <Link
      to="/3d"
      className={`flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed no-underline ${
        dark ? 'border-[#cdbf9a] bg-[#efe9da] text-[#7c8a80]' : 'border-white/30 bg-white/[0.06] text-[#9ccfa9]'
      }`}
    >
      <Box size={56} strokeWidth={1.4} />
      <div className="text-[20px] font-bold">โมเดล 3 มิติ / 3D model</div>
      <div className="text-[15px]">คลิกเพื่อเปิดแบบโต้ตอบ · click to open →</div>
    </Link>
  )
}
