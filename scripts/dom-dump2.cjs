const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1000)
  const out = await p.evaluate(() => {
    const b = (s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] })
    return { top: b('.manager-top'), topBtns: b('.manager-top .win-btn'), bar: b('.card-bar'), actions: b('.card-bar-actions'), icons: b('.card-bar-actions .icon-btn, .card-bar-actions .avatar') }
  })
  console.log(JSON.stringify(out))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
