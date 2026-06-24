import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Calculator, Home, Printer, TrendingUp } from 'lucide-react'
import {
  BENCH_MAX,
  BENCH_MIN,
  CONT_RATE,
  FOOTPRINT_SQM,
  META,
  NOTES,
  OH_RATE,
  PALETTE,
  REFERENCES,
  VAT_RATE,
  divisions,
  matFrac,
} from './data'

const f = (n: number) => Math.round(n).toLocaleString('en-US')

function useComputed() {
  return useMemo(() => {
    const subs: Record<string, number> = {}
    let direct = 0
    let matTotal = 0
    let labTotal = 0

    const divs = divisions.map((d, idx) => {
      let sub = 0
      const items = d.items.map((it) => {
        const amount = it.qty * it.rate
        sub += amount
        return { ...it, amount }
      })
      direct += sub
      subs[d.code] = sub
      const mf = matFrac[d.code] ?? 0.6
      matTotal += sub * mf
      labTotal += sub * (1 - mf)
      return { ...d, items, subtotal: sub, color: PALETTE[idx % PALETTE.length] }
    })

    const oh = direct * OH_RATE
    const cont = direct * CONT_RATE
    const beforeVat = direct + oh + cont
    const vat = beforeVat * VAT_RATE
    const total = beforeVat + vat
    const perSqm = total / FOOTPRINT_SQM
    const benchPos = Math.max(0, Math.min(100, ((perSqm - BENCH_MIN) / (BENCH_MAX - BENCH_MIN)) * 100))

    const breakdown = divs.map((d) => {
      const pct = (d.subtotal / direct) * 100
      const enTitle = (d.title.split('/')[1] || d.title).trim()
      return { code: d.code, label: enTitle, amount: d.subtotal, pct, color: d.color }
    })

    const matPct = (matTotal / direct) * 100
    const labPct = (labTotal / direct) * 100

    return {
      divs,
      direct,
      oh,
      cont,
      vat,
      total,
      perSqm,
      benchPos,
      breakdown,
      matTotal,
      labTotal,
      matPct,
      labPct,
    }
  }, [])
}

