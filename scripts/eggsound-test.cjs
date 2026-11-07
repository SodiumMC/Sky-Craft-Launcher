const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => { window.__audio = 0; window.scl.onEggClang((x) => { window.__audio = (x.audio || '').length }) })
  await p.evaluate(() => window.scl.easterEggFall())
  await p.waitForTimeout(2500)
  console.log('audio data length:', await p.evaluate(() => window.__audio))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
