import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Coins,
  FileSpreadsheet,
  MapPin,
  Printer,
  TrendingUp,
  Truck,
  Warehouse,
} from 'lucide-react'
import {
  BALES_PER_TONNE,
  BALE_KG,
  CAPEX_LINES,
  CHANNELS,
  COGS_LINES,
  LOCATIONS,
  OPEX_LINES,
  PARAMS,
  SCENARIOS,
  WORKING_CAPITAL,
  blendedSellPerTonne,
  cogsPerTonne,
  opexPerYear,
  runAll,
  runScenario,
  totalCapex,
} from './model'

const f = (n: number) => Math.round(n).toLocaleString('en-US')
const fM = (n: number) => `฿${(n / 1_000_000).toFixed(2)}M`
const perBale = (perT: number) => (perT / BALES_PER_TONNE).toFixed(1)

export default function FeasibilityPage() {
  const results = useMemo(() => runAll(), [])
  const base = useMemo(() => runScenario(SCENARIOS.find((s) => s.key === 'base')!), [])
  const blendedSell = blendedSellPerTonne()
  const cogs = cogsPerTonne()
  const gm = blendedSell - cogs

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
        <div className="no-print fixed right-[26px] top-[22px] z-20 flex gap-2.5">
          <Link to="/" className="flex items-center gap-2 rounded-[11px] border border-white/30 bg-white px-4 py-[11px] text-[13px] font-bold text-forest no-underline shadow-[0_6px_18px_rgba(20,40,25,0.12)] hover:opacity-90">
            <Box size={16} strokeWidth={1.9} /> 3D Model
          </Link>
          <Link to="/boq" className="flex items-center gap-2 rounded-[11px] border border-white/30 bg-white px-4 py-[11px] text-[13px] font-bold text-forest no-underline shadow-[0_6px_18px_rgba(20,40,25,0.12)] hover:opacity-90">
            <FileSpreadsheet size={16} strokeWidth={1.9} /> BOQ
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-[11px] border-none bg-forest px-[18px] py-[11px] text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(20,40,25,0.22)]">
            <Printer size={16} strokeWidth={1.9} /> Print / Save PDF
          </button>
        </div>

        <div className="sheet mx-auto max-w-[1040px] overflow-hidden rounded-md bg-white shadow-[0_10px_40px_rgba(20,40,25,0.12)]">
          {/* header */}
          <div className="flex items-center gap-[18px] bg-forest-dark px-9 py-[28px] text-white">
            <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[11px] bg-white/[0.14]">
              <TrendingUp size={26} color="#9ccfa9" strokeWidth={1.9} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ccfa9]">
                Feasibility &amp; ROI · การศึกษาความเป็นไปได้ทางการเงิน
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
              { icon: <Truck size={18} />, th: 'รับซื้อฟางจากเกษตรกร', en: 'Buy baled straw from farmers', sub: '~11 ฿/ก้อน · ช่วงเก็บเกี่ยว' },
              { icon: <Warehouse size={18} />, th: 'เก็บแห้งในโกดัง', en: 'Store dry in warehouse', sub: 'ยกระดับ กันฝน · เก็บข้ามฤดู' },
              { icon: <Coins size={18} />, th: 'ขายต่อ 3 ช่องทาง', en: 'Resell to 3 channels', sub: '25–35 ฿/ก้อน · ลูกค้ามารับเอง' },
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

          {/* hero metrics (Base case) */}
          <div className="px-9 pt-7">
            <SectionTitle kicker="ผลตอบแทนกรณีฐาน / Base-Case Returns">
              ตัวเลขชี้วัดความเป็นไปได้ / Key Feasibility Metrics
            </SectionTitle>
            <div className="grid grid-cols-4 gap-3.5">
              <HeroCard color="#c8902f" label="ระยะคืนทุน / Payback" value={`~${base.paybackYears?.toFixed(1)}`} unit="ปี / years" />
              <HeroCard color="#2f6b3f" label="IRR (10 ปี)" value={`${((base.irr ?? 0) * 100).toFixed(1)}%`} unit="อัตราผลตอบแทนภายใน" />
              <HeroCard color="#3f7fae" label="NPV @ 8%" value={`+${fM(base.npv)}`} unit="มูลค่าปัจจุบันสุทธิ" />
              <HeroCard color="#5aa17a" label="EBITDA Margin" value={`${base.ebitdaMarginPct.toFixed(0)}%`} unit={`฿${f(base.steadyEbitda)}/ปี`} />
            </div>
            <div className="mt-2.5 text-[11px] leading-[1.5] text-[#9aa499]">
              * กรณีฐาน: ปริมาณหมุนเวียน {f(base.scenario.throughputT)} ตัน/ปี · เงินลงทุนรวม ฿{f(base.totalCapex)} + ทุนหมุนเวียน ฿{f(WORKING_CAPITAL)} · คิดลด {(PARAMS.discountRate * 100).toFixed(0)}% · ภาษี {(PARAMS.taxRate * 100).toFixed(0)}% — ปรับได้ตามจริง · adjust to actuals.
            </div>
          </div>

          {/* location */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="ทำเลที่ตั้ง / Location Rationale">
              ทำไมต้องฉะเชิงเทรา / Why Chachoengsao
            </SectionTitle>
            <div className="flex flex-col gap-2">
              {LOCATIONS.map((loc) => (
                <div
                  key={loc.province}
                  className="flex items-start gap-3 rounded-[12px] border px-4 py-3"
                  style={{
                    borderColor: loc.recommended ? '#2f6b3f' : '#ece8dc',
                    background: loc.recommended ? '#f3f8f3' : '#fff',
                  }}
                >
                  <div className="flex-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-extrabold text-ink">{loc.th}</span>
                      {loc.recommended && (
                        <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold text-white">
                          แนะนำ / Pick
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-muted">{loc.province}</div>
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-[12px] ${i < loc.score ? 'text-straw' : 'text-[#e4e0d4]'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <ul className="m-0 flex-1 list-disc pl-4 text-[12px] leading-[1.6] text-[#54625a]">
                    {loc.pros.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* revenue model */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="แบบจำลองรายได้ / Revenue Model">
              ช่องทางการขาย &amp; ราคา / Sales Channels &amp; Pricing
            </SectionTitle>
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
                {CHANNELS.map((c) => (
                  <tr key={c.key} className="border-b border-[#f0ede3]">
                    <td className="p-[9px_10px]">
                      <div className="font-semibold text-ink">{c.th}</div>
                      <div className="text-[11px] text-[#9aa499]">{c.en}</div>
                    </td>
                    <td className="num p-[9px_10px] font-bold text-forest">{(c.mix * 100).toFixed(0)}%</td>
                    <td className="num p-[9px_10px] text-[#54625a]">{perBale(c.pricePerTonne)}</td>
                    <td className="num p-[9px_10px] font-bold text-ink">{f(c.pricePerTonne)}</td>
                    <td className="p-[9px_10px] text-[11px] text-[#7c8a80]">{c.note}</td>
                  </tr>
                ))}
                <tr className="bg-[#f6f4ec]">
                  <td className="p-[9px_10px] font-extrabold text-forest">ราคาขายเฉลี่ยถ่วงน้ำหนัก / Blended sell price</td>
                  <td className="num p-[9px_10px] font-bold">100%</td>
                  <td className="num p-[9px_10px] font-extrabold text-forest">{perBale(blendedSell)}</td>
                  <td className="num p-[9px_10px] font-extrabold text-forest">{f(blendedSell)}</td>
                  <td className="p-[9px_10px] text-[11px] text-[#7c8a80]">1 ตัน = {BALES_PER_TONNE} ก้อน ({BALE_KG} กก./ก้อน)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* unit economics waterfall */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="เศรษฐศาสตร์ต่อหน่วย / Unit Economics">
              กำไรขั้นต้นต่อตัน / Gross Margin per Tonne
            </SectionTitle>
            <div className="flex flex-wrap gap-6">
              <div className="min-w-[300px] flex-1">
                <Waterfall sell={blendedSell} cogs={cogs} gm={gm} />
              </div>
              <div className="w-[320px] flex-none rounded-[12px] border border-[#e6e2d6] bg-[#fafaf6] p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9aa499]">
                  ต้นทุนวัตถุดิบ / Cost of goods (landed)
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {COGS_LINES.map((l) => (
                    <div key={l.key} className="flex justify-between text-[12px]">
                      <span className="text-[#54625a]">{l.th}</span>
                      <span className="num font-semibold">{f(l.perTonne)} <span className="text-[10px] text-[#9aa499]">/ต</span></span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-[#e6e2d6] pt-1.5 text-[12px]">
                    <span className="font-bold text-ink">รวม COGS / Total</span>
                    <span className="num font-extrabold text-[#c25b46]">{f(cogs)} <span className="text-[10px] font-normal text-[#9aa499]">/ต</span></span>
                  </div>
                </div>
                <div className="mt-3 rounded-[8px] bg-forest px-3 py-2.5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold">กำไรขั้นต้น / Gross margin</span>
                    <span className="num text-[16px] font-extrabold">฿{f(gm)}<span className="text-[11px] font-normal">/ต</span></span>
                  </div>
                  <div className="mt-0.5 text-right text-[11px] text-[#cfe6d4]">≈ {perBale(gm)} ฿/ก้อน · margin {((gm / blendedSell) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* cost model: CapEx + OpEx */}
          <div className="mx-9 mt-7 flex flex-wrap gap-6">
            <div className="min-w-[300px] flex-1">
              <SectionTitle kicker="เงินลงทุน / CapEx">โครงสร้างเงินลงทุน</SectionTitle>
              <div className="overflow-hidden rounded-[12px] border border-[#e6e2d6]">
                {CAPEX_LINES.map((l) => (
                  <div key={l.key} className="flex items-center justify-between border-b border-[#f0ede3] px-4 py-2.5">
                    <div>
                      <div className="text-[12.5px] font-semibold text-ink">{l.th}</div>
                      <div className="text-[10.5px] text-[#9aa499]">{l.en}</div>
                    </div>
                    <span className="num font-bold">฿{f(l.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-b border-[#f0ede3] bg-[#f6f4ec] px-4 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#54625a]">ทุนหมุนเวียน / Working capital</span>
                  <span className="num font-bold">฿{f(WORKING_CAPITAL)}</span>
                </div>
                <div className="flex items-center justify-between bg-forest px-4 py-3 text-white">
                  <span className="text-[13px] font-extrabold">รวมเงินลงทุน / Total outlay</span>
                  <span className="num text-[15px] font-extrabold">฿{f(totalCapex() + WORKING_CAPITAL)}</span>
                </div>
              </div>
            </div>
            <div className="min-w-[300px] flex-1">
              <SectionTitle kicker="ค่าดำเนินการ / OpEx (ต่อปี)">ต้นทุนดำเนินงานรายปี</SectionTitle>
              <div className="overflow-hidden rounded-[12px] border border-[#e6e2d6]">
                {OPEX_LINES.map((l) => (
                  <div key={l.key} className="flex items-center justify-between border-b border-[#f0ede3] px-4 py-2.5">
                    <div>
                      <div className="text-[12.5px] font-semibold text-ink">{l.th}</div>
                      <div className="text-[10.5px] text-[#9aa499]">{l.en}</div>
                    </div>
                    <span className="num font-bold">฿{f(l.perYear)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-forest px-4 py-3 text-white">
                  <span className="text-[13px] font-extrabold">รวม OpEx / Total · ปี</span>
                  <span className="num text-[15px] font-extrabold">฿{f(opexPerYear())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* scenarios */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="การวิเคราะห์ฉากทัศน์ / Scenario Analysis">
              เปรียบเทียบ 3 กรณี / Conservative · Base · Upside
            </SectionTitle>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-[#26342c] text-white">
                  <th className="p-[9px_10px] text-left font-bold">ตัวชี้วัด / Metric</th>
                  {results.map((r) => (
                    <th key={r.scenario.key} className="num p-[9px_10px] font-bold">
                      {r.scenario.th} / {r.scenario.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ScenRow label="ปริมาณหมุนเวียน / Throughput" unit="ตัน/ปี" vals={results.map((r) => f(r.scenario.throughputT))} />
                <ScenRow label="กำไรขั้นต้น / Gross margin" unit="฿/ตัน" vals={results.map((r) => f(r.grossMarginPerT))} />
                <ScenRow label="EBITDA (คงที่) / steady" unit="฿/ปี" vals={results.map((r) => f(r.steadyEbitda))} />
                <ScenRow label="EBITDA Margin" unit="%" vals={results.map((r) => `${r.ebitdaMarginPct.toFixed(0)}%`)} />
                <ScenRow label="ระยะคืนทุน / Payback" unit="ปี" highlight vals={results.map((r) => (r.paybackYears ? r.paybackYears.toFixed(1) : '>10'))} />
                <ScenRow label="IRR (10 ปี)" unit="%" highlight vals={results.map((r) => `${((r.irr ?? 0) * 100).toFixed(1)}%`)} />
                <ScenRow label="NPV @ 8%" unit="฿" highlight vals={results.map((r) => `${r.npv >= 0 ? '+' : ''}${fM(r.npv)}`)} />
              </tbody>
            </table>
            <div className="mt-2 text-[11px] leading-[1.5] text-[#9aa499]">
              * กรณีระมัดระวังโครงการแทบไม่คุ้ม — ผลตอบแทนอ่อนไหวต่อ <b>ปริมาณ</b> และ <b>กำไรต่อตัน</b> มาก จุดคุ้มทุนอยู่ที่ ~1,500–1,600 ตัน/ปี · The project is highly sensitive to volume &amp; margin; break-even is around 1,500–1,600 t/yr.
            </div>
          </div>

          {/* cash-flow projection (base) */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="ประมาณการกระแสเงินสด (กรณีฐาน) / Base-Case Cash Flow">
              กระแสเงินสด 10 ปี / 10-Year Projection
            </SectionTitle>
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
                  <td className="num p-[7px_8px] text-[#8a948b]">0</td>
                  <td className="num p-[7px_8px] text-[#9aa499]">—</td>
                  <td className="num p-[7px_8px] text-[#9aa499]">—</td>
                  <td className="num p-[7px_8px] text-[#9aa499]">—</td>
                  <td className="num p-[7px_8px] font-bold text-[#c25b46]">−{f(base.initialOutlay)}</td>
                  <td className="num p-[7px_8px] font-bold text-[#c25b46]">−{f(base.initialOutlay)}</td>
                </tr>
                {base.rows.map((r) => (
                  <tr key={r.year} className="border-b border-[#f0ede3]">
                    <td className="num p-[7px_8px] text-[#8a948b]">{r.year}{r.ramp < 1 ? '*' : ''}</td>
                    <td className="num p-[7px_8px] text-[#54625a]">{f(r.throughput)}</td>
                    <td className="num p-[7px_8px] text-[#54625a]">{f(r.revenue)}</td>
                    <td className="num p-[7px_8px] text-[#54625a]">{f(r.ebitda)}</td>
                    <td className="num p-[7px_8px] font-semibold text-ink">{r.terminal > 0 ? `${f(r.netCashFlow)}†` : f(r.netCashFlow)}</td>
                    <td className={`num p-[7px_8px] font-bold ${r.cumulative >= 0 ? 'text-forest' : 'text-[#c25b46]'}`}>
                      {r.cumulative >= 0 ? '+' : '−'}{f(Math.abs(r.cumulative))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-[11px] leading-[1.5] text-[#9aa499]">
              * ปีที่ 1–2 เดินเครื่องที่ {(PARAMS.rampYear1 * 100).toFixed(0)}% / {(PARAMS.rampYear2 * 100).toFixed(0)}% ระหว่างสร้างเครือข่ายรับซื้อ · ramp-up while building supply network. † ปีที่ 10 รวมมูลค่าซาก (อาคาร {(PARAMS.buildingSalvageFrac * 100).toFixed(0)}% + อุปกรณ์ {(PARAMS.equipmentResidualFrac * 100).toFixed(0)}%) + คืนทุนหมุนเวียน · terminal value + working-capital recovery.
            </div>
          </div>

          {/* sensitivity */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="การวิเคราะห์ความอ่อนไหว / Sensitivity">
              ระยะคืนทุน (ปี): ปริมาณ × กำไรต่อตัน / Payback (yrs): Volume × Margin
            </SectionTitle>
            <SensitivityGrid />
          </div>

          {/* assumptions & sources */}
          <div className="mx-9 mt-7">
            <SectionTitle kicker="สมมติฐาน &amp; แหล่งอ้างอิง / Assumptions &amp; Sources">
              ฐานข้อมูลตลาด ปี 2568 / 2025 Market Basis
            </SectionTitle>
            <div className="flex flex-col gap-1.5 text-[11.5px] leading-[1.5] text-[#54625a]">
              {[
                ['ก้อน / Bale', `${BALE_KG} กก./ก้อน → ${BALES_PER_TONNE} ก้อน/ตัน (สอดคล้องกับโมเดล 3 มิติ ~1,500 ก้อน ≈ 30 ตัน)`],
                ['รับซื้อ / Buy-in', 'ฟางอัดก้อนจากเกษตรกร 5–12 ฿/ก้อน (ใช้ 11 ฿) · baling service 13–15 ฿/ก้อน'],
                ['ขายต่อ / Resell', 'หน้าโกดัง 25 ฿/ก้อน · หน้าฝน/ขาดแคลน 30–35 ฿/ก้อน — โรงไฟฟ้าชีวมวล ~21 ฿/ก้อน (ตัน)'],
                ['ผลผลิตฟาง / Straw yield', '~40–60 ก้อน/ไร่ · รายได้อัดฟาง 1,000–1,500 ฿/ไร่'],
                ['ทำเล / Location', 'ฉะเชิงเทรา = ศูนย์กลางโรงไฟฟ้าชีวมวล (NPS / นิคม 304) + อู่ข้าวภาคกลาง-ตะวันออก'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2.5">
                  <span className="w-[110px] flex-none font-bold text-forest">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-1 text-[11px] leading-[1.5] text-[#7c8a80]">
              <div><b className="text-forest">R1</b> เทคโนโลยีชาวบ้าน / ข่าวสด · ธุรกิจฟางข้าวอัดก้อน — ต้นทุน/ราคา/กำไรต่อก้อน · khaosod.co.th/technologychaoban</div>
              <div><b className="text-forest">R2</b> Thai Rice Farming Simulator (ของผู้จัดทำ) · ราคาฟาง 0.75–1.15 ฿/กก. · thai-rice-farming-simulator.netlify.app</div>
              <div><b className="text-forest">R3</b> NPS (National Power Supply) / Ratch Pathana Energy · ศูนย์รับซื้อชีวมวล ภาคตะวันออก · npsplc.com · ratchpathana.com</div>
              <div><b className="text-forest">R4</b> opsmoac.go.th / rakbankerd.com · อัดฟางก้อนสร้างรายได้หลังเก็บเกี่ยว (40–60 ก้อน/ไร่)</div>
            </div>
            <div className="mt-3 text-[10.5px] leading-[1.5] text-[#a7afa4]">
              * ทุกตัวเลขเป็นการประมาณการเทียบเคียงตลาด ปี พ.ศ. 2568 เพื่อการศึกษาความเป็นไปได้ — ไม่ใช่การรับประกันผลตอบแทน ควรทำสัญญารับซื้อ-ขายจริงและสำรวจราคาในพื้นที่ก่อนตัดสินใจลงทุน · All figures are 2025 market-referenced estimates for feasibility study only — not a guarantee of returns. Secure real offtake contracts and verify local prices before investing.
            </div>
          </div>

          {/* footer */}
          <div className="mt-7 flex justify-between border-t border-[#f0ede3] px-9 py-3.5 text-[11px] text-[#9aa499]">
            <span>การศึกษาความเป็นไปได้ทางการเงิน · Financial feasibility study · Design by <b className="text-forest">Sponlapat / BD</b></span>
            <span>สกุลเงิน: บาท (THB) · ปีฐาน พ.ศ. 2568 / 2025</span>
          </div>
        </div>
      </div>
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

function Waterfall({ sell, cogs, gm }: { sell: number; cogs: number; gm: number }) {
  const max = sell
  const bar = (v: number) => `${(v / max) * 100}%`
  return (
    <div className="flex flex-col gap-3 rounded-[12px] border border-[#e6e2d6] bg-white p-4">
      <Row label="ราคาขาย / Sell price" value={sell} color="#2f6b3f" width={bar(sell)} />
      <Row label="− ต้นทุนวัตถุดิบ / − COGS" value={-cogs} color="#c25b46" width={bar(cogs)} />
      <div className="border-t border-dashed border-[#e6e2d6]" />
      <Row label="= กำไรขั้นต้น / = Gross margin" value={gm} color="#c8902f" width={bar(gm)} bold />
    </div>
  )
}
function Row({ label, value, color, width, bold }: { label: string; value: number; color: string; width: string; bold?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className={bold ? 'font-extrabold text-ink' : 'font-semibold text-[#54625a]'}>{label}</span>
        <span className="num font-bold" style={{ color }}>{value < 0 ? '−' : ''}฿{f(Math.abs(value))}<span className="text-[10px] font-normal text-[#9aa499]">/ต</span></span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-[5px] bg-[#f0ede3]">
        <div className="h-full rounded-[5px]" style={{ width, background: color }} />
      </div>
    </div>
  )
}

function ScenRow({ label, unit, vals, highlight }: { label: string; unit: string; vals: string[]; highlight?: boolean }) {
  return (
    <tr className={`border-b border-[#f0ede3] ${highlight ? 'bg-[#f6f4ec]' : ''}`}>
      <td className="p-[8px_10px]">
        <span className={`text-[12.5px] ${highlight ? 'font-extrabold text-ink' : 'font-semibold text-[#54625a]'}`}>{label}</span>
        <span className="ml-1.5 text-[10px] text-[#9aa499]">{unit}</span>
      </td>
      {vals.map((v, i) => (
        <td key={i} className={`num p-[8px_10px] ${highlight ? 'font-extrabold text-forest' : 'font-semibold text-ink'} ${i === 1 ? 'bg-[#eef3ec]' : ''}`}>{v}</td>
      ))}
    </tr>
  )
}

function SensitivityGrid() {
  const throughputs = [1200, 1600, 2000, 2400, 2800]
  const margins = [600, 700, 800, 900]
  const capex = totalCapex() + WORKING_CAPITAL
  // simple payback ≈ initial outlay / steady operating cash flow (EBITDA, base opex)
  const opex = opexPerYear()
  const cell = (t: number, m: number) => {
    const ebitda = m * t - opex
    if (ebitda <= 0) return { txt: '—', bg: '#f7e7e3', fg: '#c25b46' }
    const pb = capex / ebitda
    let bg = '#e7f1e8', fg = '#2f6b3f'
    if (pb > 8) { bg = '#f7e7e3'; fg = '#c25b46' }
    else if (pb > 5) { bg = '#fbf2e0'; fg = '#a9772a' }
    return { txt: pb.toFixed(1), bg, fg }
  }
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          <th className="p-[8px] text-left text-[11px] font-bold text-[#9aa499]">ปริมาณ ↓ / กำไรต่อตัน →</th>
          {margins.map((m) => (
            <th key={m} className="num p-[8px] font-bold text-[#26342c]">฿{m}/ต</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {throughputs.map((t) => (
          <tr key={t}>
            <td className="num p-[8px] font-bold text-[#26342c]">{f(t)} ตัน</td>
            {margins.map((m) => {
              const c = cell(t, m)
              return (
                <td key={m} className="num p-[8px] font-extrabold" style={{ background: c.bg, color: c.fg }}>
                  {c.txt}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
