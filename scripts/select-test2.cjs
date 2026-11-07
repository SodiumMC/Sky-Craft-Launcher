const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.click('.picker-btn', { force: true }); await p.waitForTimeout(300)
  await p.locator('.picker-row').nth(1).click({ force: true })
  await p.waitForTimeout(700)
  console.log('title:', await p.locator('.lc-title').innerText(), 'selected:', await p.evaluate(() => window.scl.getState().then((s) => s.config.selectedVersion)))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
