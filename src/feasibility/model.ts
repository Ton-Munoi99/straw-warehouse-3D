import { FOOTPRINT_SQM } from '../boq/data'

// ============================================================================
// Rice Straw Aggregation Hub — Feasibility / Financial Model (input-driven)
// ----------------------------------------------------------------------------
// Business model: we are a straw AGGREGATOR-TRADER based in Chachoengsao.
// We buy baled rice straw from farmers/contractors at/after harvest (cheap,
// abundant), store it dry in the warehouse, and resell year-round to three
// channels. Customers mostly self-pick-up at the hub; nearby customers can get
// delivery for a fee (treated as pass-through, margin-neutral).
//
// Every number is an explicit, editable assumption — the Simulation mode lets
// the user override any of them and recomputes NPV / IRR / payback live.
// All defaults are 2025 (พ.ศ. 2568) market-referenced — see REFERENCES.
// ============================================================================

export const balesPerTonne = (baleKg: number) => 1000 / baleKg

export interface Channel {
  key: string
  th: string
  en: string
  mix: number // share of annual volume (0–1)
  pricePerTonne: number
  note: string
  ref: string // reference id (links to REFERENCES)
}
export interface CostLine {
  key: string
  th: string
  en: string
  perTonne: number
}
export interface CapexLine {
  key: string
  th: string
  en: string
  amount: number
}
export interface OpexLine {
  key: string
  th: string
  en: string
  perYear: number
}

// The complete editable input set for one run of the model.
export interface SimInputs {
  baleKg: number
  throughputT: number // tonnes / year at steady state
  channels: Channel[]
  cogsLines: CostLine[]
  capexLines: CapexLine[]
  buildingKey: string // which capex line is the building (depreciation/salvage)
  workingCapital: number
  opexLines: OpexLine[]
  taxRate: number
  discountRate: number
  years: number
  buildingLifeYrs: number
  equipmentLifeYrs: number
  buildingSalvageFrac: number
  equipmentResidualFrac: number
  rampYear1: number
  rampYear2: number
  // debt financing (bank view) — affects only the levered/equity metrics
  loanFrac: number // share of CapEx funded by the loan (working capital stays equity)
  loanRate: number // annual interest rate
  loanYears: number // total loan term incl. grace
  graceYears: number // interest-only years at the start
}

