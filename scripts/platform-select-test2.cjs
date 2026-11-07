const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env, SCL_FAKE_PLATFORM: 'win32' }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.waitForSelector('.update-card', { timeout: 15000 })
  const win = await p.locator('.update-card button.primary').evaluate((b) => [b.dataset.platform, b.dataset.url])
  console.log('win32 button ->', win)
  await app.close().catch(() => {})
  process.exit(win[1] && win[1].endsWith('.zip') ? 0 : 1)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
