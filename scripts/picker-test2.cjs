const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.click('.picker-btn', { force: true })
  await p.waitForTimeout(350)
  const info = await p.evaluate(() => {
    const b = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    return { picker: b('.picker'), pop: b('.picker-pop'), rows: document.querySelectorAll('.picker-row').length }
  })
  console.log(JSON.stringify(info))
  await p.mouse.click(30, 440)
  await p.waitForTimeout(250)
  console.log('closed by blank:', (await p.locator('.picker-pop').count()) === 0)
  await p.screenshot({ path: '/tmp/picker-inplace.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
