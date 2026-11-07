const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.click('.home-dock .dock-item:has-text("下载")')
  await p.waitForSelector('.manager-dock', { timeout: 20000 })
  await p.waitForTimeout(2200)
  await p.click('.tabs button:has-text("模组")')
  await p.fill('.mod-search input', 'sodium')
  await p.click('.mod-search .btn.primary')
  await p.waitForTimeout(4500)
  const imgOk = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('.mod-hit img')]
    return { count: imgs.length, loaded: imgs.filter((i) => i.naturalWidth > 0).length }
  })
  console.log('icons:', JSON.stringify(imgOk))
  await p.screenshot({ path: '/tmp/mods-online.png' })

  await p.click('.manager-dock .dock-item:has-text("版本")')
  await p.waitForTimeout(800)
  await p.click('.vtable.full .icon-btn[title="版本设置"]')
  await p.waitForSelector('.version-settings', { timeout: 10000 })
  await p.click('.version-tabs button:has-text("模组")')
  await p.waitForTimeout(500)
  console.log('local rows:', await p.locator('.version-mods .vtable tbody tr').count())
  await p.screenshot({ path: '/tmp/version-mods.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
