import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./backend-entrypoint.sh', import.meta.url));
function run(url, extra = {}) {
  return spawnSync('sh', [script, process.execPath, '-e', 'process.stdout.write(process.env.DATABASE_URL)'], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, DATABASE_URL: url, DATABASE_USERNAME: 'test-user', DATABASE_PASSWORD: 'fake-test-password', ...extra },
  });
}
for (const scheme of ['postgresql', 'postgres']) {
  test(`converts ${scheme} URI without exposing embedded credentials`, () => {
    const result = run(`${scheme}://test-user:fake%40password@postgres:5432/waterx?sslmode=require`);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'jdbc:postgresql://postgres:5432/waterx?sslmode=require');
    assert.equal(result.stderr, '');
  });
}
test('preserves an existing JDBC URL', () => {
  const url = 'jdbc:postgresql://postgres:5432/waterx';
  assert.equal(run(url).stdout, url);
});
test('supports URI without embedded credentials and IPv6 host', () => {
  assert.equal(run('postgresql://[::1]:5432/waterx').stdout, 'jdbc:postgresql://[::1]:5432/waterx');
});
test('fails closed for missing separate credentials', () => {
  const result = run('postgresql://user:fake-secret@postgres:5432/waterx', { DATABASE_PASSWORD: '' });
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.ok(!result.stderr.includes('fake-secret'));
});
test('rejects unsupported or missing database addresses without echoing them', () => {
  for (const url of ['', 'https://user:fake-secret@host/db', 'postgresql://host', 'postgresql:///db']) {
    const result = run(url);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');
    assert.ok(!result.stderr.includes('fake-secret'));
  }
});