export const DEFAULT_INPUTS: SimInputs = {
  baleKg: 20, // base case: common small-bale market weight; sources also range ~10-35 kg/bale
  throughputT: 2000,
  channels: [
    { key: 'biomass', th: 'โรงไฟฟ้าชีวมวล', en: 'Biomass power plant', mix: 0.45, pricePerTonne: 1050, note: 'Baseload · ~21 ฿/bale · NPS / 304 corridor', ref: 'R3' },
    { key: 'cattle', th: 'อาหารสัตว์ (โค-กระบือ)', en: 'Cattle / livestock feed', mix: 0.35, pricePerTonne: 1750, note: 'Premium · dry-season scarcity ~35 ฿/bale', ref: 'R1' },
    { key: 'mushroom', th: 'เพาะเห็ด / อื่นๆ', en: 'Mushroom growing / other', mix: 0.2, pricePerTonne: 1650, note: 'Premium · ~33 ฿/bale steady local demand', ref: 'R4' },
  ],
  cogsLines: [
    { key: 'buy', th: 'รับซื้อฟางอัดก้อนจากเกษตรกร', en: 'Buy baled straw from farmers', perTonne: 550 }, // ≈ 11 ฿/bale at 20 kg/bale
    { key: 'inbound', th: 'ค่าขนเข้าโกดัง (รถตัวเอง ~20–30 กม.)', en: 'Inbound transport to hub (own truck ~20–30 km)', perTonne: 90 },
  ],
  capexLines: [
    { key: 'warehouse', th: 'โรงเก็บฟาง 18×10 ม. สูง 9 ม. (ตาม BOQ)', en: 'Storage warehouse 18×10 m, 9 m tall (per BOQ)', amount: 1545237 },
    { key: 'forklift', th: 'รถโฟล์คลิฟต์', en: 'Forklift', amount: 450000 },
    { key: 'truck', th: 'รถบรรทุก 6 ล้อ (มือสอง)', en: '6-wheel truck (used)', amount: 650000 },
    { key: 'misc', th: 'เครื่องชั่ง เครื่องมือ สำนักงาน', en: 'Scales, tools, office setup', amount: 150000 },
    { key: 'softcost', th: 'ค่าออกแบบ ขออนุญาต และเชื่อมไฟฟ้า-ประปา (ไม่อยู่ใน BOQ)', en: 'Design, permits & utility hook-ups (excluded from BOQ)', amount: 180000 },
  ],
  buildingKey: 'warehouse',
  workingCapital: 300000,
  opexLines: [
    { key: 'staff', th: 'เงินเดือน (ผู้จัดการ + แรงงาน)', en: 'Staff (manager + crew)', perYear: 420000 },
    { key: 'fleet', th: 'น้ำมัน + ซ่อมบำรุง (โฟล์คลิฟต์/รถ)', en: 'Fuel & maintenance', perYear: 150000 },
    { key: 'lease', th: 'ค่าเช่าที่ดิน', en: 'Land lease', perYear: 60000 },
    { key: 'utilities', th: 'ไฟฟ้า ประกัน เบ็ดเตล็ด', en: 'Utilities, insurance, misc', perYear: 90000 },
    { key: 'selling', th: 'การขาย & บริหาร', en: 'Selling & admin', perYear: 100000 },
  ],
  taxRate: 0.15,
  discountRate: 0.08,
  years: 10,
  buildingLifeYrs: 20,
  equipmentLifeYrs: 7,
  buildingSalvageFrac: 0.6,
  equipmentResidualFrac: 0.2,
  rampYear1: 0.6,
  rampYear2: 0.8,
  // assumptions, editable in Simulation: ~60% LTV, rate near Thai commercial-bank MLR
  // in 2025 (≈6.5–7%), 7-yr term with 1 interest-only year to cover the ramp-up
  loanFrac: 0.6,
  loanRate: 0.065,
  loanYears: 7,
  graceYears: 1,
}

// ---- physical storage capacity (the 3D bale stack is built from these numbers) ----
// 1.00 × 0.45 × 0.36 m small square bales in two stacks either side of a 3.5 m forklift
// aisle: 14 bales long × 11 rows, at most 14 layers (≈5.1 m) to keep ~1.3 m clear under
// the 6.4 m eave.
export const STORAGE = { cols: 14, rows: 11, maxLayers: 14, layerM: 0.366 }
export const storageBales = () => STORAGE.cols * STORAGE.rows * STORAGE.maxLayers
export const storageCapacityT = (i: SimInputs) => (storageBales() * i.baleKg) / 1000
export const stockTurnsPerYear = (i: SimInputs) => i.throughputT / storageCapacityT(i)

export const cloneInputs = (i: SimInputs): SimInputs =>
  JSON.parse(JSON.stringify(i)) as SimInputs

// ---- derived aggregates ----------------------------------------------------
export const blendedSell = (i: SimInputs) =>
  i.channels.reduce((s, c) => s + c.mix * c.pricePerTonne, 0)
export const cogsPerTonne = (i: SimInputs) =>
  i.cogsLines.reduce((s, l) => s + l.perTonne, 0)
export const totalCapex = (i: SimInputs) =>
  i.capexLines.reduce((s, l) => s + l.amount, 0)
export const buildingCapex = (i: SimInputs) =>
  i.capexLines.find((l) => l.key === i.buildingKey)?.amount ?? 0
export const equipmentCapex = (i: SimInputs) => totalCapex(i) - buildingCapex(i)
export const opexPerYear = (i: SimInputs) =>
  i.opexLines.reduce((s, l) => s + l.perYear, 0)
