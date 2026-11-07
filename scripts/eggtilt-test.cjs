const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.easterEggFall())
  await p.waitForTimeout(2600)
  const before = await app.evaluate(async ({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=eggFall'))
    return w.webContents.executeJavaScript('document.querySelector(".egg-piece")?.style.transform || "none"')
  })
  await app.evaluate(async ({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=eggFall'))
    await w.webContents.executeJavaScript(`window.dispatchEvent(new MouseEvent('mousemove', { clientX: innerWidth - 5, clientY: innerHeight - 60 }))`)
  })
  await p.waitForTimeout(1200)
  const after = await app.evaluate(async ({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=eggFall'))
    return w.webContents.executeJavaScript('document.querySelector(".egg-piece")?.style.transform || "none"')
  })
  console.log('before:', before)
  console.log('after :', after)
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
