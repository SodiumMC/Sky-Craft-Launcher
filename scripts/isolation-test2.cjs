const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.saveConfig({ versionIsolation: true }))
  console.log('instance mods:', await p.evaluate(() => window.scl.listMods('1.21.1-Fabric')))
  await p.evaluate(() => window.scl.saveConfig({ versionIsolation: false }))
  console.log('root mods count:', (await p.evaluate(() => window.scl.listMods())).length)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