export const channelMixSum = (i: SimInputs) =>
  i.channels.reduce((s, c) => s + c.mix, 0)

// ---- finance helpers -------------------------------------------------------
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0)
}
export function irr(cashflows: number[]): number | null {
  let lo = -0.9
  let hi = 2
  const f = (r: number) => npv(r, cashflows)
  let flo = f(lo)
  if (flo * f(hi) > 0) return null
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (Math.abs(fm) < 1e-3) return mid
    if (flo * fm < 0) hi = mid
    else {
      lo = mid
      flo = fm
    }
  }
  return (lo + hi) / 2
}

// ---- a single P&L / cash-flow scenario -------------------------------------
export interface ScnCore {
  throughputT: number
  sellPerT: number
  cogsPerT: number
  opex: number
}

export interface YearRow {
  year: number
  ramp: number
  throughput: number
  revenue: number
  cogs: number
  grossProfit: number
  opex: number
  ebitda: number
  depreciation: number
  ebit: number
  tax: number
  netProfit: number
  operatingCashFlow: number
  terminal: number
  netCashFlow: number
  cumulative: number
}

export interface ScenarioResult {
  core: ScnCore
  grossMarginPerT: number
  steadyEbitda: number
  ebitdaMarginPct: number
  initialOutlay: number
  totalCapex: number
  rows: YearRow[]
  cashflows: number[]
  npv: number
  irr: number | null
  paybackYears: number | null
  simpleRoiPct: number
}

export function runScenario(core: ScnCore, i: SimInputs): ScenarioResult {
  const capex = totalCapex(i)
  const wc = i.workingCapital
  const initialOutlay = capex + wc
  const dep =
    buildingCapex(i) / i.buildingLifeYrs + equipmentCapex(i) / i.equipmentLifeYrs
  const gmPerT = core.sellPerT - core.cogsPerT

  const rows: YearRow[] = []
  const cashflows: number[] = [-initialOutlay]
  let cumulative = -initialOutlay

  for (let y = 1; y <= i.years; y++) {
    const ramp = y === 1 ? i.rampYear1 : y === 2 ? i.rampYear2 : 1
    const throughput = core.throughputT * ramp
    const revenue = throughput * core.sellPerT
    const cogs = throughput * core.cogsPerT
    const grossProfit = revenue - cogs
    const ebitda = grossProfit - core.opex
    const ebit = ebitda - dep
    const tax = Math.max(0, ebit) * i.taxRate
    const netProfit = ebit - tax
    const operatingCashFlow = ebitda - tax
    const terminal =
      y === i.years
        ? buildingCapex(i) * i.buildingSalvageFrac +
          equipmentCapex(i) * i.equipmentResidualFrac +
          wc
        : 0
    const netCashFlow = operatingCashFlow + terminal
    cumulative += netCashFlow
    cashflows.push(netCashFlow)
    rows.push({
      year: y, ramp, throughput, revenue, cogs, grossProfit, opex: core.opex,
      ebitda, depreciation: dep, ebit, tax, netProfit, operatingCashFlow,
      terminal, netCashFlow, cumulative,
    })
  }

  let paybackYears: number | null = null
  let prevCum = -initialOutlay
  for (const r of rows) {
    if (r.cumulative >= 0) {
      paybackYears = r.year - 1 + (0 - prevCum) / (r.cumulative - prevCum)
      break
    }
    prevCum = r.cumulative
  }

  const steadyEbitda = gmPerT * core.throughputT - core.opex
  const steadyRevenue = core.throughputT * core.sellPerT
  const avgNetProfit = rows.reduce((s, r) => s + r.netProfit, 0) / rows.length

  return {
    core, grossMarginPerT: gmPerT, steadyEbitda,
    ebitdaMarginPct: steadyRevenue ? (steadyEbitda / steadyRevenue) * 100 : 0,
    initialOutlay, totalCapex: capex, rows, cashflows,
    npv: npv(i.discountRate, cashflows), irr: irr(cashflows), paybackYears,
    simpleRoiPct: (avgNetProfit / capex) * 100,
  }
}

