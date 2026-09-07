// Dependency-free UI guard using the project's existing Vue compiler.
// This catches wiring/token mistakes, not visual overflow or business correctness.
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = join(root, 'apps/admin-web')
const require = createRequire(join(app, 'package.json'))
const { parse, compileScript, compileTemplate } = require('vue/compiler-sfc')
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])
}
function unresolvedComponents(source, filename) {
  const { descriptor, errors } = parse(source, { filename })
  if (errors.length) throw new Error(errors.join('\n'))
  if (!descriptor.template) return []
  const bindings = descriptor.scriptSetup ? compileScript(descriptor, { id: 'wx-check' }).bindings : {}
  const result = compileTemplate({ source: descriptor.template.content, filename, id: 'wx-check', compilerOptions: { bindingMetadata: bindings } })
  if (result.errors.length) throw new Error(result.errors.join('\n'))
  return [...result.code.matchAll(/_resolveComponent\(["'](Wx[A-Za-z0-9]+)["']\)/g)].map(match => match[1])
}
// Guard self-test: a missing import must fail, a bound component must pass.
assert.deepEqual(unresolvedComponents('<template><WxSelect /></template>', 'missing.vue'), ['WxSelect'])
assert.deepEqual(unresolvedComponents('<script setup>import WxSelect from "./WxSelect.vue"</script><template><WxSelect /></template>', 'bound.vue'), [])

const files = walk(join(app, 'src')).filter(file => /\.(vue|css|ts)$/.test(file))
const sources = files.map(file => ({ file, source: readFileSync(file, 'utf8') }))
const definitions = new Set(sources.flatMap(({ source }) => [...source.matchAll(/(--wx-[\w-]+)\s*:/g)].map(match => match[1])))
const failures = []
// Freeze checks for the six approved semantic colors and the migrated risk
// selectors. This is a source contract, not a CSS cascade or screenshot test.
const semanticColors = {
  '--wx-success':'#2f9e6f', '--wx-success-strong':'#1e704d',
  '--wx-warning':'#f28c28', '--wx-warning-strong':'#c45f05',
  '--wx-danger':'#d94a4a', '--wx-danger-strong':'#b83232',
}
const tokenSource = readFileSync(join(app, 'src/design-tokens.css'), 'utf8')
for (const [token, expected] of Object.entries(semanticColors)) {
  const values = [...tokenSource.matchAll(new RegExp(`${token}\\s*:\\s*([^;{}]+)`, 'g'))]
  if (values.length !== 1 || values[0][1].trim().toLowerCase() !== expected) {
    failures.push(`冻结语义色偏移：${token} 应为 ${expected}；变更需先确认设计基线`)
  }
}
function lastDeclaration(css, selector, property) {
  let value
  for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(',').some(part => part.trim() === selector)) continue
    for (const declaration of rule[2].split(';')) {
      const colon = declaration.indexOf(':')
      if (declaration.slice(0, colon).trim() === property) value = declaration.slice(colon + 1).trim()
    }
  }
  return value
}
const probe = '.warning { background:var(--wx-warning) }'
assert.equal(lastDeclaration(probe, '.warning', 'background'), 'var(--wx-warning)')
assert.notEqual(lastDeclaration(probe.replace('var(--wx-warning)', '#a66a0b'), '.warning', 'background'), 'var(--wx-warning)')
assert.notEqual(lastDeclaration(`${probe}.warning{background:var(--wx-blue-700)}`, '.warning', 'background'), 'var(--wx-warning)')
assert.equal(lastDeclaration('', '.warning', 'background'), undefined)
const semanticBindings = {
  'modules/process-management/DiagnosisBoards.vue': [
    ['.pm-tab-counts i.warning', 'background', '--wx-warning'],
    ['.pm-tab-counts i.alarm', 'background', '--wx-danger'],
    ['.pm-deviation.normal', 'color', '--wx-success-strong'],
    ['.pm-deviation.warning', 'color', '--wx-warning-strong'],
    ['.pm-deviation.alarm', 'color', '--wx-danger-strong'],
    ['.pm-deviation-track i', 'background', '--wx-success'],
    ['.pm-deviation.warning .pm-deviation-track i', 'background', '--wx-warning'],
    ['.pm-deviation.alarm .pm-deviation-track i', 'background', '--wx-danger'],
  ],
  'modules/management-quality/ManagementQualityPage.vue': [
    ['.risk-normal .mq-deviation-value', 'color', '--wx-success-strong'],
    ['.risk-attention .mq-deviation-value', 'color', '--wx-warning-strong'],
    ['.risk-risk .mq-deviation-value', 'color', '--wx-danger-strong'],
    ['.mq-score-track b', 'background', '--wx-success'],
    ['.risk-attention .mq-score-track b', 'background', '--wx-warning'],
    ['.risk-risk .mq-score-track b', 'background', '--wx-danger'],
  ],
}
for (const [file, bindings] of Object.entries(semanticBindings)) {
  const { descriptor } = parse(readFileSync(join(app, 'src', file), 'utf8'))
  const css = descriptor.styles.map(style => style.content).join('\n')
  for (const [selector, property, token] of bindings) {
    if (lastDeclaration(css, selector, property) !== `var(${token})`) failures.push(`${file}: ${selector} 的 ${property} 必须使用 ${token}`)
  }
}
for (const { file, source } of sources) {
  const name = relative(root, file)
  for (const match of source.matchAll(/var\(\s*(--wx-[\w-]+)/g)) {
    if (!definitions.has(match[1])) failures.push(`${name}: 未定义设计令牌 ${match[1]}`)
  }
  if (file.endsWith('.vue')) {
    for (const component of unresolvedComponents(source, file)) failures.push(`${name}: ${component} 未绑定导入；不允许依赖隐式全局注册`)
  }
}
const sprite = readFileSync(join(app, 'public/waterx-nav-icons.svg'), 'utf8')
const symbols = new Set([...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]))
const requiredIcons = ['home', 'operations', 'process', 'equipment', 'laboratory', 'safety', 'inventory', 'business', 'efficiency', 'evaluation', 'quality', 'improvement', 'information', 'chevron-left', 'chevron-right', 'chevron-down']
for (const icon of requiredIcons) if (!symbols.has(icon)) failures.push(`导航图标缺失：${icon}`)
if (failures.length) {
  console.error([...new Set(failures)].join('\n'))
  process.exitCode = 1
} else console.log(`UI 静态守卫通过：${sources.filter(({ file }) => file.endsWith('.vue')).length} 个 Vue 文件、设计令牌引用、${requiredIcons.length} 个固定图标、6 个冻结语义色及 14 处风险色绑定；守卫自测通过。仍需浏览器视觉与交互验收。`)
