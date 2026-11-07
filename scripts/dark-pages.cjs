const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.saveConfig({ theme: 'dark' }))
  for (const view of ['download', 'versions', 'logs']) {
    await p.evaluate((v) => window.scl.openManager(v), view)
    await p.waitForTimeout(1200)
    await p.screenshot({ path: `/tmp/dark-${view}.png` })
  }
  await p.evaluate(() => window.scl.openAccount())
  await p.waitForTimeout(700)
  await p.screenshot({ path: '/tmp/dark-account.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
