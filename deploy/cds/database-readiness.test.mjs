import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('CI waits for the final PostgreSQL TCP listener, not the initialization socket', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/branch-image.yml', import.meta.url), 'utf8')
  const probes = workflow.split('\n').filter(line => line.includes('docker exec waterx-ci-db pg_isready'))
  assert.equal(probes.length, 2, 'Keep both the bounded wait and fail-closed final check')
  for (const probe of probes) assert.match(probe, /pg_isready -h 127\.0\.0\.1 -U waterx_ci -d waterx_ci/)
  assert.match(workflow, /for attempt in \$\(seq 1 60\)/)
  assert.ok(workflow.indexOf('node deploy/cds/verify-backend.mjs') < workflow.indexOf('Publish verified immutable commit tags'))
})
