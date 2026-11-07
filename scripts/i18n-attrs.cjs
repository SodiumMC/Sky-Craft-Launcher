const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1400)
  const attrs = await p.evaluate(() => Array.from(document.querySelectorAll('input,textarea')).map((e) => e.getAttribute('placeholder')).filter((x) => x && /[\u4e00-\u9fa5]/.test(x)))
  console.log('placeholders:', JSON.stringify([...new Set(attrs)]))
  await p.screenshot({ path: '/tmp/en-download2.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
