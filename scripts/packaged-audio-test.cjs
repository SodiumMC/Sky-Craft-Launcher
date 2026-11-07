const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.easterEggFall())
  await p.waitForTimeout(3000)
  const res = await app.evaluate(async ({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=eggFall'))
    return w.webContents.executeJavaScript('JSON.stringify({ audio: window.__audioLen, played: window.__eggAudio || "none" })')
  })
  console.log(res)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
