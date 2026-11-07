const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const s = await p.evaluate(() => window.scl.getState())
  const profile = s.versions.find((v) => v.profile && v.gameVersion === '1.20.1')
  console.log('profile:', profile?.displayName, profile?.id, profile?.baseVersion, profile?.path)
  const mods = await p.evaluate((id) => window.scl.listMods(id), profile.id)
  console.log('mods:', mods.length, mods.slice(0, 3).map((m) => m.title ?? m.name))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
