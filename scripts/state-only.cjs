const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const s = await p.evaluate(() => window.scl.getState())
  console.log(JSON.stringify({ dir: s.config.gameDir, selected: s.config.selectedVersion, versions: s.versions.map((v) => ({ id: v.id, inst: v.installed, broken: v.broken })) }, null, 1))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
