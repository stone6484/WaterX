import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'

const [directory, base, commit] = process.argv.slice(2)
if (!directory || !base?.startsWith('/') || !base.endsWith('/') || !/^[a-f0-9]{40}$/.test(commit ?? '')) {
  throw new Error('Usage: verify-static.mjs <dist> </base/> <40-character commit>')
}
const root = resolve(directory)
const html = readFileSync(resolve(root, 'index.html'), 'utf8')
if (!html.trim()) throw new Error('Empty index.html')
const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map(match => match[1])
if (!assets.some(asset => /\.js(?:\?|$)/.test(asset))) throw new Error('No JavaScript entry found')
const hashes = {}
for (const url of assets) {
  if (!url.startsWith(base) || url.startsWith('//')) throw new Error(`Unexpected asset base: ${url}`)
  const path = resolve(root, url.slice(base.length).split('?')[0])
  if (!path.startsWith(root + sep) || !statSync(path).isFile() || !statSync(path).size) {
    throw new Error(`Missing or invalid asset: ${url}`)
  }
  hashes[url] = createHash('sha256').update(readFileSync(path)).digest('hex')
}
writeFileSync(resolve(root, 'build-info.json'), JSON.stringify({ commit, base, assets: hashes }, null, 2) + '\n')
console.log(`Verified ${base}: ${assets.length} entry assets, commit ${commit}`)
