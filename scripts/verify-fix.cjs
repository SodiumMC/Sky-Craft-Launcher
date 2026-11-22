const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: '/Applications/SCL.app/Contents/MacOS/SCL', env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 25000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1500)
  console.log('tabs:', await p.locator('.page.download > .toolbar .tabs button').allInnerTexts())
  await p.locator('.page.download > .toolbar .tabs button:has-text("版本")').click({ force: true })
  await p.waitForTimeout(1000)
  const clicked = await p.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.list-row'))
    const hit = rows.find(r => (r.textContent || '').includes('1.21.8'))
    if (hit) { hit.click(); return true }
    return false
  })
  await p.waitForTimeout(600)
  console.log('clicked installed:', clicked)
  console.log('detail buttons:', await p.locator('.detail-pane button').allInnerTexts())
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
