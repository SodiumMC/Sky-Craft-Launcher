const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('logs'))
  await p.waitForTimeout(900)
  const info = await p.evaluate(() => {
    const cs = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).userSelect : 'none' }
    return { body: cs('body'), button: cs('button'), console: cs('.console'), input: cs('input') }
  })
  console.log(JSON.stringify(info))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