// Run the model straight from the (possibly edited) input set.
export const coreFromInputs = (i: SimInputs): ScnCore => ({
  throughputT: i.throughputT,
  sellPerT: blendedSell(i),
  cogsPerT: cogsPerTonne(i),
  opex: opexPerYear(i),
})
export const runInputs = (i: SimInputs) => runScenario(coreFromInputs(i), i)

// ---- capacity options: what the plan looks like once storage and prices agree ----
// The base case sells 2,000 t/yr through a ~43 t store yet books dry-season premium
// prices. Each option below removes that contradiction one way, so the page can show
// honestly which plans still pay back. Everything is recomputed from the given inputs.
const GATE_PRICE_PER_BALE = 25 // normal warehouse-gate price (MARKET_PRICES, R1) — no dry-season premium
const STORE_MONTHS = 1 // "seasonal" option: hold one month of sales

export interface CapacityOption {
  key: 'base' | 'noPremium' | 'bigger' | 'smaller'
  th: string
  en: string
  throughputT: number
  turns: number
  capex: number
  npv: number
  irr: number | null
}

function bisect(f: (x: number) => boolean, lo: number, hi: number) {
  // largest x in [lo, hi] for which f stays true (f must flip once)
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2
    if (f(mid)) lo = mid
    else hi = mid
  }
  return lo
}

export function capacityOptions(i: SimInputs) {
  const cap = storageCapacityT(i)
  const bpt = balesPerTonne(i.baleKg)
  const option = (key: CapacityOption['key'], th: string, en: string, mut: (n: SimInputs) => void, storeT = cap): CapacityOption => {
    const n = cloneInputs(i)
    mut(n)
    const r = runInputs(n)
    return { key, th, en, throughputT: n.throughputT, turns: n.throughputT / storeT, capex: totalCapex(n), npv: r.npv, irr: r.irr }
  }
  const monthT = (i.throughputT / 12) * STORE_MONTHS
  const scale = Math.max(1, monthT / cap)
  const rows = [
    option('base', 'แผนปัจจุบัน (กรณีฐาน)', 'Current plan (base case)', () => {}),
    option('noPremium', 'ขายผ่านเร็ว แต่ไม่ได้ราคาหน้าแล้ง', 'Fast pass-through, no dry-season premium', (n) => {
      n.channels.forEach((c) => { if (c.key !== 'biomass') c.pricePerTonne = Math.min(c.pricePerTonne, GATE_PRICE_PER_BALE * bpt) })
    }),
    option('bigger', `ขยายโกดังให้เก็บสต๊อกได้ ${STORE_MONTHS} เดือน (×${scale.toFixed(1)})`, `Bigger warehouse — hold ${STORE_MONTHS} month of stock (×${scale.toFixed(1)})`, (n) => {
      n.capexLines.find((l) => l.key === n.buildingKey)!.amount *= scale
    }, cap * scale),
    option('smaller', 'ลดยอดขายให้พอดีโกดัง (หมุนเดือนละรอบ)', 'Sell only what this warehouse holds (monthly turns)', (n) => {
      n.throughputT = Math.round(cap * 12)
    }),
  ]

  // how cheap the extra month of storage must be to keep NPV ≥ 0 (premium prices kept)
  const extraT = Math.max(0, monthT - cap)
  const extraM2 = (extraT / cap) * FOOTPRINT_SQM
  const npvWithExtra = (x: number) => {
    const n = cloneInputs(i)
    n.capexLines.find((l) => l.key === n.buildingKey)!.amount += x
    return runInputs(n).npv
  }
  const maxExtraCapex = npvWithExtra(0) > 0 ? bisect((x) => npvWithExtra(x) > 0, 0, 50e6) : 0
  // throughput needed for NPV ≥ 0 at today's prices and costs
  const npvAt = (t: number) => { const n = cloneInputs(i); n.throughputT = t; return runInputs(n).npv }
  const breakevenT = npvAt(i.throughputT * 10) > 0 ? i.throughputT * 10 - bisect((x) => npvAt(i.throughputT * 10 - x) > 0, 0, i.throughputT * 10) : null

  return {
    capacityT: cap,
    rows,
    extraT,
    extraM2,
    maxExtraCapex,
    maxPerM2: extraM2 > 0 ? maxExtraCapex / extraM2 : null,
    warehousePerM2: buildingCapex(i) / FOOTPRINT_SQM,
    breakevenT,
  }
}

