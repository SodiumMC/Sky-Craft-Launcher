const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1200)
  const info = await p.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    return {
      managerTop: [...document.querySelectorAll('.manager-top')].map(box),
      actions: [...document.querySelectorAll('.card-bar-actions')].map((e) => ({ box: box(e), html: e.innerHTML.slice(0, 200) })),
      winBtns: [...document.querySelectorAll('.win-btn')].map(box)
    }
  })
  console.log(JSON.stringify(info, null, 1).slice(0, 1500))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
