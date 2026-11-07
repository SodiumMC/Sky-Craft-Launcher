const fs = require('fs')
const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.easterEggFall())
  await p.waitForTimeout(2200)
  const b64 = await app.evaluate(async ({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows().find((x) => x.webContents.getURL().includes('view=eggFall'))
    const img = await w.webContents.capturePage()
    return img.toPNG().toString('base64')
  })
  fs.writeFileSync('/tmp/eggfall.png', Buffer.from(b64, 'base64'))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
