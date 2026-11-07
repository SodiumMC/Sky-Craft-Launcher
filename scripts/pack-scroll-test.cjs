const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.openManager('download'))
  await p.waitForTimeout(1200)
  await p.locator('.page.download .tabs button:has-text("资源包")').click({ force: true })
  await p.waitForTimeout(3000)
  const info = await p.evaluate(() => {
    const el = document.querySelector('.page.download .online-list')
    if (!el) return null
    const before = el.scrollTop
    el.scrollTop = el.scrollHeight
    return { rows: el.children.length, sh: el.scrollHeight, ch: el.clientHeight, overflow: getComputedStyle(el).overflowY, scrolled: el.scrollTop > before }
  })
  console.log(JSON.stringify(info))
  await p.screenshot({ path: '/tmp/packs-scroll.png' })
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
