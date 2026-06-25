import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Box,
  FileSpreadsheet,
  Home,
  MapPin,
  Presentation,
  TrendingUp,
} from 'lucide-react'
import { CONT_RATE, FOOTPRINT_SQM, OH_RATE, VAT_RATE, divisions } from '../boq/data'
import { DEFAULT_INPUTS, SCENARIOS, runScenario } from '../feasibility/model'

const f = (n: number) => Math.round(n).toLocaleString('en-US')

export default function HomePage() {
  const stats = useMemo(() => {
    const base = runScenario(SCENARIOS.find((s) => s.key === 'base')!, DEFAULT_INPUTS)
    const direct = divisions.reduce((s, d) => s + d.items.reduce((a, it) => a + it.qty * it.rate, 0), 0)
    const boqTotal = direct * (1 + OH_RATE + CONT_RATE) * (1 + VAT_RATE)
    return {
      boqTotal,
      perSqm: boqTotal / FOOTPRINT_SQM,
      payback: base.paybackYears ? base.paybackYears.toFixed(1) : '>10',
      irr: ((base.irr ?? 0) * 100).toFixed(1),
    }
  }, [])

  const cards = [
    { to: '/3d', icon: <Box size={26} />, color: '#2f6b3f', th: 'โมเดล 3 มิติ', en: '3D Concept Model', desc: 'หมุน-ซูม-เปิดประตู ดูโครงสร้าง โซน สภาพอากาศ และการขนฟางแบบโต้ตอบ · Orbit, open the walls, explore every zone.' },
    { to: '/boq', icon: <FileSpreadsheet size={26} />, color: '#3f7fae', th: 'ราคาก่อสร้าง (BOQ)', en: 'Bill of Quantities', desc: 'รายการวัสดุ-ค่าแรง 8 หมวด พร้อมวิธีคำนวณทุกบรรทัดและแหล่งอ้างอิง · 8 divisions, every rate sourced.' },
    { to: '/feasibility', icon: <TrendingUp size={26} />, color: '#c8902f', th: 'ความเป็นไปได้ & ROI', en: 'Feasibility & ROI', desc: 'NPV · IRR · ระยะคืนทุน + โหมดจำลองกรอกค่าเองได้ · Live model with an editable Simulation mode.' },
    { to: '/deck', icon: <Presentation size={26} />, color: '#163a22', th: 'สไลด์นำเสนอ', en: 'Pitch Deck', desc: '9 สไลด์ 2 ภาษา ร้อยทุกอย่างเข้าด้วยกัน พร้อมนำเสนอนักลงทุน · 9 bilingual slides, investor-ready.' },
  ]

  const heroStats = [
    { label: 'Footprint', value: '18 × 10 m' },
    { label: 'Capacity', value: '~2,000 ก้อน · ~40 t' },
    { label: 'CapEx (BOQ)', value: `฿${f(stats.boqTotal)}` },
    { label: 'Payback · IRR', value: `~${stats.payback} ปี · ${stats.irr}%` },
  ]

  return (
    <div className="min-h-screen bg-app-bg text-ink">
      {/* hero */}
      <header className="bg-forest-dark px-5 py-12 text-white sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex items-center gap-3">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-forest">
              <Home size={24} color="#fff" strokeWidth={1.8} />
            </div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#9ccfa9]">
              Concept Feasibility Package · 2568 / 2025
            </div>
          </div>
          <h1 className="mt-7 text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[56px] lg:text-[68px]">
            ศูนย์รวบรวม-รับซื้อ<br className="hidden sm:block" /> ขายต่อฟางข้าว
          </h1>
          <p className="mt-4 text-[20px] font-semibold text-[#cfe6d4] sm:text-[26px]">
            Rice Straw Storage &amp; Aggregation Hub
          </p>
          <div className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-[#9ccfa9]">
            <MapPin size={16} /> ฉะเชิงเทรา · Chachoengsao, Thailand
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-[14px] border border-white/15 bg-white/[0.06] px-4 py-3.5">
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#9ccfa9]">{s.label}</div>
                <div className="mt-1 text-[18px] font-extrabold sm:text-[20px]">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* deliverable cards */}
      <main className="mx-auto max-w-[1100px] px-5 py-12 sm:px-10 lg:px-16">
        <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9aa499]">
          4 ส่วนของแพ็กเกจ / The 4 deliverables
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group flex flex-col rounded-[18px] border border-hairline bg-white p-6 no-underline shadow-[0_4px_20px_rgba(20,40,25,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(20,40,25,0.12)] sm:p-7"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] text-white" style={{ background: c.color }}>
                  {c.icon}
                </span>
                <div>
                  <div className="text-[20px] font-extrabold leading-tight text-ink">{c.th}</div>
                  <div className="text-[13px] font-semibold text-muted">{c.en}</div>
                </div>
                <ArrowRight size={20} className="ml-auto text-[#c4bdab] transition-transform group-hover:translate-x-1 group-hover:text-forest" />
              </div>
              <p className="mt-4 text-[14px] leading-[1.55] text-[#54625a]">{c.desc}</p>
            </Link>
          ))}
        </div>

        {/* about */}
        <div className="mt-12 rounded-[18px] border border-hairline bg-white p-6 sm:p-8">
          <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9aa499]">เกี่ยวกับโครงการ / About</div>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3a473f]">
            โกดังเหล็กกึ่งเปิด ยกพื้นกันน้ำท่วม หลังคาจั่วเมทัลชีท ผนังม้วนเปิด-ปิดได้ — สำหรับ
            <b> รับซื้อฟางอัดก้อนจากเกษตรกร เก็บแห้งข้ามฤดู แล้วขายต่อ</b> ให้โรงไฟฟ้าชีวมวล อาหารสัตว์ และเพาะเห็ด
            ที่ฉะเชิงเทรา ศูนย์กลางชีวมวลภาคตะวันออก
            <br />
            <span className="text-[#7c8a80]">An open-sided steel warehouse on a raised slab that buys baled rice straw from farmers, stores it dry across seasons, and resells to biomass plants, livestock feed and mushroom growers — based in Chachoengsao, an eastern biomass corridor.</span>
          </p>
        </div>
      </main>

      <footer className="border-t border-hairline px-5 py-6 text-center text-[12px] text-[#9aa499] sm:px-10">
        Design by <b className="text-forest">Sponlapat / BD</b> · สกุลเงิน บาท (THB) · ฐานราคาปี 2568 / 2025
      </footer>
    </div>
  )
}