// ---- debt financing (bank view) ---------------------------------------------
// The loan funds `loanFrac` of CapEx. Interest-only during the grace years, then equal
// annual payments (annuity) over the rest of the term. Interest is tax-deductible, so
// tax is recomputed on EBIT − interest. DSCR = CFADS ÷ scheduled debt service, where
// CFADS = EBITDA − cash tax (same simplified cash-flow basis as the project OCF).
export interface DebtRow {
  year: number
  interest: number
  principal: number
  debtService: number
  cfads: number
  dscr: number | null
  balanceEnd: number
  equityCF: number
}
export interface DebtResult {
  loan: number
  equity: number
  payment: number
  rows: DebtRow[]
  equityCashflows: number[]
  equityIrr: number | null
  minDscr: number | null
  avgDscr: number | null
}

export function runDebt(i: SimInputs, r: ScenarioResult): DebtResult {
  const loan = r.totalCapex * i.loanFrac
  const equity = r.initialOutlay - loan
  const k = i.loanRate
  const n = Math.max(1, i.loanYears - i.graceYears)
  const payment = loan === 0 ? 0 : k > 0 ? (loan * k) / (1 - Math.pow(1 + k, -n)) : loan / n
  let bal = loan
  const rows: DebtRow[] = []
  const equityCashflows = [-equity]
  for (const y of r.rows) {
    const interest = bal * k
    const amortizing = y.year > i.graceYears && y.year <= i.loanYears
    const principal = amortizing ? Math.min(bal, payment - interest) : 0
    // a loan that outlives the model horizon is repaid from the exit value
    const balloon = y.year === i.years ? bal - principal : 0
    const debtService = interest + principal
    const tax = Math.max(0, y.ebit - interest) * i.taxRate
    const cfads = y.ebitda - tax
    bal -= principal + balloon
    const equityCF = cfads - debtService - balloon + y.terminal
    rows.push({
      year: y.year, interest, principal, debtService, cfads,
      dscr: debtService > 0 ? cfads / debtService : null,
      balanceEnd: bal, equityCF,
    })
    equityCashflows.push(equityCF)
  }
  const dscrs = rows.map((x) => x.dscr).filter((d): d is number => d != null)
  return {
    loan, equity, payment, rows, equityCashflows,
    equityIrr: irr(equityCashflows),
    minDscr: dscrs.length ? Math.min(...dscrs) : null,
    avgDscr: dscrs.length ? dscrs.reduce((a, b) => a + b, 0) / dscrs.length : null,
  }
}

// ---- scenarios: Conservative/Upside keep fixed sales assumptions; Base tracks
// the active inputs (default, or your Simulation values once edited). All three
// always run with the active CapEx/tax/discount/ramp/years — those are
// investment-level assumptions, not sales-scenario assumptions. ---------------
export interface Scenario extends ScnCore {
  key: 'conservative' | 'base' | 'upside'
  th: string
  en: string
}
export const SCENARIOS: Scenario[] = [
  { key: 'conservative', th: 'ระมัดระวัง', en: 'Conservative', throughputT: 1500, sellPerT: 1320, cogsPerT: 660, opex: 760000 },
  { key: 'base', th: 'ฐาน', en: 'Base', throughputT: 2000, sellPerT: blendedSell(DEFAULT_INPUTS), cogsPerT: cogsPerTonne(DEFAULT_INPUTS), opex: opexPerYear(DEFAULT_INPUTS) },
  { key: 'upside', th: 'เชิงบวก', en: 'Upside', throughputT: 2800, sellPerT: 1500, cogsPerT: 620, opex: 920000 },
]
export const runAll = (i: SimInputs = DEFAULT_INPUTS) =>
  SCENARIOS.map((s) => {
    const core: ScnCore = s.key === 'base' ? coreFromInputs(i) : s
    return { scenario: { ...s, ...core }, result: runScenario(core, i) }
  })

