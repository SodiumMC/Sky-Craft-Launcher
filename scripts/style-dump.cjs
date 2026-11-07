const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  console.log(JSON.stringify(await p.evaluate(() => {
    const t = document.querySelector('.lc-title')
    const cs = getComputedStyle(t)
    const b = (s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    return { font: cs.fontSize, line: cs.lineHeight, height: cs.height, display: cs.display, margin: cs.margin, picker: b('.picker'), btn: b('.picker-btn'), titleRect: b('.lc-title') }
  })))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
