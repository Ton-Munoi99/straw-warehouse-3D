// ============================================================================
// Rice Straw Aggregation Hub — Feasibility / Financial Model
// ----------------------------------------------------------------------------
// Business model: we are a straw AGGREGATOR-TRADER based in Chachoengsao.
// We buy baled rice straw from farmers/contractors at/after harvest (cheap,
// abundant), store it dry in the warehouse, and resell year-round to three
// channels. Customers mostly self-pick-up at the hub; nearby customers can get
// delivery for a fee (treated as pass-through, margin-neutral).
//
// All figures are 2025 (พ.ศ. 2568) market-referenced estimates — see SOURCES.
// Every number below is an explicit, editable assumption.
// ============================================================================

export const BALE_KG = 20 // kg per rectangular bale (1,500 bales ≈ 30 t — matches the 3D model)
export const BALES_PER_TONNE = 1000 / BALE_KG // = 50

// ---- Sales channels (resale prices, market-referenced) ---------------------
export interface Channel {
  key: string
  th: string
  en: string
  mix: number // share of annual volume (0–1)
  pricePerTonne: number // blended resale price ฿/tonne
  note: string
}

// Base-case channel mix. Biomass = high-volume baseload (thin margin, year-round,
// no spoilage). Cattle feed & mushroom = premium (dry-season scarcity 30–35 ฿/bale).
export const CHANNELS: Channel[] = [
  {
    key: 'biomass',
    th: 'โรงไฟฟ้าชีวมวล',
    en: 'Biomass power plant',
    mix: 0.45,
    pricePerTonne: 1050, // ≈ 21 ฿/bale, delivered to plant gate
    note: 'Baseload volume · year-round offtake · NPS / 304 corridor',
  },
  {
    key: 'cattle',
    th: 'อาหารสัตว์ (โค-กระบือ)',
    en: 'Cattle / livestock feed',
    mix: 0.35,
    pricePerTonne: 1750, // ≈ 35 ฿/bale, dry-season premium
    note: 'Premium · dry-season scarcity 30–35 ฿/bale',
  },
  {
    key: 'mushroom',
    th: 'เพาะเห็ด / อื่นๆ',
    en: 'Mushroom growing / other',
    mix: 0.2,
    pricePerTonne: 1650, // ≈ 33 ฿/bale
    note: 'Premium · steady local demand',
  },
]

export const blendedSellPerTonne = (channels: Channel[] = CHANNELS) =>
  channels.reduce((s, c) => s + c.mix * c.pricePerTonne, 0)

// ---- Cost of goods: straw acquisition, landed into the hub -----------------
export interface CostLine {
  key: string
  th: string
  en: string
  perTonne: number // ฿/tonne
}

export const COGS_LINES: CostLine[] = [
  { key: 'buy', th: 'รับซื้อฟางอัดก้อนจากเกษตรกร', en: 'Buy baled straw from farmers', perTonne: 550 }, // ≈ 11 ฿/bale
  { key: 'inbound', th: 'ค่าขนเข้าโกดัง', en: 'Inbound transport to hub', perTonne: 90 }, // ≈ 1.8 ฿/bale
]
export const cogsPerTonne = (lines: CostLine[] = COGS_LINES) =>
  lines.reduce((s, l) => s + l.perTonne, 0)

// ---- CapEx -----------------------------------------------------------------
export interface CapexLine {
  key: string
  th: string
  en: string
  amount: number
}
export const CAPEX_LINES: CapexLine[] = [
  { key: 'warehouse', th: 'โรงเก็บฟาง (ตาม BOQ)', en: 'Storage warehouse (per BOQ)', amount: 1451769 },
  { key: 'forklift', th: 'รถโฟล์คลิฟต์', en: 'Forklift', amount: 450000 },
  { key: 'truck', th: 'รถบรรทุก 6 ล้อ (มือสอง)', en: '6-wheel truck (used)', amount: 650000 },
  { key: 'misc', th: 'เครื่องชั่ง เครื่องมือ สำนักงาน', en: 'Scales, tools, office setup', amount: 150000 },
]
export const BUILDING_CAPEX = 1451769
export const EQUIPMENT_CAPEX = CAPEX_LINES.reduce((s, l) => s + l.amount, 0) - BUILDING_CAPEX
export const totalCapex = (lines: CapexLine[] = CAPEX_LINES) =>
  lines.reduce((s, l) => s + l.amount, 0)