// ---- market price reference (the figures behind the assumptions) -----------
export interface PriceRef {
  th: string
  en: string
  low: number
  high: number
  used: number
  unit: string
  ref: string
}
export const MARKET_PRICES: PriceRef[] = [
  { th: 'รับซื้อฟางอัดก้อนจากเกษตรกร', en: 'Buy baled straw from farmer', low: 5, high: 12, used: 11, unit: '฿/ก้อน (bale)', ref: 'R1' },
  { th: 'ค่าจ้างอัดฟาง (บริการ)', en: 'Baling service charge', low: 13, high: 15, used: 14, unit: '฿/ก้อน (bale)', ref: 'R1' },
  { th: 'ขายหน้าโกดัง (ปกติ · สปอต)', en: 'Warehouse-gate sale (normal · spot)', low: 25, high: 25, used: 25, unit: '฿/ก้อน (bale)', ref: 'R1' },
  { th: 'ช่องทางขาย① โรงไฟฟ้าชีวมวล', en: 'Sell channel① Biomass power plant', low: 18, high: 24, used: 21, unit: '฿/ก้อน (bale)', ref: 'R3' },
  { th: 'ช่องทางขาย② อาหารสัตว์ (โค-กระบือ · พรีเมียมหน้าแล้ง)', en: 'Sell channel② Cattle/livestock feed (dry-season premium)', low: 30, high: 35, used: 35, unit: '฿/ก้อน (bale)', ref: 'R1' },
  { th: 'ช่องทางขาย③ เพาะเห็ด / อื่นๆ (ความต้องการท้องถิ่น)', en: 'Sell channel③ Mushroom growing / other (local demand)', low: 30, high: 35, used: 33, unit: '฿/ก้อน (bale)', ref: 'R4' },
  { th: 'มูลค่าฟางดิบ', en: 'Raw straw value', low: 0.75, high: 1.15, used: 1.0, unit: '฿/กก. (kg)', ref: 'R2' },
  { th: 'ผลผลิตฟางต่อไร่', en: 'Bales per rai', low: 40, high: 60, used: 50, unit: 'ก้อน/ไร่ (bales/rai)', ref: 'R4' },
]

