const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(2500)
  const before = await p.locator('.detail-pane').innerText().catch(() => '')
  try {
    await p.locator('.list-row').nth(2).click({ timeout: 5000 })
    await p.waitForTimeout(500)
    const after = await p.locator('.detail-pane').innerText().catch(() => '')
    console.log('changed:', before.slice(0, 20), '->', after.slice(0, 20))
  } catch (e) {
    console.log('click FAIL:', e.message.split('\n').slice(0, 12).join(' | '))
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
