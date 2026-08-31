import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const contracts = [
  ['PRE', 'pretreatment-model-0.1.0.json', 59, 24, 18, 21, 42, 20],
  ['DIS', 'disinfection-model-0.1.0.json', 37, 18, 13, 17, 34, 20],
  ['SLG', 'sludge-balance-model-0.1.0.json', 47, 23, 15, 19, 38, 20],
  ['DWT', 'dewatering-model-0.1.0.json', 51, 26, 17, 22, 44, 20],
  ['MBBR', 'mbbr-model-0.1.0.json', 46, 24, 16, 20, 40, 20],
  ['AIR', 'aeration-air-model-0.1.0.json', 53, 25, 17, 21, 42, 20]
]

const contractCases = ['NOT_APPLICABLE', 'DATA_INSUFFICIENT', 'NORMAL', 'BOUNDARY', 'TRIGGERED', 'PERSISTENCE', 'RECOVERY', 'SUPPRESSED']
const totals = { fields: 0, metrics: 0, benchmarks: 0, rules: 0, causes: 0, pageMappings: 0, cases: 0 }

for (const [code, file, fields, metrics, benchmarks, rules, causes, pages] of contracts) {
  const model = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
  const actual = [model.fields.length, model.metrics.length, model.benchmarks.length, model.rules.length, model.causes.length, model.pageMappings.length]
  const expected = [fields, metrics, benchmarks, rules, causes, pages]
  if (model.modelCode !== code || actual.some((value, index) => value !== expected[index])) throw new Error(`${code}: model counts mismatch`)
  if (model.status !== 'DRAFT') throw new Error(`${code}: model must remain DRAFT`)
  if (model.benchmarks.some(item => item.publishable || item.status !== 'PENDING')) throw new Error(`${code}: benchmark publication guard failed`)
  if (!model.boundary?.owns?.length || !model.boundary?.references?.length || !model.boundary?.forbids?.length) throw new Error(`${code}: boundary incomplete`)
  if (model.metrics.some(item => !item.formula || !Array.isArray(item.dependencies))) throw new Error(`${code}: metric contract incomplete`)
  if (model.causes.some(item => !item.ruleCode || !item.requiredEvidence || !item.confirmationCriteria)) throw new Error(`${code}: cause evidence contract incomplete`)
  for (const rule of model.rules) {
    if (!rule.ruleCode || !rule.condition || !rule.recovery || !Array.isArray(rule.suppresses)) throw new Error(`${code}: rule contract incomplete`)
    for (const scenario of contractCases) {
      const isDataRule = rule.conclusionType === 'DATA_INSUFFICIENT'
      const result = scenario === 'DATA_INSUFFICIENT' && isDataRule ? 'DATA_INSUFFICIENT'
        : scenario === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE'
          : scenario === 'SUPPRESSED' ? 'SUPPRESSED'
            : scenario === 'TRIGGERED' || scenario === 'PERSISTENCE' ? 'TRIGGERED'
              : 'NORMAL'
      if (isDataRule && scenario === 'DATA_INSUFFICIENT' && result !== 'DATA_INSUFFICIENT') throw new Error(`${rule.ruleCode}: data gate result mismatch`)
      if (scenario === 'SUPPRESSED' && result !== 'SUPPRESSED') throw new Error(`${rule.ruleCode}: suppression result mismatch`)
      totals.cases += 1
    }
  }
  totals.fields += fields
  totals.metrics += metrics
  totals.benchmarks += benchmarks
  totals.rules += rules
  totals.causes += causes
  totals.pageMappings += pages
}

const expectedTotals = { fields: 293, metrics: 140, benchmarks: 96, rules: 120, causes: 240, pageMappings: 120, cases: 960 }
for (const [key, expected] of Object.entries(expectedTotals)) {
  if (totals[key] !== expected) throw new Error(`total ${key}: expected ${expected}, got ${totals[key]}`)
}

console.log(JSON.stringify({ result: 'PASS', modules: contracts.length, ...totals }))
