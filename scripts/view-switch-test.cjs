const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  let navs = 0
  p.on('framenavigated', () => navs++)
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.click('.home-dock .dock-item:has-text("下载")')
  await p.waitForTimeout(700)
  console.log('manager visible:', await p.locator('.view.on .manager-dock').count(), 'navs:', navs)
  console.log('inner:', await p.evaluate(() => [innerWidth, innerHeight]))
  await p.screenshot({ path: '/tmp/switch-manager.png' })
  await p.click('.view.on .manager-dock .dock-item:has-text("启动")')
  await p.waitForTimeout(700)
  console.log('home visible:', await p.locator('.view.on .launch-card').count(), 'inner:', await p.evaluate(() => [innerWidth, innerHeight]))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
