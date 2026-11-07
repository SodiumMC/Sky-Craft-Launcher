const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.easterEggFall())
  await p.waitForTimeout(1200)
  const info = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map((w) => ({
    url: w.webContents.getURL().split('?')[1] || '',
    op: w.getOpacity(),
    bounds: w.getBounds()
  })))
  console.log(JSON.stringify(info))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