// ---- detailed references ---------------------------------------------------
export interface Reference {
  id: string
  org: string
  th: string
  en: string
  figure: string
  links: { label: string; href: string }[]
}
export const REFERENCES: Reference[] = [
  {
    id: 'R1',
    org: 'รักบ้านเกิด · เทคโนโลยีชาวบ้าน/ข่าวสด',
    th: 'ธุรกิจฟางข้าวอัดก้อน (วังฝั่งแดงฟาร์ม ฯลฯ) — ค่ารับจ้างอัด 13–15 ฿/ก้อน · รับซื้อจากเกษตรกร 5–12 ฿/ก้อน · ขายหน้าโกดัง 25 ฿/ก้อน · หน้าฝน 30–35 ฿/ก้อน · ก้อนละ ~30 กก.',
    en: 'Baling business (multiple farms) — service 13–15 ฿/bale · buy 5–12 ฿/bale · sell 25 ฿ (30–35 ฿ rainy)',
    figure: 'ราคารับซื้อ/ขายต่อก้อน · ค่าอัดฟาง / Buy-sell & baling price per bale',
    links: [
      { label: 'รักบ้านเกิด (อัดฟางก้อน)', href: 'https://www.rakbankerd.com/agriculture/hilight-view.php?id=194' },
      { label: 'ข่าวสด/เทคโนโลยีชาวบ้าน', href: 'https://www.khaosod.co.th/technologychaoban/how-to/process/article_265417' },
    ],
  },
  {
    id: 'R2',
    org: 'Thai Rice Farming Simulator (ผู้จัดทำเดียวกัน) + ราคารับซื้อชีวมวล DEDE',
    th: 'แบบจำลองทำนาข้าวใช้มูลค่าฟาง 0.75–1.15 ฿/กก. — เทียบเคียงได้กับราคาฟางอัดก้อนในตลาด (25–35 ฿/ก้อน ÷ ~30 กก./ก้อน ≈ 0.83–1.17 ฿/กก.) และสอดคล้องกับราคารับซื้อเชื้อเพลิงชีวมวลที่ DEDE รวบรวมจากโรงไฟฟ้า 79 แห่ง',
    en: 'Rice-farming model uses straw value 0.75–1.15 ฿/kg — consistent with the baled-straw market (25–35 ฿/bale ÷ ~30 kg ≈ 0.83–1.17 ฿/kg) and DEDE biomass-fuel purchase prices (79 plants)',
    figure: 'มูลค่าฟางดิบ ฿/กก. / Raw straw value per kg',
    links: [
      { label: 'Simulator', href: 'https://thai-rice-farming-simulator.netlify.app' },
      { label: 'DEDE · ราคารับซื้อเชื้อเพลิงชีวมวล', href: 'https://kc.dede.go.th/knowledge-view.aspx?p=231' },
    ],
  },
  {
    id: 'R3',
    org: 'NPS (National Power Supply) · DEDE — ราคารับซื้อเชื้อเพลิงชีวมวล',
    th: 'โรงไฟฟ้าชีวมวล NPS (นิคม 304 ปราจีนบุรี ติดฉะเชิงเทรา/ภาคตะวันออก) ใช้เศษวัสดุเกษตรรวมถึงฟางข้าวเป็นเชื้อเพลิงตลอดปี · DEDE รวบรวมราคารับซื้อเชื้อเพลิงชีวมวลจากโรงไฟฟ้า 79 แห่ง ปี 2565',
    en: 'NPS biomass plants (304 Industrial Park, Prachinburi — adjacent to Chachoengsao/the east) burn agri-residue incl. rice straw year-round · DEDE compiles biomass-fuel purchase prices from 79 plants (2022)',
    figure: 'ช่องทางระบายฟางชีวมวล (baseload) / Biomass offtake channel',
    links: [
      { label: 'NPS · พลังงานชีวมวล', href: 'https://www.npsplc.com/en/updates/blog/543' },
      { label: 'DEDE · ราคารับซื้อเชื้อเพลิงชีวมวล 2565', href: 'https://kc.dede.go.th/knowledge-view.aspx?p=231' },
    ],
  },
  {
    id: 'R4',
    org: 'สนง.เกษตรฯ (opsmoac) · รักบ้านเกิด',
    th: 'อัดฟางก้อนสร้างรายได้หลังเก็บเกี่ยว — เฉลี่ย 40–60 ก้อน/ไร่ · รายได้ 1,000–1,500 ฿/ไร่ · อัดได้ ~1,000 ก้อน/วัน',
    en: 'Post-harvest baling income — 40–60 bales/rai · 1,000–1,500 ฿/rai · ~1,000 bales/day',
    figure: 'ผลผลิตฟางต่อไร่ · กำลังการผลิต / Bales per rai & daily capacity',
    links: [
      { label: 'opsmoac (สนง.เกษตรฯ)', href: 'https://www.opsmoac.go.th/trat-local_wisdom-files-421191791800' },
      { label: 'รักบ้านเกิด', href: 'https://www.rakbankerd.com/agriculture/hilight-view.php?id=194' },
    ],
  },
  {
    id: 'R5',
    org: 'BOQ-SW-01 (เอกสารชุดนี้)',
    th: 'ราคาก่อสร้างโรงเก็บฟาง 18×10 ม. สูง 9 ม. = ฿1,545,237 (≈ ฿8,585/ตร.ม.) อ้างอิงราคาวัสดุ-ค่าแรง ปี 2568',
    en: 'Warehouse construction cost ฿1,545,237 (≈ ฿8,585/m²), 18×10 m × 9 m tall, 2025 basis',
    figure: 'CapEx โรงเก็บฟาง / Warehouse CapEx',
    links: [{ label: 'เปิดหน้า BOQ', href: '/boq' }],
  },
  {
    id: 'R6',
    org: 'ScienceDirect · WeMove',
    th: 'ค่าโลจิสติกส์ฟางข้าว 18.75–19.89 USD/ตัน (ขนส่งคิดเป็น 54–63%) — Sokhansanj et al., Energy 36 (2011) · ค่ารถ 6 ล้อ 3,000–10,000 ฿/เที่ยว หรือ 30–50 ฿/กม. — WeMove 2568',
    en: 'Rice straw logistics 18.75–19.89 USD/t (transport = 54–63%) — Sokhansanj et al., Energy 36 (2011) · 6-wheel truck 3,000–10,000 ฿/trip or 30–50 ฿/km — WeMove 2025',
    figure: 'ค่าขนส่งฟางเข้าโกดัง / Inbound straw transport cost',
    links: [
      { label: 'ScienceDirect · Logistics cost analysis', href: 'https://www.sciencedirect.com/science/article/abs/pii/S0360544211000272' },
      { label: 'WeMove · ค่าขนส่งรถบรรทุก 2568', href: 'https://wemove.co.th/categories/knowledge-and-law/standard-freight/standard-freight-rates-trucking-thailand-2025-update' },
    ],
  },
]

