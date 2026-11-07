const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1800)
  const info = await p.evaluate(() => {
    const r = document.querySelector('.mod-results')
    return r ? { h: Math.round(r.getBoundingClientRect().height), sh: r.scrollHeight, ch: r.clientHeight } : null
  })
  console.log(JSON.stringify(info))
  await p.screenshot({ path: '/tmp/fill.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
