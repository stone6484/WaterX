import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const commit = 'a'.repeat(40)
const script = new URL('./verify-static.mjs', import.meta.url)
function run(html, base = '/', asset = 'console.log(1)', sha = commit) {
  const dir = mkdtempSync(join(tmpdir(), 'waterx-static-test-'))
  try {
    mkdirSync(join(dir, 'assets'))
    writeFileSync(join(dir, 'assets/app.js'), asset)
    writeFileSync(join(dir, 'index.html'), html)
    const result = spawnSync(process.execPath, [fileURLToPath(script), dir, base, sha], { encoding: 'utf8' })
    return { ...result, manifest: result.status === 0 ? JSON.parse(readFileSync(join(dir, 'build-info.json'))) : null }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
test('admin asset and exact commit are recorded', () => {
  const result = run('<script src="/assets/app.js"></script>')
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.manifest.commit, commit)
  assert.equal(result.manifest.assets['/assets/app.js'].length, 64)
})
test('mobile base is preserved', () => assert.equal(run('<script src="/h5/assets/app.js"></script>', '/h5/').status, 0))
for (const [name, html, base, asset, sha] of [
  ['empty page', '', '/'],
  ['missing entry', '<h1>WaterX</h1>', '/'],
  ['wrong mobile base', '<script src="/assets/app.js"></script>', '/h5/'],
  ['missing asset', '<script src="/assets/missing.js"></script>', '/'],
  ['zero-byte asset', '<script src="/assets/app.js"></script>', '/', ''],
  ['outside dist', '<script src="/../outside.js"></script>', '/'],
  ['external asset', '<script src="//other.test/app.js"></script>', '/'],
  ['invalid commit', '<script src="/assets/app.js"></script>', '/', 'x', 'latest'],
]) test(`reject ${name}`, () => assert.notEqual(run(html, base, asset, sha).status, 0))