// ---- location options ------------------------------------------------------
export interface LocationOption {
  province: string
  th: string
  score: number
  pros: string[]
  recommended?: boolean
}
export const LOCATIONS: LocationOption[] = [
  {
    province: 'Chachoengsao', th: 'ฉะเชิงเทรา', score: 5, recommended: true,
    pros: [
      'ศูนย์กลางโรงไฟฟ้าชีวมวล/อุตสาหกรรม (NPS, นิคม 304) — ระบายฟางได้ตลอดปี · Biomass/industrial hub (NPS, 304 Estate) — year-round straw offtake',
      'พื้นที่นาข้าวภาคกลาง-ตะวันออกหนาแน่น วัตถุดิบใกล้ · Dense central-eastern paddy area — feedstock close by',
      'โลจิสติกส์ดี ใกล้ EEC / ท่าเรือ / ตลาดปศุสัตว์ภาคตะวันออก · Good logistics — near EEC / ports / eastern livestock market',
    ],
  },
  {
    province: 'Suphan Buri / Ayutthaya', th: 'สุพรรณบุรี / อยุธยา', score: 4,
    pros: [
      'อู่ข้าวภาคกลาง วัตถุดิบล้นตลาด · Central rice bowl — abundant feedstock',
      'ราคาวัตถุดิบถูก · Cheaper raw material',
      'ไกลโรงไฟฟ้าชีวมวลกว่า — ค่าขนสูงขึ้น · Farther from biomass plants — higher transport',
    ],
  },
  {
    province: 'Nakhon Ratchasima', th: 'นครราชสีมา', score: 4,
    pros: [
      'ตลาดปศุสัตว์ (โค) ใหญ่ที่สุด — ราคาฟางพรีเมียม · Largest cattle market — premium straw price',
      'พื้นที่นากว้าง · Large paddy area',
      'กระจายตัว ระยะขนส่งไกล · Dispersed — long haul distances',
    ],
  },
]