export const WORKING_CAPITAL = 300000 // inventory + receivables float

// ---- OpEx (annual, base case) ----------------------------------------------
export interface OpexLine {
  key: string
  th: string
  en: string
  perYear: number
}
export const OPEX_LINES: OpexLine[] = [
  { key: 'staff', th: 'เงินเดือน (ผู้จัดการ + แรงงาน)', en: 'Staff (manager + crew)', perYear: 420000 },
  { key: 'fleet', th: 'น้ำมัน + ซ่อมบำรุง (โฟล์คลิฟต์/รถ)', en: 'Fuel & maintenance (forklift/truck)', perYear: 150000 },
  { key: 'lease', th: 'ค่าเช่าที่ดิน', en: 'Land lease', perYear: 60000 },
  { key: 'utilities', th: 'ไฟฟ้า ประกัน เบ็ดเตล็ด', en: 'Utilities, insurance, misc', perYear: 90000 },
  { key: 'selling', th: 'การขาย & บริหาร', en: 'Selling & admin', perYear: 100000 },
]
export const opexPerYear = (lines: OpexLine[] = OPEX_LINES) =>
  lines.reduce((s, l) => s + l.perYear, 0)

// ---- Shared financial parameters -------------------------------------------
export const PARAMS = {
  years: 10,
  taxRate: 0.15, // SME effective
  discountRate: 0.08, // WACC for a Thai agri-SME
  buildingLifeYrs: 20,
  equipmentLifeYrs: 7,
  buildingSalvageFrac: 0.6, // concrete + steel retain value
  equipmentResidualFrac: 0.2,
  rampYear1: 0.6, // throughput ramp while building supply network
  rampYear2: 0.8,
}

// ---- Scenarios -------------------------------------------------------------
export interface Scenario {
  key: 'conservative' | 'base' | 'upside'
  th: string
  en: string
  throughputT: number // tonnes / year at steady state
  sellPerT: number // blended resale ฿/tonne
  cogsPerT: number // landed straw cost ฿/tonne
  opex: number // ฿/year
}

export const SCENARIOS: Scenario[] = [
  { key: 'conservative', th: 'ระมัดระวัง', en: 'Conservative', throughputT: 1500, sellPerT: 1320, cogsPerT: 660, opex: 760000 },
  { key: 'base', th: 'ฐาน', en: 'Base', throughputT: 2000, sellPerT: blendedSellPerTonne(), cogsPerT: cogsPerTonne(), opex: opexPerYear() },
  { key: 'upside', th: 'เชิงบวก', en: 'Upside', throughputT: 2800, sellPerT: 1500, cogsPerT: 620, opex: 920000 },
]

// ---- Finance helpers -------------------------------------------------------
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0)
}

export function irr(cashflows: number[]): number | null {
  // bisection on [-0.9, 2]; returns null if no sign change
  let lo = -0.9
  let hi = 2
  const f = (r: number) => npv(r, cashflows)
  let flo = f(lo)
  let fhi = f(hi)
  if (flo * fhi > 0) return null
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (Math.abs(fm) < 1e-3) return mid
    if (flo * fm < 0) {
      hi = mid
      fhi = fm
    } else {
      lo = mid
      flo = fm
    }
  }
  return (lo + hi) / 2
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
  scenario: Scenario
  grossMarginPerT: number
  steadyEbitda: number
  ebitdaMarginPct: number
  initialOutlay: number
  rows: YearRow[]
  cashflows: number[]
  npv: number
  irr: number | null
  paybackYears: number | null
  simpleRoiPct: number // avg annual net profit / total capex
  totalCapex: number
}

