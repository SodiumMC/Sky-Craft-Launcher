const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('versions'))
  await p.waitForTimeout(900)
  await p.locator('.vtable.full .icon-btn[title="版本设置"]').first().click({ force: true })
  await p.waitForSelector('.version-settings', { timeout: 10000 })
  await p.locator('.version-tabs button:has-text("模组")').click({ force: true })
  await p.waitForTimeout(800)
  const info = await p.evaluate(() => {
    const el = document.querySelector('.version-mods .mods-panel')
    if (!el) return null
    const before = el.scrollTop
    el.scrollTop = el.scrollHeight
    return { sh: el.scrollHeight, ch: el.clientHeight, overflow: getComputedStyle(el).overflowY, scrolled: el.scrollTop > before }
  })
  console.log(JSON.stringify(info))
  await p.screenshot({ path: '/tmp/version-mods-scroll.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
