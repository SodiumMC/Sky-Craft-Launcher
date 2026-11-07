const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openAccount())
  await p.waitForTimeout(900)
  const lines = await p.evaluate(() => [...new Set(document.body.innerText.split('\n').map(s => s.trim()).filter(s => /[\u4e00-\u9fa5]/.test(s)))])
  console.log(JSON.stringify(lines))
  await p.screenshot({ path: '/tmp/en-account2.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
