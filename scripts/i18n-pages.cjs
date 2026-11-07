const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.waitForTimeout(800)
  for (const view of ['home', 'download', 'versions', 'saves', 'servers', 'settings', 'logs']) {
    if (view === 'home') { await p.evaluate(() => window.scl.focusHome()) }
    else { await p.evaluate((v) => window.scl.openManager(v), view) }
    await p.waitForTimeout(1200)
    const lines = await p.evaluate(() => document.body.innerText.split('\n').map(s => s.trim()).filter(s => /[\u4e00-\u9fa5]/.test(s)))
    console.log(`\n== ${view} (${lines.length})`)
    console.log([...new Set(lines)].slice(0, 15).join(' | '))
    await p.screenshot({ path: `/tmp/en-${view}.png` })
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
