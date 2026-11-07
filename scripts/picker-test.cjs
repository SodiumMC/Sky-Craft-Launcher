const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.click('.picker-btn')
  await p.waitForTimeout(500)
  const info = await p.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), getComputedStyle(e).overflow, getComputedStyle(e).zIndex] }
    return { pop: b('.picker-pop'), title: b('.lc-title'), card: b('.launch-card'), rows: document.querySelectorAll('.picker-row').length }
  })
  console.log(JSON.stringify(info))
  await p.screenshot({ path: '/tmp/picker-open.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
