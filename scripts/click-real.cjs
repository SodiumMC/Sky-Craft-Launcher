const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.waitForSelector('.update-card', { timeout: 15000 })
  try {
    await p.click('.update-card button:has-text("下载更新")', { timeout: 5000 })
    await p.waitForTimeout(1200)
    console.log('download click ok, status:', await p.locator('.update-status').innerText().catch(() => '(none)'))
  } catch (e) {
    console.log('download click FAIL:', e.message.split('\n')[0])
  }
  await p.evaluate(() => window.scl.openManager('settings'))
  await p.waitForTimeout(800)
  try {
    await p.click('button:has-text("检查更新")', { timeout: 5000 })
    console.log('check click ok:', await p.locator('.sgroup.about small').last().innerText().catch(() => ''))
  } catch (e) {
    console.log('check click FAIL:', e.message.split('\n')[0])
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
