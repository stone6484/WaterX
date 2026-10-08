import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

const [address, commit] = process.argv.slice(2)
assert.match(commit ?? '', /^[a-f0-9]{40}$/)
const base = new URL(address)
assert.ok(base.pathname.endsWith('/'))
let response
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    response = await fetch(base, { signal: AbortSignal.timeout(3000) })
    if (response.ok) break
  } catch { /* Wait only for startup, never ignore final failure. */ }
  await delay(1000)
}
assert.equal(response?.status, 200, 'Entry page unavailable')
assert.match(response.headers.get('content-type') ?? '', /text\/html/)
const html = await response.text()
assert.ok(html.trim())
const manifestResponse = await fetch(new URL('build-info.json', base))
assert.equal(manifestResponse.status, 200)
const manifest = await manifestResponse.json()
assert.equal(manifest.commit, commit)
assert.equal(manifest.base, base.pathname)
const entries = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map(match => match[1])
let entryScript = ''
assert.ok(entries.some(path => /\.js(?:\?|$)/.test(path)))
assert.deepEqual(entries.sort(), Object.keys(manifest.assets).sort())
for (const path of entries) {
  const url = new URL(path, base)
  assert.equal(url.origin, base.origin)
  const asset = await fetch(url)
  assert.equal(asset.status, 200, path)
  assert.match(asset.headers.get('content-type') ?? '', path.includes('.css') ? /text\/css/ : /javascript/)
  const content = Buffer.from(await asset.arrayBuffer())
  assert.ok(content.length)
  assert.equal(createHash('sha256').update(content).digest('hex'), manifest.assets[path])
  if (path.endsWith('.js')) entryScript = content.toString('utf8')
}
if (base.pathname === '/') {
  const chunk = entryScript.match(/GisMapPage-[A-Za-z0-9_-]+\.js/)
  assert.ok(chunk, 'GIS lazy chunk must be included in admin build')
  const gisResponse = await fetch(new URL(`assets/${chunk[0]}`, base))
  assert.equal(gisResponse.status, 200)
  const gisScript = await gisResponse.text()
  const worker = gisScript.match(/"(\/assets\/maplibre-gl-worker-[A-Za-z0-9_-]+\.mjs)"/)
  assert.ok(worker, 'GIS must use the bundled worker URL')
  const workerResponse = await fetch(new URL(worker[1], base))
  assert.equal(workerResponse.status, 200)
  assert.match(workerResponse.headers.get('content-type') ?? '', /(?:application|text)\/javascript/, 'Module worker MIME type')
  assert.ok((await workerResponse.arrayBuffer()).byteLength > 100000)
}
for (const path of ['assets/does-not-exist.js', '../api/does-not-exist', '../actuator/health']) {
  assert.equal((await fetch(new URL(path, base))).status, 404, `Must not return SPA HTML for ${path}`)
}
console.log(`Verified ${base.pathname}: actual HTML, ${entries.length} assets, commit and 404 boundaries`)
