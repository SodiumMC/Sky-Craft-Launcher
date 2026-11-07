const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => { window.__clangs = 0; window.scl.onEggClang(() => { window.__clangs++ }) })
  await p.evaluate(() => window.scl.easterEggFall())
  await p.waitForTimeout(3500)
  console.log('clangs:', await p.evaluate(() => window.__clangs))
  const items = await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=eggFall'))
    return w ? w.webContents.executeJavaScript('document.querySelectorAll(".egg-piece").length') : -1
  })
  console.log('pieces:', items)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
