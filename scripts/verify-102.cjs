const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.waitForSelector('.update-card', { timeout: 15000 })
  console.log((await p.locator('.update-card').innerText()).replace(/\n/g, ' | ').slice(0, 120))
  await p.screenshot({ path: '/tmp/update-102.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
