const { _electron: electron } = require('playwright-core')
;(async () => {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({ executablePath: require('electron'), args: ['.'], cwd: process.cwd(), env })
  const p = await app.firstWindow()
  await p.waitForSelector('.launch-card', { timeout: 20000 })
  let done = null
  p.evaluate(() => window.scl.install('1.0')).then((r) => { done = r })
  for (let i = 0; i < 50 && !done; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const logs = await p.evaluate(() => window.scl.getRecentLogs())
    const last = logs.slice(-1)[0]
    console.log(i, last ? last.text.slice(0, 120) : '...')
  }
  console.log('result:', JSON.stringify(done))
  if (done && !done.ok) {
    const logs = await p.evaluate(() => window.scl.getRecentLogs())
    console.log(logs.slice(-4).map((l) => l.text.slice(0, 220)).join('\n'))
  }
  await app.close().catch(() => {})
  process.exit(0)
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
