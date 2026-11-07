const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  await p.evaluate(() => window.scl.launch('1.0'))
  await p.waitForTimeout(6000)
  const logs = await p.evaluate(() => window.scl.getRecentLogs())
  console.log(logs.filter((l) => /classpath|libs=|denied/.test(l.text)).map((l) => l.text).join('\n'))
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
