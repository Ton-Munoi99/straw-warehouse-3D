import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import ts from 'typescript'

// Transpile model.ts plus the one module it imports (boq/data.ts) into a temp tree that
// mirrors src/, adding the .mjs extension Node needs on relative imports.
async function loadModel() {
  const outDir = join(tmpdir(), 'straw-warehouse-tests', `${Date.now()}-${Math.random().toString(16).slice(2)}`)
  for (const rel of ['feasibility/model', 'boq/data']) {
    const source = await readFile(new URL(`../src/${rel}.ts`, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
    }).outputText.replace(/from '(\.\.?\/[^']+)'/g, "from '$1.mjs'")
    const outPath = join(outDir, `${rel}.mjs`)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, compiled)
  }
  return import(`file://${join(outDir, 'feasibility/model.mjs').replace(/\\/g, '/')}`)
}

test('default feasibility assumptions use a 20 kg small-bale base case with positive returns', async () => {
  const model = await loadModel()
  const inputs = model.DEFAULT_INPUTS

  assert.equal(inputs.baleKg, 20)
  assert.equal(model.balesPerTonne(inputs.baleKg), 50)

  const prices = Object.fromEntries(inputs.channels.map((c) => [c.key, c.pricePerTonne]))
  assert.equal(prices.biomass, 1050)
  assert.equal(prices.cattle, 1750)
  assert.equal(prices.mushroom, 1650)

  const cogs = Object.fromEntries(inputs.cogsLines.map((c) => [c.key, c.perTonne]))
  assert.equal(cogs.buy, 550)
  assert.equal(cogs.inbound, 90)

  const result = model.runInputs(inputs)

  assert.equal(Math.round(model.blendedSell(inputs)), 1415)
  assert.equal(model.cogsPerTonne(inputs), 640)
  assert.equal(Math.round(result.npv), 1134929)
  assert.equal(Math.round((result.irr ?? 0) * 1000) / 10, 13.4)
  assert.equal(Math.round((result.paybackYears ?? 0) * 10) / 10, 6.2)
})

test('debt financing: annuity repays the loan, tax shield and leverage behave', async () => {
  const model = await loadModel()
  const inputs = model.DEFAULT_INPUTS
  const project = model.runInputs(inputs)
  const debt = model.runDebt(inputs, project)

  // loan = 60% of CapEx; equity covers the rest of the outlay incl. working capital
  assert.equal(Math.round(debt.loan), Math.round(project.totalCapex * 0.6))
  assert.equal(Math.round(debt.equity), Math.round(project.initialOutlay - debt.loan))

  // independent annuity: 6 amortizing years at 6.5% after 1 interest-only year
  const k = 0.065
  const expectedPayment = (debt.loan * k) / (1 - Math.pow(1 + k, -6))
  assert.ok(Math.abs(debt.payment - expectedPayment) < 1e-6)

  // year 1 is interest-only, principal starts in year 2, loan is fully repaid by year 7
  assert.equal(debt.rows[0].principal, 0)
  assert.ok(Math.abs(debt.rows[0].interest - debt.loan * k) < 1e-6)
  const repaid = debt.rows.reduce((s, r) => s + r.principal, 0)
  assert.ok(Math.abs(repaid - debt.loan) < 1e-3)
  assert.ok(Math.abs(debt.rows[6].balanceEnd) < 1e-3)
  assert.ok(debt.rows.slice(7).every((r) => r.debtService === 0 && r.dscr === null))

  // interest is tax-deductible: levered tax ≤ unlevered tax every year
  debt.rows.forEach((r, i) => assert.ok(project.rows[i].ebitda - r.cfads <= project.rows[i].tax + 1e-6))

  // cheap debt (6.5%) on a ~13% project lifts the equity IRR
  assert.ok(debt.equityIrr > project.irr)

  // no loan → equity cash flows are exactly the project cash flows
  const noLoan = model.runDebt({ ...inputs, loanFrac: 0 }, project)
  assert.ok(Math.abs(noLoan.equityIrr - project.irr) < 1e-4)
  assert.equal(noLoan.minDscr, null)
})

test('storage capacity matches the 3D stack layout and flags the stock-turn gap', async () => {
  const model = await loadModel()
  const inputs = model.DEFAULT_INPUTS
  // 14 bales long × 11 rows × 14 layers, 20 kg each
  assert.equal(model.storageBales(), 14 * 11 * 14)
  assert.ok(Math.abs(model.storageCapacityT(inputs) - (2156 * 20) / 1000) < 1e-9)
  // 2,000 t/yr through a ~43 t store ≈ 46 full turns a year (≈ 8-day dwell)
  assert.equal(Math.round(model.stockTurnsPerYear(inputs)), 46)
})

test('capacity options: only the contradictory base case pays back; break-evens are sane', async () => {
  const model = await loadModel()
  const o = model.capacityOptions(model.DEFAULT_INPUTS)
  const npv = Object.fromEntries(o.rows.map((r) => [r.key, r.npv]))
  assert.ok(npv.base > 0)
  assert.ok(npv.noPremium < 0 && npv.bigger < 0 && npv.smaller < 0)
  // bigger option holds a month of sales → 12 turns/yr; smaller option sells 12 × capacity
  assert.equal(Math.round(o.rows.find((r) => r.key === 'bigger').turns), 12)
  assert.equal(Math.round(o.rows.find((r) => r.key === 'smaller').throughputT), Math.round(o.capacityT * 12))
  // extra month of storage must stay under ~฿1.67M (~฿3,240/m²) to keep NPV ≥ 0
  assert.ok(Math.abs(o.maxExtraCapex - 1672204) < 2000)
  assert.equal(Math.round(o.maxPerM2 / 10) * 10, 3240)
  assert.equal(Math.round(o.breakevenT / 10) * 10, 1730)
})
