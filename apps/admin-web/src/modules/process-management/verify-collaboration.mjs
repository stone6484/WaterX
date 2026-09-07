import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

// Exercise the real SFC setup with Vue reactivity; browser checks cover rendering.
const require = createRequire(import.meta.url)
const vue = require('vue'), ts = require('typescript')
const { parse, compileScript } = require('vue/compiler-sfc')
const filename = fileURLToPath(new URL('./DailyCollaborationPage.vue', import.meta.url))
const script = compileScript(parse(fs.readFileSync(filename, 'utf8')).descriptor, { id: 'daily-integration' })
const compiled = ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const line = { id: 'line-a', name: '验收工艺线', permissions: ['process:daily:execute'], actors: [], template: [] }
const record = { id: 'record-a', line_id: line.id, revision: 1, state: 'DRAFT', cells: {}, template: [], actions: ['save', 'submit'], versions: [], events: [], assignee_id: 'owner', reviewer_id: 'reviewer', confirmed_version: 0 }
const pending = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const settle = async () => { await vue.nextTick(); await new Promise(resolve => setImmediate(resolve)) }
function mount(overrides = {}) {
  const api = { processDailyContext: async () => [line], processDailyList: async () => [record], processDailyDetail: async () => structuredClone(record), ...overrides }
  const props = vue.reactive({ api: { forSite: () => api }, siteId: 'site-a', siteName: '验收水厂', page: 'operationEntry' })
  const cleanups = [], listeners = new Map(), output = { exports: {} }
  const scope = vue.effectScope()
  const fakeWindow = { confirm: () => false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) }
  const context = { exports: output.exports, module: output, window: fakeWindow, console, setTimeout,
    require: name => name === 'vue' ? { ...vue, onBeforeUnmount: fn => cleanups.push(fn) } : name === './types' ? { businessToday: () => '2026-09-07' } : {} }
  vm.runInNewContext(compiled, context, { filename })
  let exposed
  const state = scope.run(() => output.exports.default.setup(props, { expose: value => { exposed = value }, emit: () => {} }))
  return { state, props, api, exposed, fakeWindow, listeners, stop: () => { cleanups.forEach(fn => fn()); scope.stop() } }
}
let cases = 0
async function test(name, fn) { await fn(); cases++; console.log(`PASS ${name}`) }
await test('加载中阻止离开，成功后解除', async () => {
  const wait = pending(), x = mount({ processDailyContext: () => wait.promise })
  assert.equal(x.exposed.canLeave(), false); wait.resolve([line]); await settle()
  assert.equal(x.exposed.canLeave(), true); assert.equal(x.state.records.value.length, 1); x.stop()
})
await test('未保存输入阻止离开，取消刷新保留真实0', async () => {
  const x = mount(); await settle(); await x.state.open(record.id)
  x.state.setCell('flow', { value: '0', state: 'VALID', source: 'MANUAL', note: '' })
  assert.equal(x.exposed.canLeave(), false); await x.state.refresh()
  assert.equal(x.state.cells.value.flow.value, '0'); assert.equal(x.state.dirty.value, true)
  let prevented = false; x.listeners.get('beforeunload')({ preventDefault: () => { prevented = true } })
  assert.equal(prevented, true); x.stop(); assert.equal(x.listeners.size, 0)
})
await test('明确放弃后刷新到服务端内容并解除保护', async () => {
  const x = mount(); await settle(); await x.state.open(record.id)
  x.state.setCell('flow', { value: '7', state: 'VALID', source: 'MANUAL', note: '' }); x.fakeWindow.confirm = () => true
  await x.state.refresh(); assert.equal(x.state.cells.value.flow, undefined); assert.equal(x.exposed.canLeave(), true); x.stop()
})
await test('跨项目切换清除说明和历史，迟到详情不回灌', async () => {
  const wait = pending(), x = mount({ processDailyDetail: () => wait.promise }); await settle()
  const request = x.state.open(record.id); x.state.note.value = '上一个项目的说明'; x.props.siteId = 'site-b'; await settle()
  wait.resolve(structuredClone(record)); await request
  assert.equal(x.state.detail.value, null); assert.equal(x.state.note.value, ''); assert.equal(x.state.error.value, ''); x.stop()
})
await test('迟到失败不覆盖新页面状态', async () => {
  const wait = pending(), x = mount({ processDailyDetail: () => wait.promise }); await settle()
  const request = x.state.open(record.id); x.props.page = 'processReport'; await settle(); wait.reject(new Error('旧请求失败')); await request
  assert.equal(x.state.error.value, ''); assert.equal(x.state.blocked.value, false); x.stop()
})
await test('上下文读取失败可重新读取，不冒充无授权成功', async () => {
  let fail = true; const x = mount({ processDailyContext: async () => { if (fail) throw new Error('连接失败'); return [line] } }); await settle()
  assert.equal(x.state.error.value, '连接失败'); assert.equal(x.state.blocked.value, true)
  fail = false; await x.state.refresh(); assert.equal(x.state.error.value, ''); assert.equal(x.state.lines.value.length, 1); x.stop()
})
await test('源页面只读与确认版本显示保持', async () => {
  const confirmed = { ...record, state: 'CONFIRMED', confirmed_version: 1, actions: [], versions: [{ version: 1, cells: { flow: { value: '0' } }, template: [] }] }
  const x = mount({ processDailyDetail: async () => confirmed }); await settle(); x.props.page = 'processAnalysis'; await settle(); await x.state.open(record.id)
  assert.equal(x.state.editable.value, false); assert.equal(x.state.historical.value, true); assert.equal(x.state.cells.value.flow.value, '0'); x.stop()
})
console.log(JSON.stringify({ result: 'PASS', cases, scope: '真实日数据协作组件逻辑；不替代后端权限和浏览器验收' }))
