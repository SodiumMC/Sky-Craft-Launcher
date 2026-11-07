const { _electron: electron } = require('playwright-core')
const fs = require('fs')
const os = require('os')
const path = require('path')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.saveConfig({ isolatedVersions: { tmpiso: true } }))
  const hits = await p.evaluate(() => window.scl.searchMods({ query: 'iris', loader: 'fabric', gameVersion: '1.20.1', sort: 'downloads' }))
  console.log('hits:', hits.slice(0, 3).map((h) => h.title).join(', '))
  if (hits[0]) {
    const res = await p.evaluate((id) => window.scl.installMod({ id, loader: 'fabric', gameVersion: '1.20.1', versionId: 'tmpiso' }), hits[0].id)
    console.log('install:', JSON.stringify(res).slice(0, 400))
    const dir = path.join(os.homedir(), 'Library/Application Support/ModrinthApp/meta/versions/tmpiso/game/mods')
    if (fs.existsSync(dir)) { console.log('files:', fs.readdirSync(dir).length); fs.rmSync(dir, { recursive: true, force: true }) }
  }
  await p.evaluate(() => window.scl.saveConfig({ isolatedVersions: {} }))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