export function runScenario(s: Scenario): ScenarioResult {
  const capex = totalCapex()
  const wc = WORKING_CAPITAL
  const initialOutlay = capex + wc
  const dep = BUILDING_CAPEX / PARAMS.buildingLifeYrs + EQUIPMENT_CAPEX / PARAMS.equipmentLifeYrs
  const gmPerT = s.sellPerT - s.cogsPerT

  const rows: YearRow[] = []
  const cashflows: number[] = [-initialOutlay]
  let cumulative = -initialOutlay

  for (let y = 1; y <= PARAMS.years; y++) {
    const ramp = y === 1 ? PARAMS.rampYear1 : y === 2 ? PARAMS.rampYear2 : 1
    const throughput = s.throughputT * ramp
    const revenue = throughput * s.sellPerT
    const cogs = throughput * s.cogsPerT
    const grossProfit = revenue - cogs
    const ebitda = grossProfit - s.opex
    const ebit = ebitda - dep
    const tax = Math.max(0, ebit) * PARAMS.taxRate
    const netProfit = ebit - tax
    const operatingCashFlow = ebitda - tax // add back depreciation
    const terminal =
      y === PARAMS.years
        ? BUILDING_CAPEX * PARAMS.buildingSalvageFrac +
          EQUIPMENT_CAPEX * PARAMS.equipmentResidualFrac +
          wc
        : 0
    const netCashFlow = operatingCashFlow + terminal
    cumulative += netCashFlow
    cashflows.push(netCashFlow)
    rows.push({
      year: y,
      ramp,
      throughput,
      revenue,
      cogs,
      grossProfit,
      opex: s.opex,
      ebitda,
      depreciation: dep,
      ebit,
      tax,
      netProfit,
      operatingCashFlow,
      terminal,
      netCashFlow,
      cumulative,
    })
  }

  // payback: first year cumulative >= 0, linearly interpolated
  let paybackYears: number | null = null
  let prevCum = -initialOutlay
  for (const r of rows) {
    if (r.cumulative >= 0) {
      const within = (0 - prevCum) / (r.cumulative - prevCum)
      paybackYears = r.year - 1 + within
      break
    }
    prevCum = r.cumulative
  }

  const steadyThroughput = s.throughputT
  const steadyEbitda = gmPerT * steadyThroughput - s.opex
  const steadyRevenue = steadyThroughput * s.sellPerT
  const avgNetProfit = rows.reduce((sum, r) => sum + r.netProfit, 0) / rows.length

  return {
    scenario: s,
    grossMarginPerT: gmPerT,
    steadyEbitda,
    ebitdaMarginPct: (steadyEbitda / steadyRevenue) * 100,
    initialOutlay,
    rows,
    cashflows,
    npv: npv(PARAMS.discountRate, cashflows),
    irr: irr(cashflows),
    paybackYears,
    simpleRoiPct: (avgNetProfit / capex) * 100,
    totalCapex: capex,
  }
}

export const runAll = () => SCENARIOS.map(runScenario)

// ---- Location options ------------------------------------------------------
export interface LocationOption {
  province: string
  th: string
  score: number // 1–5 fit
  pros: string[]
  recommended?: boolean
}
export const LOCATIONS: LocationOption[] = [
  {
    province: 'Chachoengsao',
    th: 'ฉะเชิงเทรา',
    score: 5,
    recommended: true,
    pros: [
      'ศูนย์กลางโรงไฟฟ้าชีวมวล/อุตสาหกรรม (NPS, นิคม 304) — ระบายฟางได้ตลอดปี',
      'พื้นที่นาข้าวภาคกลาง-ตะวันออกหนาแน่น วัตถุดิบใกล้',
      'โลจิสติกส์ดี ใกล้ EEC / ท่าเรือ / ตลาดปศุสัตว์ภาคตะวันออก',
    ],
  },
  {
    province: 'Suphan Buri / Ayutthaya',
    th: 'สุพรรณบุรี / อยุธยา',
    score: 4,
    pros: ['อู่ข้าวภาคกลาง วัตถุดิบล้นตลาด', 'ราคาวัตถุดิบถูก', 'ไกลโรงไฟฟ้าชีวมวลกว่า — ค่าขนสูงขึ้น'],
  },
  {
    province: 'Nakhon Ratchasima',
    th: 'นครราชสีมา',
    score: 4,
    pros: ['ตลาดปศุสัตว์ (โค) ใหญ่ที่สุด — ราคาฟางพรีเมียม', 'พื้นที่นากว้าง', 'กระจายตัว ระยะขนส่งไกล'],
  },
]
