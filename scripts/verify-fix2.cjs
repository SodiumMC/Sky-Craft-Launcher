const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 25000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1500)
  await p.locator('.page.download > .toolbar .tabs button:has-text("版本")').click({ force: true })
  await p.waitForTimeout(1800)
  const row = p.locator('.list-row', { hasText: '1.21.8' }).first()
  console.log('row count:', await row.count())
  if (await row.count()) {
    await row.click({ force: true })
    await p.waitForTimeout(800)
    console.log('buttons:', await p.locator('.detail-pane button').allInnerTexts())
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
