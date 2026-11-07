const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const page = await app.firstWindow()
  const errors = []
  page.on('pageerror', (e) => errors.push('page: ' + e.message))
  await page.waitForSelector('.launch-card', { timeout: 20000 })
  await page.waitForTimeout(1400)
  await page.addStyleTag({ content: 'html,body{background:radial-gradient(1000px 700px at 28% 18%,#e3ebf6 0%,#cbd7e7 55%,#b7c7dc 100%) !important;}' })
  await page.waitForTimeout(250)
  console.log('launch title:', await page.locator('.lc-title').innerText())
  await page.screenshot({ path: '/tmp/home.png' })

  await page.click('.home-dock .dock-item:has-text("下载")')
  await page.waitForSelector('.manager-dock', { timeout: 20000 })
  await page.waitForTimeout(2400)
  await page.screenshot({ path: '/tmp/manager-download.png' })

  const notifPromise = app.waitForEvent('window')
  await page.evaluate(() => window.scl.notify('success', '日志已复制'))
  const notif = await notifPromise
  await page.waitForTimeout(600)
  await notif.screenshot({ path: '/tmp/notification.png' })
  await notif.click('.notif-x')
  await page.waitForTimeout(700)

  await page.click('.manager-dock .dock-item:has-text("版本")')
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/tmp/manager-versions.png' })
  await page.click('.manager-dock .dock-item:has-text("设置")')
  await page.waitForTimeout(600)
  await page.screenshot({ path: '/tmp/manager-settings.png' })
  console.log('windows:', app.windows().length, 'errors:', errors.slice(0, 5))
  await app.close()
})().catch((e) => { console.error('FAIL', e); process.exit(1) })
