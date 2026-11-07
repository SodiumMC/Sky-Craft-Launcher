const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  try {
    await p.click('.picker-btn', { timeout: 5000 })
    console.log('picker opened:', (await p.locator('.picker-pop').count()) === 1)
    await p.locator('.picker-row').last().click({ timeout: 5000 })
    await p.waitForTimeout(500)
    console.log('selected:', await p.evaluate(() => window.scl.getState().then((s) => s.config.selectedVersion)))
  } catch (e) {
    console.log('FAIL:', e.message.split('\n')[0])
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
