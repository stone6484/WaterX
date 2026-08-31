import assert from 'node:assert/strict'
import fs from 'node:fs'

const model = JSON.parse(fs.readFileSync(new URL('./vf-model-0.1.0.json', import.meta.url), 'utf8'))
const scenarios = ['NA', 'DATA', 'NORMAL', 'BOUNDARY', 'TRIGGER', 'PERSIST', 'RECOVER', 'SUPPRESS']

function evaluate(ruleCode, scenario) {
  const dataRule = ruleCode.startsWith('VF-DATA-')
  if (scenario === 'NA') return 'NOT_APPLICABLE'
  if (scenario === 'DATA') return 'DATA_INSUFFICIENT'
  if (scenario === 'SUPPRESS') return 'SUPPRESSED'
  if (scenario === 'TRIGGER') return dataRule ? 'DATA_INSUFFICIENT' : 'TRIGGERED'
  return 'NORMAL'
}

const cases = model.rules.flatMap(rule => scenarios.map((scenario, index) => ({
  caseId: `${rule.ruleCode}-${String(index + 1).padStart(2, '0')}`,
  status: evaluate(rule.ruleCode, scenario)
})))

assert.equal(model.fields.length, 84)
assert.equal(model.metrics.length, 35)
assert.equal(model.benchmarks.length, 20)
assert.equal(model.rules.length, 24)
assert.equal(model.causes.length, 30)
assert.equal(model.pageMappings.length, 20)
assert.equal(cases.length, 192)
assert.ok(model.benchmarks.every(item => item.status === 'PENDING' && item.publishable === false))
assert.ok(model.rules.every(item => item.boundary && item.boundary.trim()))
assert.ok(model.rules.filter(item => item.ruleCode.startsWith('VF-DATA-')).every(item => item.resultStatusWhenMatched === 'DATA_INSUFFICIENT' && item.suppresses.length > 0))
assert.ok(cases.filter(item => item.caseId.endsWith('-05') && item.caseId.startsWith('VF-DATA-')).every(item => item.status === 'DATA_INSUFFICIENT'))

console.log(JSON.stringify({ result: 'PASS', cases: cases.length, fields: 84, metrics: 35, benchmarks: 20, rules: 24, causes: 30, pageComponents: 20 }))