export default function BOQPage() {
  const c = useComputed()
  const [showMethod, setShowMethod] = useState(false)

  return (
    <>
      {/* print/pdf styles */}
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
        {/* Top action buttons */}
        <div className="no-print fixed right-[26px] top-[22px] z-20 flex gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-[11px] border border-white/30 bg-white px-[16px] py-[11px] text-[13px] font-bold text-forest no-underline shadow-[0_6px_18px_rgba(20,40,25,0.12)] transition-opacity hover:opacity-90"
          >
            <Box size={16} strokeWidth={1.9} />
            3D Model
          </Link>
          <Link
            to="/feasibility"
            className="flex items-center gap-2 rounded-[11px] border border-white/30 bg-white px-[16px] py-[11px] text-[13px] font-bold text-straw no-underline shadow-[0_6px_18px_rgba(20,40,25,0.12)] transition-opacity hover:opacity-90"
          >
            <TrendingUp size={16} strokeWidth={1.9} />
            ROI
          </Link>
          <button
            onClick={() => setShowMethod(true)}
            className="flex items-center gap-2 rounded-[11px] border border-[#3f7fae] bg-white px-[16px] py-[11px] text-[13px] font-bold text-[#3f7fae] shadow-[0_6px_18px_rgba(20,40,25,0.12)] hover:opacity-90"
          >
            <Calculator size={16} strokeWidth={1.9} />
            วิธีคำนวณ / Method
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-[11px] border-none bg-forest px-[18px] py-[11px] text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(20,40,25,0.22)]"
          >
            <Printer size={16} strokeWidth={1.9} />
            Print / Save PDF
          </button>
        </div>

        <div className="sheet mx-auto max-w-[940px] overflow-hidden rounded-md bg-white shadow-[0_10px_40px_rgba(20,40,25,0.12)]">
          {/* Header band */}
          <div className="flex items-center gap-[18px] bg-forest px-9 py-[26px] text-white">
            <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[11px] bg-white/[0.16]">
              <Home size={26} color="#fff" strokeWidth={1.7} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-80">
                Bill of Quantities · บัญชีแสดงปริมาณงานและราคา
              </div>
              <div className="mt-[3px] text-[23px] font-extrabold tracking-[-0.01em]">
                โรงเก็บฟางอัดก้อน (Rice Straw Storage Warehouse)
              </div>
            </div>
            <div className="flex-none text-right">
              <div className="text-[11px] font-semibold opacity-80">เอกสารเลขที่ / Doc No.</div>
              <div className="text-[15px] font-bold">BOQ-SW-01</div>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-4 gap-px border-b border-hairline bg-hairline">
            {META.map((m) => (
              <div key={m.label} className="bg-[#fafaf6] px-[18px] py-[13px]">
                <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#9aa499]">
                  {m.label}
                </div>
                <div className="mt-[3px] text-[13px] font-bold">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="px-7 pt-2">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-[#26342c] text-white">
                  <th className="w-[42px] p-[10px_8px] text-left font-bold">No.</th>
                  <th className="p-[10px_8px] text-left font-bold">รายการ / Description</th>
                  <th className="w-[68px] p-[10px_8px] text-center font-bold">หน่วย / Unit</th>
                  <th className="num w-[74px] p-[10px_8px] font-bold">จำนวน / Qty</th>
                  <th className="num w-[100px] p-[10px_8px] font-bold">ราคา/หน่วย / Rate</th>
                  <th className="num w-[115px] p-[10px_8px] font-bold">รวมเงิน / Amount (฿)</th>
                </tr>
              </thead>
              <tbody>
                {c.divs.map((d) => (
                  <DivisionRows key={d.code} div={d} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary + Notes */}
          <div className="flex flex-wrap gap-6 px-9 pb-[30px] pt-6">
            <div className="min-w-[260px] flex-1">
              <SectionLabel>หมายเหตุ / Notes &amp; Exclusions</SectionLabel>
              <ul className="m-0 list-disc pl-4 text-[11.5px] leading-[1.7] text-[#5a675e]">
                {NOTES.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
            <SummaryCard {...c} />
          </div>

          {/* Cost Analysis */}
          <div className="mx-9 mb-[26px]">
            <div className="mb-3.5 text-sm font-extrabold text-[#26342c]">
              วิเคราะห์ต้นทุน / Cost Analysis
            </div>
            <div className="flex flex-wrap gap-[26px]">
              {/* Cost by Division */}
              <div className="min-w-[320px] flex-1">
                <SectionLabel>สัดส่วนต้นทุนต่อหมวด / Cost by Division</SectionLabel>
                <div className="flex flex-col gap-2">
                  {c.breakdown.map((b) => (
                    <div key={b.code} className="flex items-center gap-2.5">
                      <span
                        className="h-[9px] w-[9px] flex-none rounded-sm"
                        style={{ background: b.color }}
                      />
                      <span className="w-[128px] flex-none truncate text-[11.5px] font-semibold text-[#3a473f]">
                        {b.code} · {b.label}
                      </span>
                      <div className="h-[11px] flex-1 overflow-hidden rounded-[5px] bg-[#f0ede3]">
                        <div
                          className="h-full rounded-[5px]"
                          style={{ width: `${b.pct.toFixed(1)}%`, background: b.color }}
                        />
                      </div>
                      <span className="num w-[42px] flex-none text-[11px] font-bold text-[#54625a]">
                        {b.pct.toFixed(1)}%
                      </span>
                      <span className="num w-[78px] flex-none text-[11.5px] font-bold text-[#26342c]">
                        ฿{f(b.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Material vs Labour */}
              <div className="w-[300px] flex-none">
                <SectionLabel>ค่าวัสดุ vs ค่าแรง / Material vs Labour</SectionLabel>
                <div className="flex h-[34px] overflow-hidden rounded-lg border border-[#e6e2d6]">
                  <div
                    className="flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${c.matPct.toFixed(1)}%`, background: '#2f6b3f' }}
                  >
                    {c.matPct.toFixed(0)}%
                  </div>
                  <div
                    className="flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${c.labPct.toFixed(1)}%`, background: '#c8902f' }}
                  >
                    {c.labPct.toFixed(0)}%
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <LegendRow color="#2f6b3f" label="ค่าวัสดุ / Material" amount={c.matTotal} />
                  <LegendRow color="#c8902f" label="ค่าแรง / Labour" amount={c.labTotal} />
                </div>
                <div className="mt-2.5 text-[10.5px] leading-[1.5] text-[#a7afa4]">
                  * สัดส่วนวัสดุ-แรงงานเป็นค่าประมาณตามลักษณะงานแต่ละหมวด · Material/labour ratios
                  are typical estimates per work type.
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark */}
          <div className="mx-9 mb-[26px] rounded-[14px] border border-[#e6e2d6] bg-[#fafaf6] px-5 py-[18px]">
            <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-1.5">
              <div className="text-sm font-extrabold text-[#26342c]">
                เทียบราคาตลาด / Cost Benchmark
              </div>
              <div className="text-xs text-[#7c8a80]">
                ต้นทุนต่อ ตร.ม. ของโครงการนี้ / This project's cost per m²{' '}
                <span className="font-extrabold text-forest">฿{f(c.perSqm)}/ตร.ม. (m²)</span>
              </div>
            </div>
            <div className="relative mx-1 mt-[18px] h-2.5 rounded-md bg-gradient-to-r from-[#a9d2b3] via-[#e7d27e] to-[#e0a06a]">
              <div
                className="absolute -top-[5px] -translate-x-1/2"
                style={{ left: `${c.benchPos.toFixed(1)}%` }}
              >
                <div className="mx-auto h-5 w-[3px] rounded-sm bg-[#26342c]" />
                <div className="mt-0.5 whitespace-nowrap text-[10px] font-extrabold text-[#26342c]">
                  โครงการนี้ / This project
                </div>
              </div>
            </div>
            <div className="mt-[18px] flex justify-between text-[11px] font-semibold text-[#9aa499]">
              <span>฿{f(BENCH_MIN)}/ตร.ม. (m²)</span>
              <span>
                ช่วงราคาก่อสร้างโกดังโครงสร้างเหล็กในตลาด / Steel warehouse market range (Pebsteel / Easy Warehouse)
                <sup className="text-forest"> R5</sup>
              </span>
              <span>฿{f(BENCH_MAX)}/ตร.ม. (m²)</span>
            </div>
            <div className="mt-3 text-[11.5px] leading-[1.5] text-[#54625a]">
              โครงการนี้อยู่ในช่วง <b>กลาง</b> ของราคาตลาด สมเหตุผลกับอาคารกึ่งปิดที่มี{' '}
              <b>ประตูหน้าและผนังด้านข้างแบบเปิด-ปิดได้</b> เพิ่มการกันฝนและความปลอดภัย
              แต่ยังคงระบายอากาศได้ · This project sits mid-range, reflecting the added front doors
              and openable side walls for rain protection and security while keeping ventilation.
            </div>
          </div>

          {/* References */}
          <div className="mx-9 mb-[26px]">
            <SectionLabel>
              แหล่งอ้างอิงราคา / Price References (ปี พ.ศ. 2568 / 2025)
            </SectionLabel>
            <div className="flex flex-col gap-[7px] text-[11.5px] leading-[1.5] text-[#54625a]">
              {REFERENCES.map((r) => (
                <div key={r.id} className="flex gap-2.5">
                  <span className="w-[26px] flex-none font-extrabold text-forest">{r.id}</span>
                  <span>
                    {r.text} · <span className="text-[#9aa499]">{r.url}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[10.5px] leading-[1.5] text-[#a7afa4]">
              * ราคาทั้งหมดเป็นราคาประมาณการเทียบเคียงจากแหล่งอ้างอิงสาธารณะ ปี พ.ศ. 2568
              ยังไม่ใช่ราคาเสนอจริงจากผู้รับเหมา —
              ควรขอใบเสนอราคา (Quotation) จากผู้รับเหมาในพื้นที่เพื่อยืนยันราคาก่อนดำเนินการ · All
              rates are comparative estimates from public 2025 sources; obtain contractor quotations
              before execution.
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between border-t border-[#f0ede3] px-9 py-3.5 text-[11px] text-[#9aa499]">
            <span>
              จัดทำเพื่อการนำเสนอโครงการและศึกษาความเป็นไปได้ · For project presentation &amp;
              feasibility study
            </span>
            <span>สกุลเงิน: บาท (THB) · อ้างอิงราคาปี พ.ศ. 2568 / Currency: THB · Price ref. year 2025</span>
          </div>
        </div>
      </div>

      {showMethod && <MethodModal c={c} onClose={() => setShowMethod(false)} />}
    </>
  )
}

// ---- methodology modal — how every line & total is calculated ----
function MethodModal({ c, onClose }: { c: ReturnType<typeof useComputed>; onClose: () => void }) {
  const beforeVat = c.direct + c.oh + c.cont
  const rollup: { label: string; calc: string; value: number; strong?: boolean }[] = [
    { label: 'รวมค่างานก่อสร้าง / Direct cost', calc: 'Σ ทุกหมวด A–H (จำนวน × ราคา) · sum of all divisions', value: c.direct, strong: true },
    { label: 'ค่าดำเนินการ & กำไร / OH & Profit', calc: `Direct × ${(OH_RATE * 100).toFixed(0)}% = ${f(c.direct)} × 0.10`, value: c.oh },
    { label: 'เผื่อเหลือเผื่อขาด / Contingency', calc: `Direct × ${(CONT_RATE * 100).toFixed(0)}% = ${f(c.direct)} × 0.05`, value: c.cont },
    { label: 'ก่อน VAT / Before VAT', calc: `${f(c.direct)} + ${f(c.oh)} + ${f(c.cont)}`, value: beforeVat },
    { label: 'ภาษีมูลค่าเพิ่ม / VAT', calc: `Before-VAT × ${(VAT_RATE * 100).toFixed(0)}% = ${f(beforeVat)} × 0.07`, value: c.vat },
    { label: 'รวมทั้งสิ้น / Grand Total', calc: `${f(beforeVat)} + ${f(c.vat)}`, value: c.total, strong: true },
  ]

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div className="max-h-[88vh] w-[760px] overflow-y-auto rounded-[16px] bg-white p-7 shadow-[0_20px_60px_rgba(20,40,25,0.3)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 text-[18px] font-extrabold text-ink">
          <Calculator size={22} className="text-[#3f7fae]" /> วิธีการคำนวณ BOQ / How the BOQ Is Calculated
        </div>
        <div className="mt-2 rounded-[8px] bg-[#eef3ec] px-3.5 py-2 text-[11.5px] font-semibold text-forest">
          ทุกบรรทัด: <b>รวมเงิน = จำนวน × ราคา/หน่วย</b> · every line: <b>Amount = Qty × Unit rate</b> — แต่ละรายการบอก <b>ที่มาของปริมาณ</b> และ <b>ราคามาจากส่วนไหนของแหล่งอ้างอิง</b> (R1–R7)
        </div>

        {/* per-line basis */}
        <div className="mt-4 text-[12.5px] font-extrabold text-[#26342c]">① ที่มาของปริมาณ &amp; ราคา / Quantity &amp; rate basis per line</div>
        <table className="mt-2 w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="bg-[#26342c] text-white">
              <th className="w-[36px] p-[7px_6px] text-left font-bold">No.</th>
              <th className="p-[7px_6px] text-left font-bold">ที่มาของปริมาณ &amp; ราคา / Quantity &amp; rate basis</th>
              <th className="num w-[110px] p-[7px_6px] font-bold">จำนวน × ราคา</th>
              <th className="num w-[80px] p-[7px_6px] font-bold">รวมเงิน</th>
            </tr>
          </thead>
          <tbody>
            {c.divs.map((d) => (
              <DivBasis key={d.code} div={d} />
            ))}
          </tbody>
        </table>

        {/* roll-up */}
        <div className="mt-5 text-[12.5px] font-extrabold text-[#26342c]">② การรวมยอด / Roll-up to Grand Total</div>
        <div className="mt-2 flex flex-col gap-1.5">
          {rollup.map((r) => (
            <div key={r.label} className={`flex flex-col gap-0.5 rounded-[8px] px-3.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 ${r.strong ? 'bg-forest text-white' : 'bg-[#f6f4ec]'}`}>
              <div className="flex-1">
                <span className={`text-[12px] font-bold ${r.strong ? 'text-white' : 'text-forest'}`}>{r.label}</span>
                <span className={`ml-2 font-mono text-[11px] ${r.strong ? 'text-[#cfe6d4]' : 'text-[#7c8a80]'}`}>{r.calc}</span>
              </div>
              <span className={`num font-extrabold ${r.strong ? 'text-[15px] text-white' : 'text-ink'}`}>฿{f(r.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-[8px] bg-[#f6f4ec] px-3.5 py-2">
            <span className="font-mono text-[11.5px] text-[#54625a]">ต้นทุนต่อ ตร.ม. / Cost per m² = Grand Total ÷ {FOOTPRINT_SQM} ตร.ม.</span>
            <span className="num font-extrabold text-forest">฿{f(c.perSqm)}/ตร.ม.</span>
          </div>
        </div>

        {/* exclusions */}
        <div className="mt-5 text-[12.5px] font-extrabold text-[#26342c]">③ ข้อยกเว้น &amp; ไปคิดที่ไหน / Exclusions &amp; where they are costed</div>
        <div className="mt-2 rounded-[8px] bg-[#fbf6e8] px-3.5 py-2.5 text-[11.5px] leading-[1.6] text-[#8a6d2a]">
          BOQ คิดเฉพาะ <b>งานก่อสร้างจริง</b> — ค่าที่ดิน, ค่าออกแบบ/ขออนุญาต, เชื่อมไฟฟ้าแรงสูง-ประปา <b>ไม่อยู่ใน BOQ</b> แต่ถูกนำไปคิดในหน้า <b>Feasibility</b>:
          ที่ดิน = <b>ค่าเช่าใน OpEx</b> (฿60,000/ปี) · ค่าออกแบบ/ขออนุญาต + เชื่อมไฟฟ้า-ประปา = <b>soft-cost ใน CapEx</b> (฿180,000)
          <br />
          <span className="text-[#a08a4a]">A BOQ covers physical works only. Land, design/permit fees and HV/water hook-ups sit in the Feasibility — land as an OpEx lease, the rest as a CapEx soft-cost line.</span>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-[10px] border-none bg-forest px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90">เข้าใจแล้ว / Got it</button>
        </div>
      </div>
    </div>
  )
}

function DivBasis({ div }: { div: ReturnType<typeof useComputed>['divs'][number] }) {
  return (
    <>
      <tr className="bg-[#eef3ec]">
        <td colSpan={4} className="p-[6px_6px] text-[11px] font-extrabold text-forest">
          {div.code} · {div.title}
        </td>
      </tr>
      {div.items.map((it) => (
        <tr key={it.no} className="border-b border-[#f0ede3] align-top">
          <td className="p-[6px_6px] text-[#8a948b]">{it.no}</td>
          <td className="p-[6px_6px] text-[11px] leading-[1.5] text-[#54625a]">
            <div>
              <span className="font-semibold text-[#3a473f]">ปริมาณ:</span> {it.basis || `${it.th} · ${it.en}`}
            </div>
            {it.rateNote && (
              <div className="mt-0.5 text-[10.5px] text-[#7c8a80]">
                <span className="font-semibold text-[#a9772a]">💰 ราคามาจาก:</span> {it.rateNote}
                <span className="ml-1 rounded bg-[#eef3ec] px-1 py-0.5 text-[9px] font-bold text-forest">{it.ref || 'R7'}</span>
              </div>
            )}
          </td>
          <td className="num p-[6px_6px] text-[#54625a]">
            {it.qty.toLocaleString('en-US')} × {f(it.rate)}
          </td>
          <td className="num p-[6px_6px] font-bold text-[#26342c]">{f(it.amount)}</td>
        </tr>
      ))}
    </>
  )
}

// ---- sub-components ----

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-[#9aa499]">
      {children}
    </div>
  )
}

function DivisionRows({
  div,
}: {
  div: ReturnType<typeof useComputed>['divs'][number]
}) {
  return (
    <>
      <tr className="border-t-2 border-forest bg-[#eef3ec]">
        <td className="p-[9px_8px] font-extrabold text-forest">{div.code}</td>
        <td colSpan={5} className="p-[9px_8px] font-extrabold text-forest">
          {div.title}
        </td>
      </tr>
      {div.items.map((it) => (
        <tr key={it.no} className="border-b border-[#f0ede3]">
          <td className="p-2 align-top text-[#8a948b]">{it.no}</td>
          <td className="p-2">
            <div className="font-semibold text-[#26342c]">
              {it.th}
              {it.ref && (
                <sup className="ml-0.5 text-[9px] font-bold text-forest">{it.ref}</sup>
              )}
            </div>
            <div className="mt-px text-[11px] text-[#9aa499]">{it.en}</div>
          </td>
          <td className="p-2 text-center text-[#54625a]">{it.unit}</td>
          <td className="num p-2 text-[#54625a]">{it.qty.toLocaleString('en-US')}</td>
          <td className="num p-2 text-[#54625a]">{f(it.rate)}</td>
          <td className="num p-2 font-bold text-[#26342c]">{f(it.amount)}</td>
        </tr>
      ))}
      <tr className="bg-[#f6f4ec]">
        <td colSpan={5} className="p-2 text-right text-xs font-bold text-[#54625a]">
          รวมหมวด {div.code} / Subtotal
        </td>
        <td className="num p-2 font-extrabold text-forest">{f(div.subtotal)}</td>
      </tr>
    </>
  )
}

function SummaryCard({
  direct,
  oh,
  cont,
  vat,
  total,
  perSqm,
}: {
  direct: number
  oh: number
  cont: number
  vat: number
  total: number
  perSqm: number
}) {
  const rows: [string, number][] = [
    ['รวมค่างานก่อสร้าง / Direct cost', direct],
    ['ค่าดำเนินการ & กำไร / OH & Profit (10%)', oh],
    ['เผื่อเหลือเผื่อขาด / Contingency (5%)', cont],
    ['ภาษีมูลค่าเพิ่ม / VAT (7%)', vat],
  ]
  return (
    <div className="w-[340px] flex-none overflow-hidden rounded-[14px] border border-[#e6e2d6]">
      {rows.map(([label, val]) => (
        <div
          key={label}
          className="flex justify-between border-b border-[#f0ede3] px-4 py-[11px]"
        >
          <span className="text-[13px] font-semibold text-[#54625a]">{label}</span>
          <span className="num font-bold">฿{f(val)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between bg-forest px-4 py-[15px] text-white">
        <span className="text-sm font-extrabold">รวมทั้งสิ้น / Grand Total</span>
        <span className="num text-[17px] font-extrabold">฿{f(total)}</span>
      </div>
      <div className="flex justify-between bg-[#f6f4ec] px-4 py-2.5">
        <span className="text-xs font-semibold text-[#7c8a80]">ต้นทุนต่อ ตร.ม. / Cost per m²</span>
        <span className="num font-bold text-forest">฿{f(perSqm)} /ตร.ม. (m²)</span>
      </div>
    </div>
  )
}

function LegendRow({
  color,
  label,
  amount,
}: {
  color: string
  label: string
  amount: number
}) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="flex items-center gap-2 font-semibold text-[#3a473f]">
        <span className="h-[11px] w-[11px] rounded-[3px]" style={{ background: color }} />
        {label}
      </span>
      <span className="num font-bold">฿{f(amount)}</span>
    </div>
  )
}
