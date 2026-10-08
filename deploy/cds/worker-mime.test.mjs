import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

test('管理端模块工作程序使用 JavaScript MIME 并保留缺失资源 404',()=>{
 const config=readFileSync(new URL('./nginx-admin.conf',import.meta.url),'utf8')
 assert.match(config,/location ~ \^\/assets\/.*\\\.mjs\$\s*\{\s*types \{ application\/javascript mjs; \}\s*try_files \$uri =404;/)
 const verifier=readFileSync(new URL('./verify-surface.mjs',import.meta.url),'utf8')
 assert.ok(verifier.includes('Module worker MIME type'))
 assert.ok(verifier.includes('GIS must use the bundled worker URL'))
})
