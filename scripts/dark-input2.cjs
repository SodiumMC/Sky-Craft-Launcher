const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.saveConfig({ theme: 'dark' }))
  await p.evaluate(() => window.scl.openManager('settings'))
  await p.waitForTimeout(900)
  const info = await p.evaluate(() => Array.from(document.querySelectorAll('input')).map((el) => ({
    cls: el.className, val: el.value, bg: getComputedStyle(el).backgroundColor, appearance: getComputedStyle(el).appearance
  })).filter((x) => x.val === '854' || x.val === '480' || x.cls.includes('num')))
  console.log(JSON.stringify(info))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
