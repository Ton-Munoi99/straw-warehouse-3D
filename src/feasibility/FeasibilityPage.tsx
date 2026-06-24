import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Calculator,
  FileSpreadsheet,
  MapPin,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Truck,
  Warehouse,
  X,
} from 'lucide-react'
import {
  DEFAULT_INPUTS,
  LOCATIONS,
  MARKET_PRICES,
  REFERENCES,
  SimInputs,
  balesPerTonne,
  blendedSell,
  buildingCapex,
  channelMixSum,
  cloneInputs,
  cogsPerTonne,
  equipmentCapex,
  opexPerYear,
  runAll,
  runInputs,
  totalCapex,
} from './model'

const f = (n: number) => Math.round(n).toLocaleString('en-US')
const fM = (n: number) => `${n < 0 ? '−' : ''}฿${(Math.abs(n) / 1_000_000).toFixed(2)}M`

export default function FeasibilityPage() {
  const [simMode, setSimMode] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showMethod, setShowMethod] = useState(false)
  const [inputs, setInputs] = useState<SimInputs>(() => cloneInputs(DEFAULT_INPUTS))

  const active = simMode ? inputs : DEFAULT_INPUTS
  const result = useMemo(() => runInputs(active), [active])
  const refs = useMemo(() => runAll(), [])
  const bpt = balesPerTonne(active.baleKg)
  const bptDisplay = bpt.toFixed(1)
  const staticCapacityT = (active.baleKg * 2000) / 1000
  const perBale = (perT: number) => (perT / bpt).toFixed(1)

  const sell = blendedSell(active)
  const cogs = cogsPerTonne(active)
  const gm = sell - cogs
  const mixSum = channelMixSum(active)

  // worked-example values for the methodology modal (textbook-style, uses current inputs)
  const bld = buildingCapex(active)
  const eqp = equipmentCapex(active)
  const T = active.throughputT
  const opexY = opexPerYear(active)
  const wkDep = bld / active.buildingLifeYrs + eqp / active.equipmentLifeYrs
  const wkRev = T * sell
  const wkCogs = T * cogs
  const wkGP = gm * T
  const wkEbitda = result.steadyEbitda
  const wkEbit = wkEbitda - wkDep
  const wkTax = Math.max(0, wkEbit) * active.taxRate
  const wkOcf = wkEbitda - wkTax
  const wkTerminal = bld * active.buildingSalvageFrac + eqp * active.equipmentResidualFrac + active.workingCapital
  const taxPct = (active.taxRate * 100).toFixed(0)
  const discPct = (active.discountRate * 100).toFixed(0)

  // editing helpers
  const patch = (fn: (n: SimInputs) => void) =>
    setInputs((prev) => {
      const n = cloneInputs(prev)
      fn(n)
      return n
    })

  return (
    <>
      <style>{`
        .num { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          .wrap { padding: 0 !important; }
        }
      `}</style>

      <div className="wrap min-h-screen bg-app-bg px-5 py-[34px]">
        {/* nav */}
        <div className="no-print fixed right-[26px] top-[22px] z-20 flex flex-wrap justify-end gap-2.5">
          <Link to="/" className="flex items-center gap-2 rounded-[11px] border border-white/30 bg-white px-4 py-[11px] text-[13px] font-bold text-forest no-underline shadow-[0_6px_18px_rgba(20,40,25,0.12)] hover:opacity-90">
            <Box size={16} strokeWidth={1.9} /> 3D
          </Link>
          <Link to="/boq" className="flex items-center gap-2 rounded-[11px] border border-white/30 bg-white px-4 py-[11px] text-[13px] font-bold text-forest no-underline shadow-[0_6px_18px_rgba(20,40,25,0.12)] hover:opacity-90">
            <FileSpreadsheet size={16} strokeWidth={1.9} /> BOQ
          </Link>
          <button onClick={() => setShowMethod(true)} className="flex items-center gap-2 rounded-[11px] border border-[#3f7fae] bg-white px-4 py-[11px] text-[13px] font-bold text-[#3f7fae] shadow-[0_6px_18px_rgba(20,40,25,0.12)] hover:opacity-90">
            <Calculator size={16} strokeWidth={1.9} /> วิธีคำนวณ / Method
          </button>
          {simMode ? (
            <button onClick={() => setSimMode(false)} className="flex items-center gap-2 rounded-[11px] border-none bg-[#c25b46] px-4 py-[11px] text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(20,40,25,0.22)]">
              <X size={16} strokeWidth={1.9} /> ออก / Exit
            </button>
          ) : (
            <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 rounded-[11px] border-none bg-straw px-4 py-[11px] text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(20,40,25,0.22)]">
              <SlidersHorizontal size={16} strokeWidth={1.9} /> Simulation
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-[11px] border-none bg-forest px-[18px] py-[11px] text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(20,40,25,0.22)]">
            <Printer size={16} strokeWidth={1.9} /> Print
          </button>
        </div>

        <div className="sheet mx-auto max-w-[1040px] overflow-hidden rounded-md bg-white shadow-[0_10px_40px_rgba(20,40,25,0.12)]">
          {/* header */}
          <div className="flex items-center gap-[18px] bg-forest-dark px-9 py-[28px] text-white">
            <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[11px] bg-white/[0.14]">
              <TrendingUp size={26} color="#9ccfa9" strokeWidth={1.9} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9ccfa9]">
                Feasibility &amp; ROI · การศึกษาความเป็นไปได้ทางการเงิน
                {simMode && (
                  <span className="rounded-full bg-straw px-2 py-0.5 text-[10px] font-bold tracking-normal text-white">
                    ● โหมดจำลอง / SIMULATION
                  </span>
                )}
              </div>
              <div className="mt-1 text-[23px] font-extrabold tracking-[-0.01em]">
                ศูนย์รวบรวม-รับซื้อ-ขายต่อฟางข้าว (Rice Straw Aggregation Hub)
              </div>
            </div>
            <div className="flex-none text-right">
              <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#9ccfa9]">
                <MapPin size={13} /> ฉะเชิงเทรา / Chachoengsao
              </div>
              <div className="text-[15px] font-bold">2568 / 2025</div>
            </div>
          </div>

          {/* business model strip */}
          <div className="grid grid-cols-3 gap-px border-b border-hairline bg-hairline">
            {[
              { icon: <Truck size={18} />, th: 'รับซื้อฟางจากเกษตรกร', en: 'Buy baled straw from farmers', sub: '~11 ฿/ก้อน · ช่วงเก็บเกี่ยว · ~11 ฿/bale at harvest' },
              { icon: <Warehouse size={18} />, th: 'เก็บแห้งในโกดัง', en: 'Store dry in warehouse', sub: 'ยกระดับ กันฝน · เก็บข้ามฤดู · raised, rain-proof, off-season' },
              { icon: <TrendingUp size={18} />, th: 'ขายต่อ 3 ช่องทาง', en: 'Resell to 3 channels', sub: '25–35 ฿/ก้อน · ลูกค้ามารับเอง · buyers self-pick-up' },
            ].map((s, i) => (
              <div key={i} className="bg-[#fafaf6] px-[18px] py-[14px]">
                <div className="flex items-center gap-2 text-forest">{s.icon}
                  <span className="text-[13px] font-extrabold text-ink">{s.th}</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-muted">{s.en}</div>
                <div className="mt-0.5 text-[11px] text-[#9aa499]">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* hero metrics */}
          <div className="px-9 pt-7">
            <SectionTitle kicker={simMode ? 'ผลจากค่าที่คุณกรอก / Your Live Result' : 'ความเป็นไปได้กรณีฐาน / Base-Case Feasibility'}>
              ตัวเลขชี้วัดความเป็นไปได้ / Key Feasibility Metrics
            </SectionTitle>
            <div className="grid grid-cols-4 gap-3.5">
              <HeroCard color="#c8902f" label="ระยะคืนทุน / Payback" value={result.paybackYears ? `~${result.paybackYears.toFixed(1)}` : '>10'} unit="ปี / years" />
              <HeroCard color="#2f6b3f" label="IRR (10 ปี / yrs)" value={`${((result.irr ?? 0) * 100).toFixed(1)}%`} unit="อัตราผลตอบแทนภายใน / Internal rate of return" />
              <HeroCard color="#3f7fae" label="NPV @ 8%" value={`${result.npv >= 0 ? '+' : ''}${fM(result.npv)}`} unit="มูลค่าปัจจุบันสุทธิ / Net present value" />
              <HeroCard color="#5aa17a" label="EBITDA Margin" value={`${result.ebitdaMarginPct.toFixed(0)}%`} unit={`฿${f(result.steadyEbitda)}/ปี · /yr`} />
            </div>
            <div className="mt-2.5 text-[11px] leading-[1.5] text-[#9aa499]">
              * ปริมาณ / throughput {f(active.throughputT)} ตัน/ปี (t/yr) · เงินลงทุนรวม / total outlay ฿{f(result.totalCapex)} + ทุนหมุนเวียน / WC ฿{f(active.workingCapital)} · คิดลด / discount {(active.discountRate * 100).toFixed(0)}% · ภาษี / tax {(active.taxRate * 100).toFixed(0)}%
              {simMode ? ' — ค่าที่คุณกรอกเอง · your inputs' : ' — กดปุ่ม Simulation เพื่อปรับเอง · click Simulation to edit'}
            </div>
            {!simMode && result.npv < 0 && (
              <div className="mt-3 rounded-[10px] border border-[#e3b15d] bg-[#fff7e8] px-4 py-2.5 text-[11.5px] font-semibold leading-[1.55] text-[#8a651d]">
                ผลลัพธ์ยังไม่คุ้มทุนใน 10 ปี เว้นแต่เพิ่มปริมาณหมุนเวียนหรือกำไรต่อตัน · This case needs higher
                throughput or margin to clear a 10-year return.
              </div>
            )}
            {!simMode && result.npv >= 0 && (
              <div className="mt-3 rounded-[10px] border border-[#bdd7bf] bg-[#f2f8f2] px-4 py-2.5 text-[11.5px] font-semibold leading-[1.55] text-forest">
                ฐานนี้ใช้ 1 ก้อน = 20 กก. สำหรับฟางอัดก้อนสี่เหลี่ยมเล็กในตลาดทั่วไป จึงกลับมาเป็นบวก
                แต่ควรชั่งน้ำหนักจริงหน้าไซต์และเทียบ sensitivity 15-30 กก./ก้อนก่อนลงทุน · This base case uses
                20 kg/bale for common small bales; verify actual bale weight and test 15-30 kg/bale before committing.
              </div>
            )}
          </div>

          {/* simulation control panel */}
          {simMode && (
            <div className="mx-9 mt-6 rounded-[16px] border-2 border-straw bg-[#fdfaf3] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[14px] font-extrabold text-[#a9772a]">
                  <SlidersHorizontal size={18} /> แผงปรับค่าจำลอง / Simulation Controls
                </div>
                <button
                  onClick={() => setInputs(cloneInputs(DEFAULT_INPUTS))}
                  className="flex items-center gap-1.5 rounded-[9px] border border-[#e1ddd0] bg-white px-3 py-2 text-[12px] font-bold text-[#54625a] hover:bg-[#faf7ef]"
                >
                  <RotateCcw size={14} /> คืนค่าเริ่มต้น / Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
                {/* volume & finance */}
                <CtrlGroup title="ปริมาณ & การเงิน / Volume & Finance">
                  <NumField label="ปริมาณ / Throughput" suffix="ตัน/ปี" value={inputs.throughputT} step={50} onChange={(v) => patch((n) => (n.throughputT = v))} />
                  <NumField label="คิดลด / Discount" suffix="%" value={inputs.discountRate * 100} step={0.5} onChange={(v) => patch((n) => (n.discountRate = v / 100))} />
                  <NumField label="ภาษี / Tax" suffix="%" value={inputs.taxRate * 100} step={1} onChange={(v) => patch((n) => (n.taxRate = v / 100))} />
                  <NumField label="ทุนหมุนเวียน / WC" suffix="฿" value={inputs.workingCapital} step={50000} onChange={(v) => patch((n) => (n.workingCapital = v))} />
                </CtrlGroup>

                {/* channels */}
                <CtrlGroup title={`ช่องทางขาย / Channels${Math.abs(mixSum - 1) > 0.001 ? ` ⚠ ${(mixSum * 100).toFixed(0)}%` : ''}`}>
                  {inputs.channels.map((c, i) => (
                    <div key={c.key} className="rounded-[8px] bg-white p-2">
                      <div className="mb-1 text-[11px] font-bold text-ink">{c.th}</div>
                      <div className="flex gap-2">
                        <NumField label="สัดส่วน / Mix" suffix="%" value={c.mix * 100} step={5} small onChange={(v) => patch((n) => (n.channels[i].mix = v / 100))} />
                        <NumField label="ราคา / Price" suffix={`฿/ต ≈${perBale(c.pricePerTonne)}/ก้อน`} value={c.pricePerTonne} step={50} small onChange={(v) => patch((n) => (n.channels[i].pricePerTonne = v))} />
                      </div>
                    </div>
                  ))}
                </CtrlGroup>

                {/* cogs */}
                <CtrlGroup title="ต้นทุนวัตถุดิบ / COGS (฿/ตัน)">
                  {inputs.cogsLines.map((l, i) => (
                    <NumField key={l.key} label={l.th} suffix="฿/ต" value={l.perTonne} step={10} onChange={(v) => patch((n) => (n.cogsLines[i].perTonne = v))} />
                  ))}
                  <div className="mt-1 rounded-[6px] bg-forest px-2.5 py-1.5 text-[11px] font-bold text-white">
                    กำไรขั้นต้น / Gross margin {f(gm)} ฿/ต · {perBale(gm)} ฿/ก้อน
                  </div>
                </CtrlGroup>

                {/* opex */}
                <CtrlGroup title="ค่าดำเนินการ / OpEx (฿/ปี)">
                  {inputs.opexLines.map((l, i) => (
                    <NumField key={l.key} label={l.th} suffix="฿/ปี" value={l.perYear} step={10000} onChange={(v) => patch((n) => (n.opexLines[i].perYear = v))} />
                  ))}
                </CtrlGroup>

                {/* capex spans full width */}
                <div className="col-span-2 lg:col-span-4">
                  <CtrlGroup title="เงินลงทุน / CapEx (฿)">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4">
                      {inputs.capexLines.map((l, i) => (
                        <NumField key={l.key} label={l.th} suffix="฿" value={l.amount} step={50000} onChange={(v) => patch((n) => (n.capexLines[i].amount = v))} />
                      ))}
                    </div>
                  </CtrlGroup>
                </div>
              </div>
              {Math.abs(mixSum - 1) > 0.001 && (
                <div className="mt-3 rounded-[8px] bg-[#fbe9e4] px-3 py-2 text-[11.5px] font-semibold text-[#c25b46]">
                  ⚠ สัดส่วนช่องทางรวม {(mixSum * 100).toFixed(0)}% (ควรเป็น 100%) — ราคาเฉลี่ยจะคำนวณตามสัดส่วนที่กรอก · Channel mix sums to {(mixSum * 100).toFixed(0)}% (should be 100%); blended price uses the entered weights.
                </div>
              )}
            </div>
          )}

          {/* market price reference (the attached data) */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="ราคาอ้างอิงตลาดจริง / Real Market Prices (2568 / 2025)">
              ฐานราคาที่ใช้ในแบบจำลอง / Price Basis
            </SectionTitle>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-[#26342c] text-white">
                  <th className="p-[9px_10px] text-left font-bold">รายการ / Item</th>
                  <th className="num p-[9px_10px] font-bold">ช่วงตลาด / Range</th>
                  <th className="num p-[9px_10px] font-bold">ที่ใช้ / Used</th>
                  <th className="p-[9px_10px] text-center font-bold">อ้างอิง / Ref</th>
                </tr>
              </thead>
              <tbody>
                {MARKET_PRICES.map((p) => (
                  <tr key={p.en} className="border-b border-[#f0ede3]">
                    <td className="p-[8px_10px]">
                      <span className="font-semibold text-ink">{p.th}</span>
                      <span className="ml-1.5 text-[11px] text-[#9aa499]">{p.en}</span>
                    </td>
                    <td className="num p-[8px_10px] text-[#54625a]">{p.low === p.high ? p.low : `${p.low}–${p.high}`} <span className="text-[10px] text-[#9aa499]">{p.unit}</span></td>
                    <td className="num p-[8px_10px] font-bold text-forest">{p.used} <span className="text-[10px] font-normal text-[#9aa499]">{p.unit}</span></td>
                    <td className="p-[8px_10px] text-center"><span className="rounded bg-[#eef3ec] px-1.5 py-0.5 text-[10px] font-bold text-forest">{p.ref}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-[11px] text-[#9aa499]">1 ก้อน = {active.baleKg} กก. → {bptDisplay} ก้อน/ตัน (ถ้าเก็บ ~2,000 ก้อน ≈ {f(staticCapacityT)} ตัน static capacity; throughput {f(active.throughputT)} ตัน/ปี คือการหมุนสต๊อกหลายรอบ) · 1 bale = {active.baleKg} kg → {bptDisplay} bales/tonne</div>
          </div>

          {/* location */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="ทำเลที่ตั้ง / Location Rationale">ทำไมต้องฉะเชิงเทรา / Why Chachoengsao</SectionTitle>
            <div className="flex flex-col gap-2">
              {LOCATIONS.map((loc) => (
                <div key={loc.province} className="flex items-start gap-3 rounded-[12px] border px-4 py-3" style={{ borderColor: loc.recommended ? '#2f6b3f' : '#ece8dc', background: loc.recommended ? '#f3f8f3' : '#fff' }}>
                  <div className="flex-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-extrabold text-ink">{loc.th}</span>
                      {loc.recommended && <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold text-white">แนะนำ / Pick</span>}
                    </div>
                    <div className="text-[11px] font-semibold text-muted">{loc.province}</div>
                    <div className="mt-1 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<span key={i} className={`text-[12px] ${i < loc.score ? 'text-straw' : 'text-[#e4e0d4]'}`}>★</span>))}</div>
                  </div>
                  <ul className="m-0 flex-1 list-disc pl-4 text-[12px] leading-[1.6] text-[#54625a]">{loc.pros.map((p) => (<li key={p}>{p}</li>))}</ul>
                </div>
              ))}
            </div>
          </div>

          {/* revenue model */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="แบบจำลองรายได้ / Revenue Model">ช่องทางการขาย &amp; ราคา / Sales Channels &amp; Pricing</SectionTitle>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-[#26342c] text-white">
                  <th className="p-[9px_10px] text-left font-bold">ช่องทาง / Channel</th>
                  <th className="num p-[9px_10px] font-bold">สัดส่วน / Mix</th>
                  <th className="num p-[9px_10px] font-bold">฿/ก้อน · /bale</th>
                  <th className="num p-[9px_10px] font-bold">฿/ตัน · /tonne</th>
                  <th className="p-[9px_10px] text-left font-bold">หมายเหตุ / Note</th>
                </tr>
              </thead>
              <tbody>
                {active.channels.map((c) => (
                  <tr key={c.key} className="border-b border-[#f0ede3]">
                    <td className="p-[9px_10px]"><div className="font-semibold text-ink">{c.th}</div><div className="text-[11px] text-[#9aa499]">{c.en}</div></td>
                    <td className="num p-[9px_10px] font-bold text-forest">{(c.mix * 100).toFixed(0)}%</td>
                    <td className="num p-[9px_10px] text-[#54625a]">{perBale(c.pricePerTonne)}</td>
                    <td className="num p-[9px_10px] font-bold text-ink">{f(c.pricePerTonne)}</td>
                    <td className="p-[9px_10px] text-[11px] text-[#7c8a80]">
                      {c.note}
                      <span className="ml-1.5 rounded bg-[#eef3ec] px-1.5 py-0.5 text-[10px] font-bold text-forest">{c.ref}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#f6f4ec]">
                  <td className="p-[9px_10px] font-extrabold text-forest">ราคาขายเฉลี่ยถ่วงน้ำหนัก / Blended sell price</td>
                  <td className="num p-[9px_10px] font-bold">{(mixSum * 100).toFixed(0)}%</td>
                  <td className="num p-[9px_10px] font-extrabold text-forest">{perBale(sell)}</td>
                  <td className="num p-[9px_10px] font-extrabold text-forest">{f(sell)}</td>
                  <td className="p-[9px_10px] text-[11px] text-[#7c8a80]">1 ตัน = {bptDisplay} ก้อน · 1 t = {bptDisplay} bales</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 flex flex-col gap-1 text-[11px] leading-[1.5] text-[#7c8a80]">
              <div><b className="text-forest">R3</b> โรงไฟฟ้าชีวมวล ~21 ฿/ก้อน — NPS (นิคม 304 ปราจีน/ตะวันออก) + ราคารับซื้อเชื้อเพลิงชีวมวล DEDE · Biomass plants ~21 ฿/bale — NPS (304 Estate) + DEDE feedstock prices · <a href="https://kc.dede.go.th/knowledge-view.aspx?p=231" target="_blank" rel="noopener noreferrer" className="text-[#3f7fae] underline">🔗 DEDE</a></div>
              <div><b className="text-forest">R1</b> อาหารสัตว์ 30–35 ฿/ก้อน (พรีเมียมหน้าแล้ง) — รักบ้านเกิด/เทคโนโลยีชาวบ้าน · Cattle feed 30–35 ฿/bale (dry-season premium) · <a href="https://www.rakbankerd.com/agriculture/hilight-view.php?id=194" target="_blank" rel="noopener noreferrer" className="text-[#3f7fae] underline">🔗 รักบ้านเกิด</a></div>
              <div><b className="text-forest">R4</b> เพาะเห็ด/ความต้องการท้องถิ่น — สนง.เกษตรฯ · รักบ้านเกิด · Mushroom & local demand · <a href="https://www.opsmoac.go.th/trat-local_wisdom-files-421191791800" target="_blank" rel="noopener noreferrer" className="text-[#3f7fae] underline">🔗 opsmoac</a></div>
            </div>
          </div>

          {/* unit economics */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="เศรษฐศาสตร์ต่อหน่วย / Unit Economics">กำไรขั้นต้นต่อตัน / Gross Margin per Tonne</SectionTitle>
            <div className="flex flex-wrap gap-6">
              <div className="min-w-[300px] flex-1"><Waterfall sell={sell} cogs={cogs} gm={gm} /></div>
              <div className="w-[320px] flex-none rounded-[12px] border border-[#e6e2d6] bg-[#fafaf6] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9aa499]">ต้นทุนวัตถุดิบ / Cost of goods (landed)</div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {active.cogsLines.map((l) => (
                    <div key={l.key} className="flex justify-between text-[12px]"><span className="text-[#54625a]">{l.th}</span><span className="num font-semibold">{f(l.perTonne)} <span className="text-[10px] text-[#9aa499]">/ต</span></span></div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-[#e6e2d6] pt-1.5 text-[12px]"><span className="font-bold text-ink">รวม COGS / Total</span><span className="num font-extrabold text-[#c25b46]">{f(cogs)} <span className="text-[10px] font-normal text-[#9aa499]">/ต</span></span></div>
                </div>
                <div className="mt-3 rounded-[8px] bg-forest px-3 py-2.5 text-white">
                  <div className="flex items-center justify-between"><span className="text-[12px] font-semibold">กำไรขั้นต้น / Gross margin</span><span className="num text-[16px] font-extrabold">฿{f(gm)}<span className="text-[11px] font-normal">/ต</span></span></div>
                  <div className="mt-0.5 text-right text-[11px] text-[#cfe6d4]">≈ {perBale(gm)} ฿/ก้อน · margin {sell ? ((gm / sell) * 100).toFixed(0) : 0}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* capex / opex */}
          <div className="mx-9 mt-7 flex flex-wrap gap-6">
            <div className="min-w-[300px] flex-1">
              <SectionTitle kicker="เงินลงทุน / CapEx">โครงสร้างเงินลงทุน / Investment Structure</SectionTitle>
              <div className="overflow-hidden rounded-[12px] border border-[#e6e2d6]">
                {active.capexLines.map((l) => (
                  <div key={l.key} className="flex items-center justify-between border-b border-[#f0ede3] px-4 py-2.5"><div><div className="text-[12.5px] font-semibold text-ink">{l.th}</div><div className="text-[10.5px] text-[#9aa499]">{l.en}</div></div><span className="num font-bold">฿{f(l.amount)}</span></div>
                ))}
                <div className="flex items-center justify-between border-b border-[#f0ede3] bg-[#f6f4ec] px-4 py-2.5"><span className="text-[12.5px] font-semibold text-[#54625a]">ทุนหมุนเวียน / Working capital</span><span className="num font-bold">฿{f(active.workingCapital)}</span></div>
                <div className="flex items-center justify-between bg-forest px-4 py-3 text-white"><span className="text-[13px] font-extrabold">รวมเงินลงทุน / Total outlay</span><span className="num text-[15px] font-extrabold">฿{f(totalCapex(active) + active.workingCapital)}</span></div>
              </div>
            </div>
            <div className="min-w-[300px] flex-1">
              <SectionTitle kicker="ค่าดำเนินการ / OpEx (ต่อปี · per year)">ต้นทุนดำเนินงานรายปี / Annual Operating Cost</SectionTitle>
              <div className="overflow-hidden rounded-[12px] border border-[#e6e2d6]">
                {active.opexLines.map((l) => (
                  <div key={l.key} className="flex items-center justify-between border-b border-[#f0ede3] px-4 py-2.5"><div><div className="text-[12.5px] font-semibold text-ink">{l.th}</div><div className="text-[10.5px] text-[#9aa499]">{l.en}</div></div><span className="num font-bold">฿{f(l.perYear)}</span></div>
                ))}
                <div className="flex items-center justify-between bg-forest px-4 py-3 text-white"><span className="text-[13px] font-extrabold">รวม OpEx / Total · ปี</span><span className="num text-[15px] font-extrabold">฿{f(opexPerYear(active))}</span></div>
              </div>
            </div>
          </div>

          {/* scenarios (fixed market reference) */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="การวิเคราะห์ฉากทัศน์ (อ้างอิงคงที่) / Reference Scenarios">เปรียบเทียบ 3 กรณี / Conservative · Base · Upside</SectionTitle>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-[#26342c] text-white">
                  <th className="p-[9px_10px] text-left font-bold">ตัวชี้วัด / Metric</th>
                  {refs.map((r) => (<th key={r.scenario.key} className="num p-[9px_10px] font-bold">{r.scenario.th} / {r.scenario.en}</th>))}
                </tr>
              </thead>
              <tbody>
                <ScenRow label="ปริมาณหมุนเวียน / Throughput" unit="ตัน/ปี" vals={refs.map((r) => f(r.scenario.throughputT))} />
                <ScenRow label="กำไรขั้นต้น / Gross margin" unit="฿/ตัน" vals={refs.map((r) => f(r.result.grossMarginPerT))} />
                <ScenRow label="EBITDA (คงที่) / steady" unit="฿/ปี" vals={refs.map((r) => f(r.result.steadyEbitda))} />
                <ScenRow label="EBITDA Margin" unit="%" vals={refs.map((r) => `${r.result.ebitdaMarginPct.toFixed(0)}%`)} />
                <ScenRow label="ระยะคืนทุน / Payback" unit="ปี" highlight vals={refs.map((r) => (r.result.paybackYears ? r.result.paybackYears.toFixed(1) : '>10'))} />
                <ScenRow label="IRR (10 ปี)" unit="%" highlight vals={refs.map((r) => `${((r.result.irr ?? 0) * 100).toFixed(1)}%`)} />
                <ScenRow label="NPV @ 8%" unit="฿" highlight vals={refs.map((r) => fM(r.result.npv))} />
              </tbody>
            </table>
            <div className="mt-2 text-[11px] leading-[1.5] text-[#9aa499]">* กรณีฐานใช้ 20 กก./ก้อน ซึ่งเหมาะกับฟางอัดก้อนสี่เหลี่ยมเล็กทั่วไป แต่ผลตอบแทนยังอ่อนไหวต่อ <b>น้ำหนักก้อนจริง</b>, <b>ปริมาณหมุนเวียน</b>, และ <b>กำไรต่อตัน</b> มาก · base case uses 20 kg/bale for common small bales, but returns remain sensitive to actual bale weight, throughput, and margin.</div>
          </div>

          {/* cash-flow projection */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker={simMode ? 'ประมาณการกระแสเงินสด (ค่าที่คุณกรอก) / Cash Flow (your inputs)' : 'ประมาณการกระแสเงินสด (กรณีฐาน) / Base-Case Cash Flow'}>กระแสเงินสด 10 ปี / 10-Year Projection</SectionTitle>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#26342c] text-white">
                  <th className="num p-[8px_8px] font-bold">ปี / Yr</th>
                  <th className="num p-[8px_8px] font-bold">ตัน / t</th>
                  <th className="num p-[8px_8px] font-bold">รายได้ / Revenue</th>
                  <th className="num p-[8px_8px] font-bold">EBITDA</th>
                  <th className="num p-[8px_8px] font-bold">กระแสเงินสด / Cash flow</th>
                  <th className="num p-[8px_8px] font-bold">สะสม / Cumulative</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#f0ede3]">
                  <td className="num p-[7px_8px] text-[#8a948b]">0</td><td className="num p-[7px_8px] text-[#9aa499]">—</td><td className="num p-[7px_8px] text-[#9aa499]">—</td><td className="num p-[7px_8px] text-[#9aa499]">—</td>
                  <td className="num p-[7px_8px] font-bold text-[#c25b46]">−{f(result.initialOutlay)}</td><td className="num p-[7px_8px] font-bold text-[#c25b46]">−{f(result.initialOutlay)}</td>
                </tr>
                {result.rows.map((r) => (
                  <tr key={r.year} className="border-b border-[#f0ede3]">
                    <td className="num p-[7px_8px] text-[#8a948b]">{r.year}{r.ramp < 1 ? '*' : ''}</td>
                    <td className="num p-[7px_8px] text-[#54625a]">{f(r.throughput)}</td>
                    <td className="num p-[7px_8px] text-[#54625a]">{f(r.revenue)}</td>
                    <td className="num p-[7px_8px] text-[#54625a]">{f(r.ebitda)}</td>
                    <td className="num p-[7px_8px] font-semibold text-ink">{r.terminal > 0 ? `${f(r.netCashFlow)}†` : f(r.netCashFlow)}</td>
                    <td className={`num p-[7px_8px] font-bold ${r.cumulative >= 0 ? 'text-forest' : 'text-[#c25b46]'}`}>{r.cumulative >= 0 ? '+' : '−'}{f(Math.abs(r.cumulative))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-[11px] leading-[1.5] text-[#9aa499]">* ปีที่ 1–2 เดินเครื่องที่ {(active.rampYear1 * 100).toFixed(0)}% / {(active.rampYear2 * 100).toFixed(0)}% ระหว่างสร้างเครือข่ายรับซื้อ · Years 1–2 run at {(active.rampYear1 * 100).toFixed(0)}% / {(active.rampYear2 * 100).toFixed(0)}% while building the supply network. † ปีที่ {active.years} รวมมูลค่าซาก (อาคาร {(active.buildingSalvageFrac * 100).toFixed(0)}% + อุปกรณ์ {(active.equipmentResidualFrac * 100).toFixed(0)}%) + คืนทุนหมุนเวียน · Year {active.years} adds terminal value (building {(active.buildingSalvageFrac * 100).toFixed(0)}% + equipment {(active.equipmentResidualFrac * 100).toFixed(0)}%) + working-capital recovery.</div>
          </div>

          {/* sensitivity */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="การวิเคราะห์ความอ่อนไหว / Sensitivity">ระยะคืนทุน (ปี): ปริมาณ × กำไรต่อตัน / Payback (yrs): Volume × Margin</SectionTitle>
            <SensitivityGrid opex={opexPerYear(active)} outlay={totalCapex(active) + active.workingCapital} />
          </div>

          {/* references */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="แหล่งอ้างอิงโดยละเอียด / Detailed References">ฐานข้อมูลตลาด ปี 2568 / 2025 Market Sources</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {REFERENCES.map((r) => (
                <div key={r.id} className="flex gap-3 rounded-[10px] border border-[#ece8dc] bg-[#fafaf6] px-4 py-3">
                  <span className="flex h-[24px] w-[28px] flex-none items-center justify-center rounded bg-forest text-[12px] font-extrabold text-white">{r.id}</span>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-extrabold text-ink">{r.org}</div>
                    <div className="mt-0.5 text-[11.5px] leading-[1.5] text-[#54625a]">{r.th}</div>
                    <div className="mt-0.5 text-[11px] leading-[1.4] text-[#9aa499]">{r.en}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                      <span className="rounded bg-[#eef3ec] px-2 py-0.5 font-semibold text-forest">ใช้สำหรับ / Used for: {r.figure}</span>
                      {r.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          target={l.href.startsWith('/') ? undefined : '_blank'}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-semibold text-[#3f7fae] underline decoration-[#3f7fae]/40 underline-offset-2 hover:decoration-[#3f7fae]"
                        >
                          🔗 {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10.5px] leading-[1.5] text-[#a7afa4]">* ทุกตัวเลขเป็นการประมาณการเทียบเคียงตลาด ปี พ.ศ. 2568 เพื่อการศึกษาความเป็นไปได้ — ไม่ใช่การรับประกันผลตอบแทน ควรทำสัญญารับซื้อ-ขายจริงและสำรวจราคาในพื้นที่ก่อนตัดสินใจลงทุน · All figures are 2025 market-referenced estimates for feasibility study only — not a guarantee of returns. Secure real offtake contracts and verify local prices before investing.</div>
          </div>

          {/* footer */}
          <div className="mt-7 flex justify-between border-t border-[#f0ede3] px-9 py-3.5 text-[11px] text-[#9aa499]">
            <span>การศึกษาความเป็นไปได้ทางการเงิน · Financial feasibility study · Design by <b className="text-forest">Sponlapat / BD</b></span>
            <span>สกุลเงิน / Currency: บาท (THB) · ปีฐาน / Base year 2568 / 2025</span>
          </div>
        </div>
      </div>

      {/* confirm modal */}
      {showConfirm && (
        <Modal onClose={() => setShowConfirm(false)}>
          <div className="flex items-center gap-2.5 text-[18px] font-extrabold text-ink">
            <SlidersHorizontal size={22} className="text-straw" /> เข้าสู่โหมดจำลอง / Enter Simulation
          </div>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-[#54625a]">
            คุณกำลังจะเปิด <b>โหมดจำลอง</b> — สามารถปรับสมมติฐานทุกตัวได้เอง (ปริมาณ ราคาขาย ต้นทุน เงินลงทุน อัตราคิดลด ภาษี)
            แล้วระบบจะคำนวณ <b>NPV / IRR / ระยะคืนทุน / Sensitivity</b> ใหม่ทันที<br />
            <span className="text-[#9aa499]">You're about to enable Simulation mode — edit any assumption and all metrics recompute live. Defaults are 2025 market-referenced.</span>
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <button onClick={() => setShowConfirm(false)} className="rounded-[10px] border border-[#e1ddd0] bg-white px-5 py-2.5 text-[13px] font-bold text-[#54625a] hover:bg-[#faf7ef]">ยกเลิก / Cancel</button>
            <button onClick={() => { setInputs(cloneInputs(DEFAULT_INPUTS)); setSimMode(true); setShowConfirm(false) }} className="rounded-[10px] border-none bg-forest px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90">✓ อนุมัติ &amp; เริ่ม / Approve &amp; Start</button>
          </div>
        </Modal>
      )}

      {/* methodology modal — textbook-style worked example from current inputs */}
      {showMethod && (
        <Modal onClose={() => setShowMethod(false)} wide>
          <div className="flex items-center gap-2.5 text-[18px] font-extrabold text-ink">
            <Calculator size={22} className="text-[#3f7fae]" /> วิธีการคำนวณ / How It's Calculated
          </div>
          <div className="mt-2 rounded-[8px] bg-[#eef3ec] px-3.5 py-2 text-[11.5px] font-semibold text-forest">
            ตัวอย่างคำนวณจากค่าปัจจุบัน · worked from current inputs — ปริมาณ / throughput {f(T)} ตัน/ปี (t/yr, ปีที่เดินเต็มกำลัง / full-capacity year)
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {[
              {
                th: '① ราคาขายเฉลี่ยถ่วงน้ำหนัก / Blended sell price', formula: 'Σ (สัดส่วน × ราคาช่องทาง) · Σ(mix × channel price)',
                calc: `${active.channels.map((c) => `(${c.mix}×${f(c.pricePerTonne)})`).join(' + ')} = ${active.channels.map((c) => (Math.round(c.mix * c.pricePerTonne * 10) / 10).toString()).join(' + ')} = ${f(sell)} ฿/ตัน (t)`,
              },
              { th: '② รายได้ (เต็มกำลัง) / Revenue', formula: 'ปริมาณ × ราคาขายเฉลี่ย · Volume × blended price', calc: `${f(T)} ตัน (t) × ${f(sell)} = ${f(wkRev)} ฿/ปี (yr)` },
              { th: '③ ต้นทุนวัตถุดิบ / COGS', formula: 'ปริมาณ × ต้นทุนต่อตัน · Volume × cost per tonne', calc: `${f(T)} × ${f(cogs)} = ${f(wkCogs)} ฿/ปี (yr)` },
              { th: '④ กำไรขั้นต้น / Gross profit', formula: '(ราคาขาย − ต้นทุน) × ปริมาณ · (price − cost) × volume', calc: `(${f(sell)} − ${f(cogs)}) × ${f(T)} = ${f(gm)} × ${f(T)} = ${f(wkGP)} ฿/ปี (yr)` },
              { th: '⑤ EBITDA', formula: 'กำไรขั้นต้น − ค่าดำเนินการ · Gross profit − OpEx', calc: `${f(wkGP)} − ${f(opexY)} = ${f(wkEbitda)} ฿/ปี (yr)` },
              { th: '⑥ ค่าเสื่อมราคา / Depreciation', formula: 'อาคาร÷20 + อุปกรณ์÷7 (เส้นตรง) · Building÷20 + Equipment÷7 (straight-line)', calc: `${f(bld)}÷20 + ${f(eqp)}÷7 = ${f(bld / active.buildingLifeYrs)} + ${f(eqp / active.equipmentLifeYrs)} = ${f(wkDep)} ฿/ปี (yr)` },
              { th: '⑦ EBIT & ภาษีจ่ายจริง (จากกำไรหลังค่าเสื่อม) / Cash Tax (on EBIT)', formula: `EBIT = EBITDA − ค่าเสื่อม · ภาษีคิดจาก EBIT ไม่ใช่ EBITDA · Tax = max(0, EBIT) × ${taxPct}%`, calc: `EBIT = ${f(wkEbitda)} − ${f(wkDep)} = ${f(wkEbit)} · ภาษีจ่ายจริง / cash tax = ${f(wkEbit)} × ${taxPct}% = ${f(wkTax)} ฿/ปี (yr)` },
              {
                th: '⑧ กระแสเงินสดจากการดำเนินงาน / Operating cash flow (OCF)', formula: 'EBITDA − ภาษีจ่ายจริง (± Δทุนหมุนเวียน≈0) · EBITDA − cash tax (± ΔWorking Capital ≈ 0)', calc: `${f(wkEbitda)} − ${f(wkTax)} = ${f(wkOcf)} ฿/ปี (yr)`,
                note: 'OCF = EBITDA − ภาษีจ่ายจริง เป็น “วิธีกระแสเงินสดแบบย่อ” โดยสมมติว่าการเปลี่ยนแปลงทุนหมุนเวียน (ลูกหนี้/เจ้าหนี้/สต๊อก) มีไม่มาก — ค่าเสื่อมราคาไม่ใช่เงินสดออก จึงไม่หักจาก OCF แต่ยังถูกใช้ตอนคำนวณภาษีเพราะช่วยลดกำไรทางภาษี (tax shield) · ธุรกิจนี้ซื้อ-ขายเงินสดเป็นหลัก ลูกหนี้/เจ้าหนี้จึงน้อย แต่ถ้าสต๊อกฟางมากในบางช่วงควรพิจารณาผลของสินค้าคงคลังเพิ่ม · เงินลงทุน (CapEx) ไม่หักจาก OCF รายปี แต่เป็นเงินสดออกที่ปีที่ 0 (ดูตารางกระแสเงินสด) · OCF = EBITDA − cash tax is a SIMPLIFIED cash-flow approach (not the textbook indirect method, which starts from Net Income), assuming minimal working-capital movement. Depreciation is a non-cash expense, so it is NOT deducted from OCF — but it IS used in the tax calc because it reduces taxable profit (tax shield). As this is mainly a cash business, receivables/payables changes are limited, though material inventory swings should still be considered. CapEx is not deducted from annual OCF — it is the year-0 cash outflow in the projection (project-level DCF).',
              },
              { th: '⑨ การเดินเครื่องช่วงต้น / Ramp-up', formula: 'ปีที่ 1 = 60% · ปีที่ 2 = 80% · ปีที่ 3+ = 100% · Year 1/2/3+', calc: `ปีที่ / Year 1 ≈ ${f(T * active.rampYear1)} ตัน (t) · ปีที่ / Year 2 ≈ ${f(T * active.rampYear2)} ตัน · ปีที่ / Year 3+ = ${f(T)} ตัน` },
              { th: '⑩ มูลค่าซาก (ปีสุดท้าย) / Terminal value', formula: 'อาคาร×60% + อุปกรณ์×20% + คืนทุนหมุนเวียน · Building×60% + Equipment×20% + WC recovery', calc: `${f(bld)}×0.6 + ${f(eqp)}×0.2 + ${f(active.workingCapital)} = ${f(wkTerminal)} ฿` },
              { th: '⑪ NPV (มูลค่าปัจจุบันสุทธิ / Net present value)', formula: `Σ กระแสเงินสดปีที่ t ÷ (1 + r)ᵗ · Σ CFₜ ÷ (1+r)ᵗ · r = ${discPct}%`, calc: `Σ CFₜ ÷ (1.${discPct.padStart(2, '0')})ᵗ − ${f(result.initialOutlay)} = ${result.npv >= 0 ? '+' : ''}${f(result.npv)} ฿` },
              { th: '⑫ IRR (อัตราผลตอบแทนภายใน / Internal rate of return)', formula: 'อัตราคิดลด r ที่ทำให้ NPV = 0 · discount rate where NPV = 0 (bisection)', calc: `= ${((result.irr ?? 0) * 100).toFixed(1)}%` },
              { th: '⑬ ระยะคืนทุน / Payback', formula: 'ปีแรกที่กระแสเงินสดสะสม ≥ 0 · first year cumulative cash flow ≥ 0 (interpolated)', calc: result.paybackYears ? `= ${result.paybackYears.toFixed(1)} ปี / yrs` : '> 10 ปี / yrs' },
              { th: '⑭ ROI', formula: 'กำไรสุทธิเฉลี่ยต่อปี ÷ เงินลงทุน CapEx · avg annual net profit ÷ CapEx', calc: `≈ ${result.simpleRoiPct.toFixed(1)}% ต่อปี / per year` },
            ].map((s) => (
              <div key={s.th} className="rounded-[8px] bg-[#f6f4ec] px-3.5 py-2.5">
                <div className="text-[12.5px] font-extrabold text-forest">{s.th}</div>
                <div className="mt-1 font-mono text-[11.5px] text-[#7c8a80]">{s.formula}</div>
                <div className="mt-0.5 font-mono text-[12px] font-semibold text-ink">{s.calc}</div>
                {s.note && <div className="mt-1.5 rounded-[6px] bg-[#fbf6e8] px-2.5 py-1.5 text-[11px] leading-[1.5] text-[#8a6d2a]">💡 {s.note}</div>}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] bg-[#eef3ec] px-3.5 py-2.5 text-[11.5px] leading-[1.5] text-[#54625a]">
            ฐานการเงิน / Basis: {active.years} ปี / yrs · คิดลด / discount {discPct}% (WACC ของ SME เกษตรไทย / Thai agri-SME) · ภาษี / tax SME {taxPct}% · ค่าเสื่อม / depreciation: อาคาร / building {active.buildingLifeYrs} ปี / อุปกรณ์ / equipment {active.equipmentLifeYrs} ปี
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setShowMethod(false)} className="rounded-[10px] border-none bg-forest px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90">เข้าใจแล้ว / Got it</button>
          </div>
        </Modal>
      )}
    </>
  )
}

// ---------- sub-components ----------
function SectionTitle({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa499]">{kicker}</div>
      <div className="mt-0.5 text-[15px] font-extrabold text-[#26342c]">{children}</div>
    </div>
  )
}

function HeroCard({ color, label, value, unit }: { color: string; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-[14px] border border-[#e6e2d6] p-4" style={{ background: `${color}0d` }}>
      <div className="text-[11px] font-bold uppercase tracking-[0.04em]" style={{ color }}>{label}</div>
      <div className="mt-1.5 text-[30px] font-extrabold leading-none tracking-[-0.02em] text-ink">{value}</div>
      <div className="mt-1.5 text-[11px] font-medium text-[#7c8a80]">{unit}</div>
    </div>
  )
}

function CtrlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[#a9772a]">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function NumField({ label, suffix, value, onChange, step = 1, small }: { label: string; suffix?: string; value: number; onChange: (v: number) => void; step?: number; small?: boolean }) {
  return (
    <label className="block flex-1">
      <span className="block text-[10.5px] font-semibold leading-tight text-[#54625a]">{label}</span>
      <span className="mt-0.5 flex items-center gap-1 rounded-[7px] border border-[#e1ddd0] bg-white px-2 py-1 focus-within:border-straw">
        <input
          type="number"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`num w-full border-none bg-transparent font-bold text-ink outline-none ${small ? 'text-[12px]' : 'text-[13px]'}`}
        />
        {suffix && <span className="flex-none text-[9.5px] text-[#9aa499]">{suffix}</span>}
      </span>
    </label>
  )
}

function Waterfall({ sell, cogs, gm }: { sell: number; cogs: number; gm: number }) {
  const max = Math.max(sell, 1)
  const bar = (v: number) => `${Math.max(0, (v / max) * 100)}%`
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#e6e2d6] bg-white p-4">
      <WRow label="ราคาขาย / Sell price" value={sell} color="#2f6b3f" width={bar(sell)} />
      <WRow label="− ต้นทุนวัตถุดิบ / − COGS" value={-cogs} color="#c25b46" width={bar(cogs)} />
      <div className="border-t border-dashed border-[#e6e2d6]" />
      <WRow label="= กำไรขั้นต้น / = Gross margin" value={gm} color="#c8902f" width={bar(gm)} bold />
    </div>
  )
}
function WRow({ label, value, color, width, bold }: { label: string; value: number; color: string; width: string; bold?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className={bold ? 'font-extrabold text-ink' : 'font-semibold text-[#54625a]'}>{label}</span>
        <span className="num font-bold" style={{ color }}>{value < 0 ? '−' : ''}฿{f(Math.abs(value))}<span className="text-[10px] font-normal text-[#9aa499]">/ต</span></span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-[5px] bg-[#f0ede3]"><div className="h-full rounded-[5px]" style={{ width, background: color }} /></div>
    </div>
  )
}

function ScenRow({ label, unit, vals, highlight }: { label: string; unit: string; vals: string[]; highlight?: boolean }) {
  return (
    <tr className={`border-b border-[#f0ede3] ${highlight ? 'bg-[#f6f4ec]' : ''}`}>
      <td className="p-[8px_10px]"><span className={`text-[12.5px] ${highlight ? 'font-extrabold text-ink' : 'font-semibold text-[#54625a]'}`}>{label}</span><span className="ml-1.5 text-[10px] text-[#9aa499]">{unit}</span></td>
      {vals.map((v, i) => (<td key={i} className={`num p-[8px_10px] ${highlight ? 'font-extrabold text-forest' : 'font-semibold text-ink'} ${i === 1 ? 'bg-[#eef3ec]' : ''}`}>{v}</td>))}
    </tr>
  )
}

function SensitivityGrid({ opex, outlay }: { opex: number; outlay: number }) {
  const throughputs = [1200, 1600, 2000, 2400, 2800]
  const margins = [600, 700, 800, 900]
  const cell = (t: number, m: number) => {
    const ebitda = m * t - opex
    if (ebitda <= 0) return { txt: '—', bg: '#f7e7e3', fg: '#c25b46' }
    const pb = outlay / ebitda
    let bg = '#e7f1e8', fg = '#2f6b3f'
    if (pb > 8) { bg = '#f7e7e3'; fg = '#c25b46' }
    else if (pb > 5) { bg = '#fbf2e0'; fg = '#a9772a' }
    return { txt: pb.toFixed(1), bg, fg }
  }
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          <th className="p-[8px] text-left text-[11px] font-bold text-[#9aa499]">ปริมาณ ↓ / กำไรต่อตัน → · Volume ↓ / Margin →</th>
          {margins.map((m) => (<th key={m} className="num p-[8px] font-bold text-[#26342c]">฿{m}/ต</th>))}
        </tr>
      </thead>
      <tbody>
        {throughputs.map((t) => (
          <tr key={t}>
            <td className="num p-[8px] font-bold text-[#26342c]">{f(t)} ตัน · t</td>
            {margins.map((m) => { const c = cell(t, m); return (<td key={m} className="num p-[8px] font-extrabold" style={{ background: c.bg, color: c.fg }}>{c.txt}</td>) })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className={`max-h-[88vh] overflow-y-auto rounded-[16px] bg-white p-7 shadow-[0_20px_60px_rgba(20,40,25,0.3)] ${wide ? 'w-[640px]' : 'w-[460px]'}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
