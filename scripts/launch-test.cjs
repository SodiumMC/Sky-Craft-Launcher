const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const page = await app.firstWindow()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.waitForSelector('.launch-btn', { timeout: 20000 })
  await page.waitForTimeout(800)
  await page.click('.launch-btn')
  await page.waitForTimeout(25000)
  const eyebrow = await page.locator('.hero-eyebrow').innerText().catch(() => 'n/a')
  const logs = await page.evaluate(() => window.scl.getRecentLogs())
  const tail = logs.slice(-25).map((l) => l.text)
  await page.screenshot({ path: '/tmp/ui-launch.png' })
  console.log('eyebrow:', eyebrow)
  console.log('tail:\n' + tail.join('\n'))
  console.log('pageerrors:', errs.slice(0, 5))
  await page.evaluate(() => window.scl.killGame()).catch(() => {})
  await page.waitForTimeout(1500)
  await app.close()
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
