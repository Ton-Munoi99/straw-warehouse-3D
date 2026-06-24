import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import ts from 'typescript'

async function loadModel() {
  const sourcePath = new URL('../src/feasibility/model.ts', import.meta.url)
  const source = await readFile(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText

  const outDir = join(tmpdir(), 'straw-warehouse-tests')
  await mkdir(outDir, { recursive: true })
  const outPath = join(outDir, `model-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`)
  await writeFile(outPath, compiled)
  return import(`file://${outPath.replace(/\\/g, '/')}`)
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
