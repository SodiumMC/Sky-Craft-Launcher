#!/usr/bin/env node
/**
 * 生成 latest.json：
 *   node scripts/make-update-manifest.cjs \
 *     --version 1.0.1 \
 *     --notes "修复版本下拉、加入版本隔离" \
 *     --base https://example.com/scl/ \
 *     --dmg SCL-1.0.1-arm64.dmg \
 *     --win SCL-1.0.1-win-x64.zip
 * 也可以直接给完整 URL：--dmg-url https://... --win-url https://...
 */
const fs = require('fs')
const path = require('path')

const argv = process.argv.slice(2)
const arg = (name, fallback = '') => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const version = arg('version')
if (!version) {
  console.error('缺少 --version')
  process.exit(1)
}
const base = arg('base')
const join = (name) => (name ? (base ? new URL(name, base).toString() : name) : '')
const urls = {}
const dmg = arg('dmg-url') || join(arg('dmg'))
const win = arg('win-url') || join(arg('win'))
if (dmg) urls['darwin-arm64'] = dmg
if (win) urls['win32-x64'] = win
if (!dmg && !win) {
  console.error('至少提供 --dmg 或 --win')
  process.exit(1)
}

const out = arg('out', 'latest.json')
const manifest = {
  version,
  notes: arg('notes', ''),
  pubDate: new Date().toISOString().slice(0, 10),
  urls
}
fs.writeFileSync(path.resolve(out), JSON.stringify(manifest, null, 2) + '\n')
console.log(`wrote ${out}`)
