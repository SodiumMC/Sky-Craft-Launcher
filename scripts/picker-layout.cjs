const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const snap = () => p.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    return { title: b('.lc-title'), meta: b('.lc-meta'), head: b('.lc-head'), card: b('.launch-card'), picker: b('.picker') }
  })
  const before = await snap()
  await p.click('.picker-btn', { force: true })
  await p.waitForTimeout(300)
  const after = await snap()
  console.log(JSON.stringify({ before, after }))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
