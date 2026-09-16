import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

// CI only. Never initialize or probe an arbitrary production database here.
const [address] = process.argv.slice(2)
const base = new URL(address)
assert.equal(base.hostname, '127.0.0.1')
let healthy = false
for (let attempt = 0; attempt < 120; attempt++) {
  try {
    const response = await fetch(new URL('/actuator/health', base), { signal: AbortSignal.timeout(2000) })
    if (response.ok && (await response.json()).status === 'UP') { healthy = true; break }
  } catch { /* Only wait for the disposable container's startup. */ }
  await delay(1000)
}
assert.ok(healthy, 'Backend image failed to become healthy with its disposable database')
const response = await fetch(new URL('/api/shortcuts/version-check', base))
assert.equal(response.status, 200)
assert.match(response.headers.get('content-type') ?? '', /application\/json/)
assert.ok((await response.text()).trim())
console.log('Verified actual backend image: health UP and public version-check JSON')
