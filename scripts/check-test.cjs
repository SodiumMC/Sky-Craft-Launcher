const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const page = await app.firstWindow()
  await page.waitForSelector('.launch-card', { timeout: 20000 })
  const res = await Promise.race([
    page.evaluate(() => window.scl.checkVersion('1.21.1-Fabric')),
    new Promise((r) => setTimeout(() => r('TIMEOUT'), 15000))
  ])
  console.log('check result:', JSON.stringify(res))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
