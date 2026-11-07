const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  const winPromise = app.waitForEvent('window')
  await p.evaluate(() => window.scl.openLoginWindow({ userCode: 'WXYZ-1234', verificationUri: 'https://microsoft.com/link' }))
  const w = await winPromise
  await w.waitForSelector('.login-code', { timeout: 10000 })
  await w.waitForTimeout(300)
  await w.screenshot({ path: '/tmp/login-window2.png' })
  await p.evaluate(() => window.scl.closeLoginWindow())
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
